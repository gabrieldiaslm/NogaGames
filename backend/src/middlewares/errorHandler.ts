import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../types/errors.js";
import { RawgUnavailableError } from "../services/rawg.service.js";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Rota não encontrada." });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof RawgUnavailableError) {
    res.status(503).json({
      error: "O serviço externo de jogos está indisponível no momento. Tente novamente mais tarde.",
    });
    return;
  }

  console.error("[NogaGames] Erro não tratado:", err);
  res.status(500).json({ error: "Erro interno do servidor." });
};