// @ts-ignore
const packageJson = require("../../../package.json");

// TODO: customise this with your own settings!

export const fromEmail =
  '"PostGraphile Starter" <no-reply@examples.graphile.org>';
export const awsRegion = "us-west-2";
export const uploadBucket = process.env.AWS_BUCKET_UPLOAD;
export const s3Host = process.env.S3_HOST;
export const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID;
export const s3SecretKey = process.env.S3_SECRET_KEY;
export const projectName = packageJson.projectName.replace(/[-_]/g, " ");
export const companyName = projectName; // For copyright ownership
export const emailLegalText =
  // Envvar here so we can override on the demo website
  process.env.LEGAL_TEXT || "<Insert legal email footer text here >";
