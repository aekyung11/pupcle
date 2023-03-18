import { Express, RequestHandler } from "express";
import { expressjwt } from "express-jwt";

import { getWebsocketMiddlewares } from "../app";

const { JWT_SECRET } = process.env;
if (!JWT_SECRET) {
  throw new Error("Server misconfigured");
}

declare module "express-serve-static-core" {
  interface Request {
    tokenPayload?: Express.User;
  }
}

export default (app: Express) => {
  const expressJwtMiddleware: RequestHandler = expressjwt({
    secret: JWT_SECRET,
    requestProperty: "tokenPayload",
    algorithms: ["HS256"],
    credentialsRequired: false, // the database will take care of this
  });

  const loginWithExpressJwtMiddleware: RequestHandler = async (
    req,
    res,
    next
  ) => {
    const tokenPayload = req.tokenPayload;
    if (!tokenPayload || !tokenPayload.session_id) {
      return next();
    }
    await req.login(
      { session_id: tokenPayload.session_id },
      { session: false },
      (err) => {
        if (err) {
          next(err);
        }
      }
    );
    return next();
  };

  app.use(expressJwtMiddleware, loginWithExpressJwtMiddleware);

  getWebsocketMiddlewares(app).push(expressJwtMiddleware);
  getWebsocketMiddlewares(app).push(loginWithExpressJwtMiddleware);
};
