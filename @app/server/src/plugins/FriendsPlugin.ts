import { gql, makeExtendSchemaPlugin, Resolvers } from "graphile-utils";

import { OurGraphQLContext } from "../graphile.config";
import { ERROR_MESSAGE_OVERRIDES } from "../utils/handleErrors";

const FriendsPlugin = makeExtendSchemaPlugin((build) => {
  const typeDefs = gql`
    """
    All input for the \`acceptFriendRequest\` mutation.
    """
    input AcceptFriendRequestInput {
      """
      The exact same \`clientMutationId\` that was provided in the mutation input,
      unchanged and unused. May be used by a client to track mutations.
      """
      clientMutationId: String

      fromUserId: UUID!
    }

    """
    The output of our \`acceptFriendRequest\` mutation.
    """
    type AcceptFriendRequestPayload {
      """
      The exact same \`clientMutationId\` that was provided in the mutation input,
      unchanged and unused. May be used by a client to track mutations.
      """
      clientMutationId: String

      fromUser: User! @pgField
    }

    extend type Mutation {
      """
      Use this mutation to accept a friend request made to yourself.
      """
      acceptFriendRequest(
        input: AcceptFriendRequestInput!
      ): AcceptFriendRequestPayload
    }
  `;
  const resolvers: Resolvers = {
    Mutation: {
      async acceptFriendRequest(
        _mutation,
        args,
        context: OurGraphQLContext,
        resolveInfo
      ) {
        const { selectGraphQLResultFromTable } = resolveInfo.graphile;
        const { fromUserId } = args.input;
        const { rootPgPool, pgClient } = context;

        // Start a sub-transaction
        await pgClient.query("SAVEPOINT acceptFriendRequest");
        try {
          const {
            rows: [friendRequest],
          } = await pgClient.query<{
            from_user_id: string;
            to_user_id: string;
          }>(
            "select from_user_id, to_user_id from app_public.friend_requests where from_user_id = $1 and to_user_id = app_public.current_user_id()",
            [fromUserId]
          );
          if (!friendRequest) {
            throw Object.assign(new Error("Friend request doesn't exist."), {
              code: "INVALIDREQUEST",
            });
          }

          await rootPgPool.query(
            `
              insert into app_public.user_edges (
                from_user_id,
                to_user_id,
                daily_records_shared
              ) values (
                $1::uuid,
                $2::uuid,
                $3
              ) returning *
            `,
            [friendRequest.from_user_id, friendRequest.to_user_id, "SUMMARY"]
          );

          await rootPgPool.query(
            `
              insert into app_public.user_edges (
                from_user_id,
                to_user_id,
                daily_records_shared
              ) values (
                $1::uuid,
                $2::uuid,
                $3
              ) returning *
            `,
            [friendRequest.to_user_id, friendRequest.from_user_id, "SUMMARY"]
          );

          await pgClient.query(
            "delete from app_public.friend_requests where from_user_id = $1 and to_user_id = app_public.current_user_id()",
            [fromUserId]
          );

          const sql = build.pgSql;
          const [row] = await selectGraphQLResultFromTable(
            sql.fragment`app_public.users`,
            (tableAlias, sqlBuilder) => {
              sqlBuilder.where(
                sql.fragment`${tableAlias}.id = ${sql.value(fromUserId)}`
              );
            }
          );
          return {
            data: row,
          };
        } catch (e: any) {
          await pgClient.query("ROLLBACK TO SAVEPOINT acceptFriendRequest");
          const { code } = e;
          const safeErrorCodes = [
            "INVALIDREQUEST",
            "LOCKD",
            "EMTKN",
            ...Object.keys(ERROR_MESSAGE_OVERRIDES),
          ];
          if (safeErrorCodes.includes(code)) {
            throw e;
          } else {
            console.error(e);
            throw Object.assign(new Error("Accept friend request failed!"), {
              code,
            });
          }
        } finally {
          // Release our savepoint so it doesn't conflict with other mutations
          await pgClient.query("RELEASE SAVEPOINT acceptFriendRequest");
        }
      },
    },
  };
  return {
    typeDefs,
    resolvers,
  };
});

export default FriendsPlugin;
