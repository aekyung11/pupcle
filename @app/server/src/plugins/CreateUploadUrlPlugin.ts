import {
  awsRegion,
  s3AccessKeyId,
  s3Host,
  s3SecretKey,
  uploadBucket,
} from "@app/config";
import * as aws from "aws-sdk";
import { gql, makeExtendSchemaPlugin } from "graphile-utils";
import { PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";

import { OurGraphQLContext } from "../graphile.config";

const isDev = process.env.NODE_ENV !== "production";

enum AllowedUploadContentType {
  APPLICATION_PDF = "application/pdf",
  IMAGE_APNG = "image/apng",
  IMAGE_BMP = "image/bmp",
  IMAGE_GIF = "image/gif",
  IMAGE_JPEG = "image/jpeg",
  IMAGE_PNG = "image/png",
  IMAGE_SVG_XML = "image/svg+xml",
  IMAGE_TIFF = "image/tiff",
  IMAGE_WEBP = "image/webp",
  VIDEO_MP4 = "video/mp4",
  VIDEO_QUICKTIME = "video/quicktime",
}

interface CreateUploadUrlInput {
  clientMutationId?: string;
  contentType: AllowedUploadContentType;
  fileName?: string;
}

/** The minimal set of information that this plugin needs to know about users. */
interface User {
  id: string;
  isVerified: boolean;
}

async function getCurrentUser(pool: PoolClient): Promise<User | null> {
  // see note here about the savepoint https://github.com/graphile/starter/pull/167
  // Yes, the savepoint should have a name. The whole getCurrentUser function doesn't currently make sense; e.g. there's no point doing pool.query('savepoint...') because the client you pool.query('release savepoint...') from may not be the same client that created the savepoint.
  await pool.query("SAVEPOINT create_upload_url");
  try {
    const {
      rows: [row],
    } = await pool.query(
      "select id, is_verified from app_public.users where id = app_public.current_user_id()"
    );
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      isVerified: row.is_verified,
    };
  } catch (err) {
    await pool.query("ROLLBACK TO SAVEPOINT create_upload_url");
    throw err;
  } finally {
    await pool.query("RELEASE SAVEPOINT create_upload_url");
  }
}

const CreateUploadUrlPlugin = makeExtendSchemaPlugin(() => ({
  typeDefs: gql`
    """
    The set of content types that we allow users to upload.
    """
    enum AllowedUploadContentType {
      """
      application/pdf
      """
      APPLICATION_PDF
      """
      image/apng
      """
      IMAGE_APNG
      """
      image/bmp
      """
      IMAGE_BMP
      """
      image/gif
      """
      IMAGE_GIF
      """
      image/jpeg
      """
      IMAGE_JPEG
      """
      image/png
      """
      IMAGE_PNG
      """
      image/svg+xml
      """
      IMAGE_SVG_XML
      """
      image/tiff
      """
      IMAGE_TIFF
      """
      image/webp
      """
      IMAGE_WEBP
      """
      video/mp4
      """
      VIDEO_MP4
      """
      video/quicktime
      """
      VIDEO_QUICKTIME
    }

    """
    All input for the \`createUploadUrl\` mutation.
    """
    input CreateUploadUrlInput @scope(isMutationInput: true) {
      """
      An arbitrary string value with no semantic meaning. Will be included in the
      payload verbatim. May be used to track mutations by the client.
      """
      clientMutationId: String

      """
      You must provide the content type (or MIME type) of the content you intend
      to upload. For further information about content types, see
      https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
      """
      contentType: AllowedUploadContentType!

      """
      Optional file name to set on the object.
      """
      fileName: String
    }

    """
    The output of our \`createUploadUrl\` mutation.
    """
    type CreateUploadUrlPayload @scope(isMutationPayload: true) {
      """
      The exact same \`clientMutationId\` that was provided in the mutation input,
      unchanged and unused. May be used by a client to track mutations.
      """
      clientMutationId: String

      """
      Upload content to this signed URL.
      """
      uploadUrl: String!
    }

    extend type Mutation {
      """
      Get a signed URL for uploading files. It will expire in 5 minutes.
      """
      createUploadUrl(
        """
        The exclusive input argument for this mutation. An object type, make sure to see documentation for this object’s fields.
        """
        input: CreateUploadUrlInput!
      ): CreateUploadUrlPayload
    }
  `,
  resolvers: {
    Mutation: {
      async createUploadUrl(
        _query,
        args: { input: CreateUploadUrlInput },
        context: OurGraphQLContext,
        _resolveInfo
      ) {
        if (!uploadBucket || !s3Host || !s3AccessKeyId || !s3SecretKey) {
          const err = new Error(
            "Server misconfigured: missing `AWS_BUCKET_UPLOAD` envvar"
          );
          // @ts-ignore
          err.code = "MSCFG";
          throw err;
        }

        const user = await getCurrentUser(context.pgClient);

        if (!user) {
          const err = new Error("Login required");
          // @ts-ignore
          err.code = "LOGIN";
          throw err;
        }

        // TODO: enable this later about verifying users
        if (!isDev && !user.isVerified) {
          const err = new Error("Only verified users may upload files");
          // @ts-ignore
          err.code = "DNIED";
          throw err;
        }

        const { input } = args;
        const contentType: string =
          AllowedUploadContentType[
            input.contentType as unknown as keyof typeof AllowedUploadContentType
          ];
        const fileName: string | undefined = input.fileName || undefined;
        const ContentDisposition: string | undefined =
          fileName && `inline; filename="${fileName}"`;
        const s3 = new aws.S3({
          // TODO: change these in production, maybe unneeded if we stick with DigitalOcean Spaces
          ...(!isDev && {
            region: awsRegion,
          }),
          signatureVersion: "v4",
          ...(isDev && { endpoint: s3Host }),
          accessKeyId: s3AccessKeyId,
          secretAccessKey: s3SecretKey,
          s3ForcePathStyle: isDev,
          sslEnabled: !isDev,
        });
        const params = isDev
          ? {
              Bucket: uploadBucket,
              ContentType: contentType,
              Key: `${user.id}/${uuidv4()}`,
              Expires: 300, // signed URL will expire in 5 minutes
              ContentDisposition,
            }
          : {
              Bucket: uploadBucket,
              ContentType: contentType,
              // TODO: change these in production
              // randomly generated filename, nested under username directory
              Key: `${user.id}/${uuidv4()}`,
              Expires: 300, // signed URL will expire in 5 minutes
              ContentDisposition,
            };
        const signedUrl = await s3.getSignedUrlPromise("putObject", params);
        console.log({ signedUrl, params });
        return {
          clientMutationId: input.clientMutationId,
          uploadUrl: signedUrl,
        };
      },
    },
  },
}));

export default CreateUploadUrlPlugin;
