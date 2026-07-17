import express, { Express } from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import routes from "./routes";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler";
import { env } from "./config/env";

export function createApp(): Express {
  const app = express();

  const allowedOrigins = env.clientUrl.split(",").map((o) => o.trim());
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  if (env.nodeEnv !== "test") {
    app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));
  }

  app.use("/api", routes);

  app.get("/", (_req, res) => {
    res.json({ name: "ShopX API", status: "running" });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
