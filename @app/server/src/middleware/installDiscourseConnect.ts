import DiscourseSso from "discourse-sso";
import { Express, Request, RequestHandler } from "express";

import { getRootPgPool } from "./installDatabasePools";

export default async (app: Express) => {
  app.get("/discourse/sso", async (req, res) => {
    const discourseSso = new DiscourseSso(process.env.DISCOURSE_SSO_SECRET);
    const { sso, sig }: { sso?: string; sig?: string } = req.query;

    if (!req.user?.session_id) {
      res.redirect(
        `${process.env.ROOT_URL}/login?next=${encodeURIComponent("/circle")}`
      );
      return;
    }

    const rootPgPool = getRootPgPool(app);

    const {
      rows: [session],
    } = await rootPgPool.query(
      "select * from app_private.sessions where uuid = $1",
      [req.user.session_id]
    );

    if (!session?.user_id) {
      res.redirect(
        `${process.env.ROOT_URL}/login?next=${encodeURIComponent("/circle")}`
      );
      return;
    }

    console.log({ sso, sig });

    if (!discourseSso.validate(sso, sig)) {
      throw new Error("discourse sso request not valid");
    }

    const {
      rows: [user],
    } = await rootPgPool.query(
      process.env.NODE_ENV === "production"
        ? `select * from app_public.users where id = $1 and is_verified = true`
        : `select * from app_public.users where id = $1`,
      [session.user_id]
    );

    if (!user || !user.id) {
      throw new Error("Verified user not found");
    }

    const {
      rows: [userEmail],
    } = await rootPgPool.query(
      process.env.NODE_ENV === "production"
        ? `select * from app_public.user_emails where user_id = $1 and is_primary = true`
        : `select * from app_public.user_emails where user_id = $1`,
      [session.user_id]
    );

    if (!userEmail) {
      throw new Error("Verified email not found");
    }

    const nonce = discourseSso.getNonce(sso);

    const userParams = {
      nonce,
      external_id: user.id,
      email: userEmail.email,
      username: user.username,
      name: user.nickname,
      ...(user.avatar_url && {
        avatar_url: user.avatar_url,
      }),
    };

    const responseQuery = discourseSso.buildLoginString(userParams);

    res.redirect(
      `${process.env.DISCOURSE_URL}/session/sso_login?${responseQuery}`
    );
  });
};

// interface DbSession {
//   uuid: string;
//   user_id: string;
//   created_at: Date;
//   last_active: Date;
// }

// export interface UserSpec {
//   id: string;
//   displayName: string;
//   username: string;
//   avatarUrl?: string;
//   email: string;
//   profile?: any;
//   auth?: any;
// }

// export type GetUserInformationFunction = (
//   profile: any,uo
//   accessToken: string,
//   refreshToken: string,
//   extra: any,
//   req: Request
// ) => UserSpec | Promise<UserSpec>;

// /*
//  * Add returnTo property using [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html).
//  */
// declare module "express-session" {
//   interface SessionData {
//     returnTo?: string;
//   }
// }

// /*
//  * Stores where to redirect the user to on authentication success.
//  * Tries to avoid redirect loops or malicious redirects.
//  */
// const setReturnTo: RequestHandler = (req, _res, next) => {
//   const BLOCKED_REDIRECT_PATHS = /^\/+(|auth.*|logout)(\?.*)?$/;
//   if (!req.session) {
//     next();
//     return;
//   }
//   const returnTo =
//     (req.query && req.query.next && String(req.query.next)) ||
//     req.session.returnTo;
//   if (
//     returnTo &&
//     returnTo[0] === "/" &&
//     returnTo[1] !== "/" && // Prevent protocol-relative URLs
//     !returnTo.match(BLOCKED_REDIRECT_PATHS)
//   ) {
//     req.session.returnTo = returnTo;
//   } else {
//     delete req.session.returnTo;
//   }
//   next();
// };

// export default (
//   app: Express,
//   service: string,
//   Strategy: new (...args: any) => passport.Strategy,
//   strategyConfig: any,
//   authenticateConfig: any,
//   getUserInformation: GetUserInformationFunction,
//   tokenNames = ["accessToken", "refreshToken"],
//   {
//     preRequest = (_req: Request) => {},
//     postRequest = (_req: Request) => {},
//   } = {}
// ) => {
//   const rootPgPool = getRootPgPool(app);

//   passport.use(
//     new Strategy(
//       {
//         ...strategyConfig,
//         callbackURL: `${process.env.ROOT_URL}/auth/${service}/callback`,
//         passReqToCallback: true,
//       },
//       async (
//         req: Request,
//         accessToken: string,
//         refreshToken: string,
//         extra: any,
//         profile: any,
//         done: (error: any, user?: any) => void
//       ) => {
//         try {
//           const userInformation = await getUserInformation(
//             profile,
//             accessToken,
//             refreshToken,
//             extra,
//             req
//           );
//           if (!userInformation.id) {
//             throw new Error(
//               `getUserInformation must return a unique id for each user`
//             );
//           }
//           let session: DbSession | null = null;
//           if (req.user && req.user.session_id) {
//             ({
//               rows: [session],
//             } = await rootPgPool.query<DbSession>(
//               "select * from app_private.sessions where uuid = $1",
//               [req.user.session_id]
//             ));
//           }
//           const {
//             rows: [user],
//           } = await rootPgPool.query(
//             `select * from app_private.link_or_register_user($1, $2, $3, $4, $5)`,
//             [
//               session ? session.user_id : null,
//               service,
//               userInformation.id,
//               JSON.stringify({
//                 username: userInformation.username,
//                 avatar_url: userInformation.avatarUrl,
//                 email: userInformation.email,
//                 name: userInformation.displayName,
//                 ...userInformation.profile,
//               }),
//               JSON.stringify({
//                 [tokenNames[0]]: accessToken,
//                 [tokenNames[1]]: refreshToken,
//                 ...userInformation.auth,
//               }),
//             ]
//           );
//           if (!user || !user.id) {
//             throw Object.assign(new Error("Registration failed"), {
//               code: "FFFFF",
//             });
//           }
//           if (!session) {
//             ({
//               rows: [session],
//             } = await rootPgPool.query<DbSession>(
//               `insert into app_private.sessions (user_id) values ($1) returning *`,
//               [user.id]
//             ));
//           }
//           if (!session) {
//             throw Object.assign(new Error("Failed to create session"), {
//               code: "FFFFF",
//             });
//           }
//           done(null, { session_id: session.uuid });
//         } catch (e: any) {
//           done(e);
//         }
//       }
//     )
//   );

//   app.get(`/auth/${service}`, setReturnTo, async (req, res, next) => {
//     try {
//       await preRequest(req);
//     } catch (e: any) {
//       next(e);
//       return;
//     }
//     const realAuthDetails =
//       typeof authenticateConfig === "function"
//         ? authenticateConfig(req)
//         : authenticateConfig;
//     const step1Middleware = passport.authenticate(service, realAuthDetails);
//     step1Middleware(req, res, next);
//   });

//   const step2Middleware = passport.authenticate(service, {
//     failureRedirect: "/login",
//     successReturnToOrRedirect: "/",
//   });

//   app.get(`/auth/${service}/callback`, async (req, res, next) => {
//     try {
//       await postRequest(req);
//     } catch (e: any) {
//       next(e);
//       return;
//     }
//     step2Middleware(req, res, next);
//   });
// };
