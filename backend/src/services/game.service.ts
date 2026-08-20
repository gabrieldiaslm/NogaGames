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
  PLAYING: ["COMPLETED", "BACKLOG", "DROPPED"],
  COMPLETED: ["BACKLOG"],
  DROPPED: ["BACKLOG"],
};

export function isGameStatus(value: unknown): value is GameStatus {
  return typeof value === "string" && (GAME_STATUSES as readonly string[]).includes(value);
}

export function canTransition(from: GameStatus, to: GameStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export interface GameFilters {
  genre?: string;
  year?: number;
  platform?: string;
}

function filterWhere(where: { groupId: string }, filters: GameFilters) {
  return {
    ...where,
    ...(filters.genre ? { genre: filters.genre } : {}),
    ...(filters.year ? { releaseYear: filters.year } : {}),
    ...(filters.platform ? { platform: filters.platform } : {}),
  };
}

function myBacklogFilter(userId: string) {
  return {
    userGames: {
      none: {
        userId,
        status: { in: ["PLAYING" as GameStatus, "COMPLETED" as GameStatus, "DROPPED" as GameStatus] },
      },
    },
  };
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
): Promise<{ id: string; title: string; status: GameStatus; created: boolean }> {
  await requireGroupMember(userId, groupId);
  const details = await getGameDetailsRawg(externalId);

  const existing = await prisma.game.findUnique({
    where: { groupId_externalId: { groupId, externalId } },
  });

  if (existing) {
    const myProgress = await prisma.userGame.findUnique({
      where: { userId_gameId: { userId, gameId: existing.id } },
    });
    if (myProgress && (myProgress.status === "COMPLETED" || myProgress.status === "DROPPED")) {
      await prisma.userGame.delete({ where: { id: myProgress.id } });
    }
    return { id: existing.id, title: existing.title, status: "BACKLOG", created: false };
  }

  const game = await prisma.game.create({
    data: {
      externalId,
      title: details.title,
      coverImage: details.coverImage,
      releaseYear: details.releaseYear,
      genre: details.genre,
      platform: details.platform,
      hoursToBeat: details.hoursToBeat,
      status: "BACKLOG",
      groupId,
      addedById: userId,
    },
  });

  return { id: game.id, title: game.title, status: game.status, created: true };
}

function parseReviewInput(rating: unknown, comment: unknown): { rating: number; comment: string | null } {
  const parsedRating = Number(rating);
  if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    throw new AppError(400, "A nota deve ser um número inteiro entre 1 e 5.");
  }
  const parsedComment = comment === undefined || comment === null ? null : String(comment).trim();
  if (parsedComment !== null && parsedComment.length > 500) {
    throw new AppError(400, "O comentário deve ter no máximo 500 caracteres.");
  }
  return { rating: parsedRating, comment: parsedComment || null };
}

export async function changeGameStatus(
  gameId: string,
  next: GameStatus,
  userId: string,
  review?: { rating?: unknown; comment?: unknown },
): Promise<{ id: string; status: GameStatus }> {
  await findGameForMember(gameId, userId);

  const myProgress = await prisma.userGame.findUnique({
    where: { userId_gameId: { userId, gameId } },
  });

  const current: GameStatus = myProgress && myProgress.status !== "BACKLOG" ? myProgress.status : "BACKLOG";
  if (!canTransition(current, next)) {
    throw new AppError(400, `Transição inválida: ${current} -> ${next}.`);
  }

  const parsedReview = next === "COMPLETED" && review?.rating !== undefined ? parseReviewInput(review.rating, review.comment) : null;

  return prisma.$transaction(async (tx) => {
    if (next === "BACKLOG") {
      if (myProgress) {
        await tx.userGame.delete({ where: { id: myProgress.id } });
      }
    } else if (myProgress && myProgress.status !== "BACKLOG") {
      await tx.userGame.update({
        where: { id: myProgress.id },
        data: { status: next },
      });
    } else {
      await tx.userGame.create({
        data: { userId, gameId, status: next },
      });
    }

    if (parsedReview) {
      await tx.gameReview.upsert({
        where: { userId_gameId: { userId, gameId } },
        create: { userId, gameId, rating: parsedReview.rating, comment: parsedReview.comment },
        update: { rating: parsedReview.rating, comment: parsedReview.comment },
      });
    }

    return { id: gameId, status: next };
  });
}

