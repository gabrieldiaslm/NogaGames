import { prisma } from "../lib/prisma.js";
import { AppError } from "../types/errors.js";
import type { VoteResult } from "../types/index.js";

export async function addVote(gameId: string, userId: string): Promise<VoteResult> {
  const game = await prisma.game.findUnique({ where: { id: gameId }, select: { id: true } });

  if (!game) {
    throw new AppError(404, "Jogo não encontrado.");
  }

  try {
    await prisma.vote.create({ data: { gameId, userId } });
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      throw new AppError(409, "Você já votou neste jogo.");
    }
    throw err;
  }

  const votesCount = await prisma.vote.count({ where: { gameId } });
  return { gameId, votesCount };
}

export async function removeVote(gameId: string, userId: string): Promise<VoteResult> {
  const deleted = await prisma.vote.deleteMany({ where: { gameId, userId } });

  if (deleted.count === 0) {
    throw new AppError(404, "Voto não encontrado.");
  }

  const votesCount = await prisma.vote.count({ where: { gameId } });
  return { gameId, votesCount };
}