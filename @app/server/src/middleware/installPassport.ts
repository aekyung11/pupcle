import { Express, RequestHandler } from "express";
import { get } from "lodash";
import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";

import { getWebsocketMiddlewares } from "../app";
import installPassportStrategy from "./installPassportStrategy";

interface DbSession {
  session_id: string;
}

export default async (app: Express) => {
  passport.serializeUser((sessionObject: DbSession, done) => {
    done(null, sessionObject.session_id);
  });

  passport.deserializeUser((session_id: string, done) => {
    done(null, { session_id });
  });

  const passportInitializeMiddleware = passport.initialize();
  app.use(passportInitializeMiddleware);
  getWebsocketMiddlewares(app).push(passportInitializeMiddleware);

  const passportSessionMiddleware = passport.session();

  const wrappedPassportSessionMiddleware: RequestHandler = (req, res, next) => {
    // https://stackoverflow.com/questions/21264911/prevent-expressjs-from-creating-a-session-when-requests-contain-an-authorization
    if (req.headers.authorization) {
      return next();
    }

    if (req.isSameOrigin) {
      passportSessionMiddleware(req, res, next);
    } else {
      next();
    }
  };

  app.use(wrappedPassportSessionMiddleware);
  getWebsocketMiddlewares(app).push(wrappedPassportSessionMiddleware);

  app.get("/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });

  if (process.env.GITHUB_KEY) {
    await installPassportStrategy(
      app,
      "github",
      GitHubStrategy,
      {
        clientID: process.env.GITHUB_KEY,
        clientSecret: process.env.GITHUB_SECRET,
        scope: ["user:email"],
      },
      {},
      async (profile, _accessToken, _refreshToken, _extra, _req) => ({
        id: profile.id,
        displayName: profile.displayName || "",
        username: profile.username,
        avatarUrl: get(profile, "photos.0.value"),
        email: profile.email || get(profile, "emails.0.value"),
      }),
      ["token", "tokenSecret"]
    );
  }
};
