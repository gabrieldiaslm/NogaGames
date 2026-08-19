import cors from "cors";
import express from "express";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { authRoutes } from "./routes/auth.routes.js";
import { gameRoutes } from "./routes/game.routes.js";

export function createApp(): express.Express {
  const app = express();

  const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://localhost:5173";
  app.use(cors({ origin: frontendOrigin }));

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