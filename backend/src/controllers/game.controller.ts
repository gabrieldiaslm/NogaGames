import type { NextFunction, Request, Response } from "express";
import {
  addGameByExternalId,
  changeGameStatus,
  getGameReviews,
  getGameVotes,
  getPlayingGames,
  isGameStatus,
  removeGame,
  upsertGameReview,
} from "../services/game.service.js";
import { addVote, removeVote } from "../services/vote.service.js";
import { searchGamesRawg } from "../services/rawg.service.js";
import { AppError } from "../types/errors.js";

export async function searchGames(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = String(req.query.q ?? "").trim();
    if (!q) {
      throw new AppError(400, "O parâmetro de busca 'q' é obrigatório.");
    }
    const results = await searchGamesRawg(q);
    res.json(results);
  } catch (err) {
    next(err);
  }
}

export async function addGame(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const externalId = Number(req.body?.externalId);
    const groupId = String(req.body?.groupId ?? "");
    if (!Number.isInteger(externalId) || externalId <= 0) {
      throw new AppError(400, "'externalId' deve ser um número inteiro positivo.");
    }
    if (!groupId) {
      throw new AppError(400, "'groupId' é obrigatório.");
    }
    const game = await addGameByExternalId(externalId, groupId, req.userId ?? "");
    res.status(201).json(game);
  } catch (err) {
    next(err);
  }
}

export async function getPlaying(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const games = await getPlayingGames(req.userId ?? "");
    res.json(games);
  } catch (err) {
    next(err);
  }
}

export async function changeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { status, rating, comment } = req.body ?? {};

    if (!isGameStatus(status)) {
      throw new AppError(400, "Status inválido. Use BACKLOG, PLAYING, COMPLETED ou DROPPED.");
    }

    const result = await changeGameStatus(id, status, req.userId ?? "", { rating, comment });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function reintegrate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await changeGameStatus(req.params.id, "BACKLOG", req.userId ?? "");
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function votes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const voters = await getGameVotes(req.params.id, req.userId ?? "");
    res.json(voters);
  } catch (err) {
    next(err);
  }
}

export async function vote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await addVote(req.params.id, req.userId ?? "");
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function unvote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await removeVote(req.params.id, req.userId ?? "");
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteGame(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await removeGame(req.params.id, req.userId ?? "");
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function reviewGame(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { rating, comment } = req.body ?? {};
    const result = await upsertGameReview(req.params.id, req.userId ?? "", rating, comment);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const reviews = await getGameReviews(req.params.id, req.userId ?? "");
    res.json(reviews);
  } catch (err) {
    next(err);
  }
}