import { Express, static as staticMiddleware } from "express";

export default (app: Express) => {
  const oneHourInMs = 60 * 60 * 1000;
  app.use(
    staticMiddleware(`${__dirname}/../../public`, { maxAge: oneHourInMs })
  );
};