export async function getDashboardWinner(
  groupId: string,
  userId: string,
): Promise<{
  id: string;
  title: string;
  coverImage: string;
  releaseYear: number | null;
  genre: string | null;
  votesCount: number;
  hoursToBeat: number | null;
} | null> {
  await requireGroupMember(userId, groupId);

  const winner = await prisma.game.findFirst({
    where: {
      groupId,
      ...myBacklogFilter(userId),
    },
    orderBy: [{ votes: { _count: "desc" } }, { createdAt: "desc" }],
    select: {
      id: true,
      externalId: true,
      title: true,
      coverImage: true,
      releaseYear: true,
      genre: true,
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
    releaseYear: winner.releaseYear,
    genre: winner.genre,
    hoursToBeat: resolveHours(winner),
    votesCount: winner._count.votes,
  };
}

export async function getBacklogGames(
  groupId: string,
  userId: string,
  filters: GameFilters = {},
): Promise<
  Array<{ id: string; title: string; coverImage: string; votesCount: number; userVoted: boolean; hoursToBeat: number | null }>
> {
  await requireGroupMember(userId, groupId);

  const games = await prisma.game.findMany({
    where: {
      ...filterWhere({ groupId }, filters),
      ...myBacklogFilter(userId),
    },
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
  filters: GameFilters = {},
): Promise<
  Array<{
    id: string;
    title: string;
    coverImage: string;
    releaseYear: number | null;
    genre: string | null;
    platform: string | null;
    updatedAt: string;
    hoursToBeat: number | null;
    avgRating: number | null;
    reviewsCount: number;
  }>
> {
  await requireGroupMember(userId, groupId);

  const progress = await prisma.userGame.findMany({
    where: { userId, status: "COMPLETED", game: filterWhere({ groupId }, filters) },
    orderBy: { updatedAt: "desc" },
    include: {
      game: {
        select: {
          id: true,
          externalId: true,
          title: true,
          coverImage: true,
          releaseYear: true,
          genre: true,
          platform: true,
          hoursToBeat: true,
        },
      },
    },
  });

  const gameIds = progress.map(({ game }) => game.id);
  const ratings = gameIds.length
    ? await prisma.gameReview.groupBy({
        by: ["gameId"],
        where: { gameId: { in: gameIds } },
        _avg: { rating: true },
        _count: { rating: true },
      })
    : [];

  const ratingByGame = new Map(ratings.map((row) => [row.gameId, row]));

  return progress.map(({ game, updatedAt }) => {
    const rating = ratingByGame.get(game.id);
    return {
      id: game.id,
      title: game.title,
      coverImage: game.coverImage,
      releaseYear: game.releaseYear,
      genre: game.genre,
      platform: game.platform,
      hoursToBeat: resolveHours(game),
      updatedAt: updatedAt.toISOString(),
      avgRating: rating?._avg.rating ?? null,
      reviewsCount: rating?._count.rating ?? 0,
    };
  });
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

export async function upsertGameReview(
  gameId: string,
  userId: string,
  rating: unknown,
  comment: unknown,
): Promise<{ id: string; rating: number }> {
  await findGameForMember(gameId, userId);
  const parsed = parseReviewInput(rating, comment);

  const review = await prisma.gameReview.upsert({
    where: { userId_gameId: { userId, gameId } },
    create: { userId, gameId, rating: parsed.rating, comment: parsed.comment },
    update: { rating: parsed.rating, comment: parsed.comment },
  });

  return { id: review.id, rating: review.rating };
}

export async function getGameReviews(gameId: string, userId: string) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) {
    throw new AppError(404, "Jogo não encontrado.");
  }
  await requireGroupMember(userId, game.groupId);

  const reviews = await prisma.gameReview.findMany({
    where: { gameId },
    include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    orderBy: { createdAt: "desc" },
  });

  return reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    user: review.user,
  }));
}

export async function getGroupReviews(groupId: string, userId: string) {
  await requireGroupMember(userId, groupId);

  const reviews = await prisma.gameReview.findMany({
    where: { game: { groupId } },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
      game: { select: { id: true, title: true, coverImage: true, releaseYear: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    user: review.user,
    game: review.game,
  }));
}

export async function getRandomBacklogGame(
  groupId: string,
  userId: string,
): Promise<{
  id: string;
  title: string;
  coverImage: string;
  releaseYear: number | null;
  genre: string | null;
  hoursToBeat: number | null;
} | null> {
  await requireGroupMember(userId, groupId);

  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT g.id FROM "Game" g
    WHERE g."groupId" = ${groupId}
      AND NOT EXISTS (
        SELECT 1 FROM "UserGame" ug
        WHERE ug."gameId" = g.id AND ug."userId" = ${userId}
          AND ug."status" IN ('PLAYING', 'COMPLETED', 'DROPPED')
      )
    ORDER BY RANDOM()
    LIMIT 1
  `;

  if (rows.length === 0) {
    return null;
  }

  const game = await prisma.game.findUnique({
    where: { id: rows[0].id },
    select: { id: true, externalId: true, title: true, coverImage: true, releaseYear: true, genre: true, hoursToBeat: true },
  });
  if (!game) {
    return null;
  }

  return {
    id: game.id,
    title: game.title,
    coverImage: game.coverImage,
    releaseYear: game.releaseYear,
    genre: game.genre,
    hoursToBeat: resolveHours(game),
  };
}

export async function getGroupFilters(groupId: string, userId: string) {
  await requireGroupMember(userId, groupId);

  const [genreRows, yearRows, platformRows] = await Promise.all([
    prisma.game.findMany({
      where: { groupId, genre: { not: null } },
      select: { genre: true },
      distinct: ["genre"],
      orderBy: { genre: "asc" },
    }),
    prisma.game.findMany({
      where: { groupId, releaseYear: { not: null } },
      select: { releaseYear: true },
      distinct: ["releaseYear"],
      orderBy: { releaseYear: "desc" },
    }),
    prisma.game.findMany({
      where: { groupId, platform: { not: null } },
      select: { platform: true },
      distinct: ["platform"],
      orderBy: { platform: "asc" },
    }),
  ]);

  return {
    genres: genreRows.map((row) => row.genre as string),
    years: yearRows.map((row) => row.releaseYear as number),
    platforms: platformRows.map((row) => row.platform as string),
  };
}