import { prisma } from "../lib/prisma.js";
import { AppError } from "../types/errors.js";
import { GAME_STATUSES, type GameStatus } from "../types/index.js";
import { getGameDetailsRawg, MOCK_CATALOG, normalizeTitle } from "./rawg.service.js";
import { requireGroupAdmin, requireGroupMember } from "./group.service.js";

function resolveHours(game: { externalId: number | null; title: string; hoursToBeat: number | null }): number | null {
  if (game.hoursToBeat !== null && game.hoursToBeat !== undefined) {
    return game.hoursToBeat;
  }
  const catalogGame = MOCK_CATALOG.find(
    (catalog) => catalog.id === game.externalId || normalizeTitle(catalog.name) === normalizeTitle(game.title),
  );
  return catalogGame?.hoursToBeat ?? null;
}

const ALLOWED_TRANSITIONS: Record<GameStatus, GameStatus[]> = {
  BACKLOG: ["PLAYING"],
  PLAYING: ["COMPLETED", "BACKLOG"],
  COMPLETED: ["BACKLOG"],
};

export function isGameStatus(value: unknown): value is GameStatus {
  return typeof value === "string" && (GAME_STATUSES as readonly string[]).includes(value);
}

export function canTransition(from: GameStatus, to: GameStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

async function findGameForMember(gameId: string, userId: string) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) {
    throw new AppError(404, "Jogo não encontrado.");
  }
  await requireGroupMember(userId, game.groupId);
  return game;
}

export async function addGameByExternalId(
  externalId: number,
  groupId: string,
  userId: string,
): Promise<{ id: string; title: string; status: GameStatus }> {
  await requireGroupMember(userId, groupId);
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
        groupId,
        addedById: userId,
      },
    });
    return { id: game.id, title: game.title, status: game.status };
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      throw new AppError(409, "Este jogo já está no backlog do grupo.");
    }
    throw err;
  }
}

export async function changeGameStatus(
  gameId: string,
  next: GameStatus,
  userId: string,
): Promise<{ id: string; status: GameStatus }> {
  const game = await findGameForMember(gameId, userId);

  const current = game.status;
  if (!canTransition(current, next)) {
    throw new AppError(400, `Transição inválida: ${current} -> ${next}.`);
  }

  const myProgress = await prisma.userGame.findUnique({
    where: { userId_gameId: { userId, gameId } },
  });

  if (current === "PLAYING") {
    const ownerOfProgress = myProgress?.status === "PLAYING";
    if (next === "COMPLETED" && !ownerOfProgress) {
      throw new AppError(403, "Apenas quem está jogando o jogo pode marcá-lo como zerado.");
    }
    if (next === "BACKLOG" && !ownerOfProgress) {
      throw new AppError(403, "Apenas quem está jogando o jogo pode devolvê-lo ao backlog.");
    }
  }

  if (current === "COMPLETED" && next === "BACKLOG" && myProgress?.status !== "COMPLETED") {
    throw new AppError(403, "Apenas quem zerou o jogo pode reintegrá-lo ao backlog.");
  }

  if (next === "BACKLOG" && myProgress) {
    await prisma.userGame.delete({ where: { id: myProgress.id } });
  } else if (myProgress) {
    await prisma.userGame.update({
      where: { id: myProgress.id },
      data: { status: next },
    });
  } else {
    await prisma.userGame.create({
      data: { userId, gameId, status: next },
    });
  }

  const updated = await prisma.game.update({
    where: { id: gameId },
    data: { status: next },
  });

  return { id: updated.id, status: updated.status };
}

export async function getDashboardWinner(
  groupId: string,
  userId: string,
): Promise<{
  id: string;
  title: string;
  coverImage: string;
  votesCount: number;
  hoursToBeat: number | null;
} | null> {
  await requireGroupMember(userId, groupId);

  const winner = await prisma.game.findFirst({
    where: { groupId, status: "BACKLOG" },
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

export async function getBacklogGames(
  groupId: string,
  userId: string,
): Promise<
  Array<{ id: string; title: string; coverImage: string; votesCount: number; userVoted: boolean; hoursToBeat: number | null }>
> {
  await requireGroupMember(userId, groupId);

  const games = await prisma.game.findMany({
    where: { groupId, status: "BACKLOG" },
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

export async function getCompletedGames(
  groupId: string,
  userId: string,
): Promise<
  Array<{ id: string; title: string; coverImage: string; updatedAt: string; hoursToBeat: number | null }>
> {
  await requireGroupMember(userId, groupId);

  const games = await prisma.userGame.findMany({
    where: { userId, status: "COMPLETED", game: { groupId } },
    orderBy: { updatedAt: "desc" },
    include: {
      game: { select: { id: true, externalId: true, title: true, coverImage: true, hoursToBeat: true } },
    },
  });

  return games.map(({ game, updatedAt }) => ({
    id: game.id,
    title: game.title,
    coverImage: game.coverImage,
    hoursToBeat: resolveHours(game),
    updatedAt: updatedAt.toISOString(),
  }));
}

export async function getPlayingGames(userId: string): Promise<
  Array<{ id: string; title: string; coverImage: string; updatedAt: string; hoursToBeat: number | null; groupId: string }>
> {
  const games = await prisma.userGame.findMany({
    where: { userId, status: "PLAYING" },
    orderBy: { updatedAt: "desc" },
    include: {
      game: { select: { id: true, externalId: true, title: true, coverImage: true, hoursToBeat: true, groupId: true } },
    },
  });

  return games.map(({ game, updatedAt }) => ({
    id: game.id,
    title: game.title,
    coverImage: game.coverImage,
    hoursToBeat: resolveHours(game),
    groupId: game.groupId,
    updatedAt: updatedAt.toISOString(),
  }));
}

export async function getGameVotes(
  gameId: string,
  userId: string,
): Promise<Array<{ id: string; username: string; avatarUrl: string | null }>> {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) {
    throw new AppError(404, "Jogo não encontrado.");
  }
  await requireGroupMember(userId, game.groupId);

  const votes = await prisma.vote.findMany({
    where: { gameId },
    include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" },
  });

  return votes.map((vote) => ({
    id: vote.user.id,
    username: vote.user.username,
    avatarUrl: vote.user.avatarUrl,
  }));
}

export async function removeGame(gameId: string, userId: string): Promise<void> {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) {
    throw new AppError(404, "Jogo não encontrado.");
  }
  await requireGroupAdmin(userId, game.groupId);

  await prisma.game.delete({ where: { id: gameId } });
}