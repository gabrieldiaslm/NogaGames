import { prisma } from "../lib/prisma.js";
import { AppError } from "../types/errors.js";
import { GAME_STATUSES, type GameStatus } from "../types/index.js";
import { getGameDetailsRawg, MOCK_CATALOG } from "./rawg.service.js";

function resolveHours(game: { externalId: number | null; hoursToBeat: number | null }): number | null {
  if (game.hoursToBeat !== null && game.hoursToBeat !== undefined) {
    return game.hoursToBeat;
  }
  if (game.externalId !== null) {
    return MOCK_CATALOG.find((catalogGame) => catalogGame.id === game.externalId)?.hoursToBeat ?? null;
  }
  return null;
}

const ALLOWED_TRANSITIONS: Record<GameStatus, GameStatus[]> = {
  BACKLOG: ["PLAYING"],
  PLAYING: ["COMPLETED"],
  COMPLETED: ["BACKLOG"],
};

export function isGameStatus(value: unknown): value is GameStatus {
  return typeof value === "string" && (GAME_STATUSES as readonly string[]).includes(value);
}

export function canTransition(from: GameStatus, to: GameStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export async function addGameByExternalId(externalId: number): Promise<{ id: string; title: string; status: GameStatus }> {
  const details = await getGameDetailsRawg(externalId);

  try {
    const game = await prisma.game.create({
      data: {
        externalId,
        title: details.title,
        coverImage: details.coverImage,
        releaseYear: details.releaseYear,
        hoursToBeat: details.hoursToBeat,
        status: "BACKLOG",
      },
    });
    return { id: game.id, title: game.title, status: game.status as GameStatus };
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      throw new AppError(409, "Este jogo já está na sua lista.");
    }
    throw err;
  }
}

export async function changeGameStatus(
  gameId: string,
  next: GameStatus,
): Promise<{ id: string; status: GameStatus }> {
  const game = await prisma.game.findUnique({ where: { id: gameId } });

  if (!game) {
    throw new AppError(404, "Jogo não encontrado.");
  }

  const current = game.status as GameStatus;
  if (!canTransition(current, next)) {
    throw new AppError(400, `Transição inválida: ${current} -> ${next}.`);
  }

  const updated = await prisma.game.update({
    where: { id: gameId },
    data: { status: next },
  });

  return { id: updated.id, status: updated.status as GameStatus };
}

export async function getDashboardWinner(): Promise<{
  id: string;
  title: string;
  coverImage: string;
  votesCount: number;
  hoursToBeat: number | null;
} | null> {
  const winner = await prisma.game.findFirst({
    where: { status: "BACKLOG" },
    orderBy: [{ votes: { _count: "desc" } }, { createdAt: "desc" }],
    select: {
      id: true,
      externalId: true,
      title: true,
      coverImage: true,
      hoursToBeat: true,
      _count: { select: { votes: true } },
    },
  });

  if (!winner) {
    return null;
  }

  return {
    id: winner.id,
    title: winner.title,
    coverImage: winner.coverImage,
    hoursToBeat: resolveHours(winner),
    votesCount: winner._count.votes,
  };
}

export async function getBacklogGames(userId: string): Promise<
  Array<{ id: string; title: string; coverImage: string; votesCount: number; userVoted: boolean; hoursToBeat: number | null }>
> {
  const games = await prisma.game.findMany({
    where: { status: "BACKLOG" },
    orderBy: [{ votes: { _count: "desc" } }, { createdAt: "asc" }],
    include: {
      _count: { select: { votes: true } },
      votes: { where: { userId }, select: { id: true } },
    },
  });

  return games.map((game) => ({
    id: game.id,
    title: game.title,
    coverImage: game.coverImage,
    hoursToBeat: resolveHours(game),
    votesCount: game._count.votes,
    userVoted: game.votes.length > 0,
  }));
}

export async function getCompletedGames(): Promise<
  Array<{ id: string; title: string; coverImage: string; updatedAt: string; hoursToBeat: number | null }>
> {
  const games = await prisma.game.findMany({
    where: { status: "COMPLETED" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, externalId: true, title: true, coverImage: true, updatedAt: true, hoursToBeat: true },
  });

  return games.map((game) => ({
    id: game.id,
    title: game.title,
    coverImage: game.coverImage,
    hoursToBeat: resolveHours(game),
    updatedAt: game.updatedAt.toISOString(),
  }));
}

export async function getPlayingGames(): Promise<
  Array<{ id: string; title: string; coverImage: string; updatedAt: string; hoursToBeat: number | null }>
> {
  const games = await prisma.game.findMany({
    where: { status: "PLAYING" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, externalId: true, title: true, coverImage: true, updatedAt: true, hoursToBeat: true },
  });

  return games.map((game) => ({
    id: game.id,
    title: game.title,
    coverImage: game.coverImage,
    hoursToBeat: resolveHours(game),
    updatedAt: game.updatedAt.toISOString(),
  }));
}