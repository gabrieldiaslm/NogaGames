import type { NextFunction, Request, Response } from "express";
import { addVote, removeVote } from "../services/vote.service.js";
import {
  addGameByExternalId,
  changeGameStatus,
  getBacklogGames,
  getCompletedGames,
  getDashboardWinner,
  getPlayingGames,
  isGameStatus,
} from "../services/game.service.js";
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
    if (!Number.isInteger(externalId) || externalId <= 0) {
      throw new AppError(400, "'externalId' deve ser um número inteiro positivo.");
    }
    const game = await addGameByExternalId(externalId);
    res.status(201).json(game);
  } catch (err) {
    next(err);
  }
}

export async function getBacklog(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const games = await getBacklogGames(req.userId ?? "");
    res.json(games);
  } catch (err) {
    next(err);
  }
}

export async function getCompleted(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const games = await getCompletedGames(req.userId ?? "");
    res.json(games);
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

export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const winner = await getDashboardWinner();
    res.json(winner);
  } catch (err) {
    next(err);
  }
}

export async function changeStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body ?? {};

    if (!isGameStatus(status)) {
      throw new AppError(400, "Status inválido. Use BACKLOG, PLAYING ou COMPLETED.");
    }

    const result = await changeGameStatus(id, status, req.userId ?? "");
    res.json(result);
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