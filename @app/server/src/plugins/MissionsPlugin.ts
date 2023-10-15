import { addDays, subDays } from "date-fns";
import { gql, makeExtendSchemaPlugin, Resolvers } from "graphile-utils";

import { OurGraphQLContext } from "../graphile.config";
import { ERROR_MESSAGE_OVERRIDES } from "../utils/handleErrors";

const MissionsPlugin = makeExtendSchemaPlugin((build) => {
  const typeDefs = gql`
    """
    All input for the \`completeMission\` mutation.
    """
    input CompleteMissionInput {
      """
      The exact same \`clientMutationId\` that was provided in the mutation input,
      unchanged and unused. May be used by a client to track mutations.
      """
      clientMutationId: String

      missionId: UUID!

      proofImageUrl: String!
    }

    """
    The output of our \`completeMission\` mutation.
    """
    type CompleteMissionPayload {
      """
      The exact same \`clientMutationId\` that was provided in the mutation input,
      unchanged and unused. May be used by a client to track mutations.
      """
      clientMutationId: String

      missionParticipant: MissionParticipant! @pgField
    }

    extend type Mutation {
      """
      Use this mutation to complete a mission.
      """
      completeMission(input: CompleteMissionInput!): CompleteMissionPayload
    }
  `;
  const resolvers: Resolvers = {
    Mutation: {
      async completeMission(
        _mutation,
        args,
        context: OurGraphQLContext,
        resolveInfo
      ) {
        const { selectGraphQLResultFromTable } = resolveInfo.graphile;
        const { missionId, proofImageUrl } = args.input;
        const { rootPgPool, pgClient } = context;

        // Start a sub-transaction
        await pgClient.query("SAVEPOINT completeMission");
        try {
          const now = new Date();

          const {
            rows: [currentUser],
          } = await pgClient.query(
            "select id, is_verified from app_public.users where id = app_public.current_user_id()"
          );

          if (!currentUser) {
            throw Object.assign(new Error("User not logged in."), {
              code: "INVALIDREQUEST",
            });
          }

          const {
            rows: [mission],
          } = await rootPgPool.query(
            `select * from app_public.missions where id = $1`,
            [missionId]
          );

          if (!mission || mission.period !== "DAILY") {
            throw Object.assign(new Error("No such daily mission."), {
              code: "INVALIDREQUEST",
            });
          }

          const missionDate = new Date(mission.day);
          if (now < subDays(missionDate, 1) || now > addDays(missionDate, 1)) {
            throw Object.assign(
              new Error("Can't complete this mission right now."),
              {
                code: "INVALIDREQUEST",
              }
            );
          }

          const {
            rows: [missionParticipant],
          } = await rootPgPool.query(
            `
              insert into app_public.mission_participants (
                mission_id,
                user_id,
                proof_image_url
              ) values (
                $1::uuid,
                $2::uuid,
                $3
              ) returning *
            `,
            [missionId, currentUser.id, proofImageUrl]
          );

          const sql = build.pgSql;
          const [row] = await selectGraphQLResultFromTable(
            sql.fragment`app_public.mission_participants`,
            (tableAlias, sqlBuilder) => {
              sqlBuilder.where(
                sql.fragment`${tableAlias}.id = ${sql.value(
                  missionParticipant.id
                )}`
              );
            }
          );
          return {
            data: row,
          };
        } catch (e: any) {
          await pgClient.query("ROLLBACK TO SAVEPOINT completeMission");
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
            throw Object.assign(new Error("Complete mission request failed!"), {
              code,
            });
          }
        } finally {
          // Release our savepoint so it doesn't conflict with other mutations
          await pgClient.query("RELEASE SAVEPOINT completeMission");
        }
      },
    },
  };
  return {
    typeDefs,
    resolvers,
  };
});

export default MissionsPlugin;
