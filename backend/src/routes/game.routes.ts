import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import {
  addGame,
  changeStatus,
  getBacklog,
  getCompleted,
  getDashboard,
  getPlaying,
  searchGames,
  unvote,
  vote,
} from "../controllers/game.controller.js";

export const gameRoutes = Router();

gameRoutes.use(authMiddleware);

gameRoutes.get("/search", searchGames);
gameRoutes.post("/", addGame);
gameRoutes.get("/backlog", getBacklog);
gameRoutes.get("/completed", getCompleted);
gameRoutes.get("/playing", getPlaying);
gameRoutes.get("/dashboard", getDashboard);
gameRoutes.patch("/:id/status", changeStatus);
gameRoutes.post("/:id/vote", vote);
gameRoutes.delete("/:id/vote", unvote);