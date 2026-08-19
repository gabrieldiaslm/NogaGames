import cors from "cors";
import express from "express";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { authRoutes } from "./routes/auth.routes.js";
import { gameRoutes } from "./routes/game.routes.js";

function isRenderOrigin(origin: string): boolean {
  try {
    const host = new URL(origin).hostname;
    return host === "onrender.com" || host.endsWith(".onrender.com");
  } catch {
    return false;
  }
}

export function createApp(): express.Express {
  const app = express();

  const configuredOrigins = (process.env.FRONTEND_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const isRenderDeploy = process.env.RENDER === "1";

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || configuredOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        if (isRenderDeploy && isRenderOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
    }),
  );

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/auth", authRoutes);
  app.use("/games", gameRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}