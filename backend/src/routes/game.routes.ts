import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import {
  addGame,
  changeStatus,
  deleteGame,
  getPlaying,
  getReviews,
  reintegrate,
  reviewGame,
  searchGames,
  unvote,
  vote,
  votes,
} from "../controllers/game.controller.js";

export const gameRoutes = Router();

gameRoutes.use(authMiddleware);

gameRoutes.get("/search", searchGames);
gameRoutes.post("/", addGame);
gameRoutes.get("/playing", getPlaying);
gameRoutes.get("/:id/votes", votes);
gameRoutes.post("/:id/vote", vote);
gameRoutes.delete("/:id/vote", unvote);
gameRoutes.patch("/:id/status", changeStatus);
gameRoutes.patch("/:id/reintegrate", reintegrate);
gameRoutes.post("/:id/review", reviewGame);
gameRoutes.get("/:id/reviews", getReviews);
gameRoutes.delete("/:id", deleteGame);