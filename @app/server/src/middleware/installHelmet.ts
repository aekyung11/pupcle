import { s3Host, uploadBucket } from "@app/config";
import { Express } from "express";
// @ts-ignore
import type { HelmetOptions } from "helmet" assert { "resolution-mode": "import" };

const tmpRootUrl = process.env.ROOT_URL;

if (!tmpRootUrl || typeof tmpRootUrl !== "string") {
  throw new Error("Envvar ROOT_URL is required.");
}
const ROOT_URL = tmpRootUrl;

const isDev = process.env.NODE_ENV === "development";

export default async function installHelmet(app: Express) {
  const { default: helmet, contentSecurityPolicy } = await import("helmet");

  const options: HelmetOptions = {
    contentSecurityPolicy: {
      directives: {
        ...contentSecurityPolicy.getDefaultDirectives(),
        "connect-src": [
          "'self'",
          // Safari doesn't allow using wss:// origins as 'self' from
          // an https:// page, so we have to translate explicitly for
          // it.
          ROOT_URL.replace(/^http/, "ws"),
          isDev ? s3Host! : `${uploadBucket}.${s3Host}`!,
          "https://dapi.kakao.com/",
          "https://storage.googleapis.com/tfjs-models/",
        ],
        "img-src": [
          ...contentSecurityPolicy.getDefaultDirectives()["img-src"],
          isDev ? s3Host! : `${uploadBucket}.${s3Host}`!,
          "*.daumcdn.net",
          "blob:",
        ],
        "script-src": [
          "'self'",
          "https://dapi.kakao.com/",
          "http://dapi.kakao.com/",
          "https://*.daumcdn.net/",
          "http://*.daumcdn.net/",
          // for kakao maps
          // Dev needs 'unsafe-eval' due to
          // https://github.com/vercel/next.js/issues/14221
          "'unsafe-eval'",
        ],
      },
    },
    crossOriginEmbedderPolicy: false,
  };
  app.use(helmet(options));
}
