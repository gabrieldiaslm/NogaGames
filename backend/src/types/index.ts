export const GAME_STATUSES = ["BACKLOG", "PLAYING", "COMPLETED"] as const;

export type GameStatus = (typeof GAME_STATUSES)[number];

export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

export interface GameSearchResult {
  externalId: number;
  title: string;
  coverImage: string;
  releaseYear: number | null;
  hoursToBeat: number | null;
}

export interface BacklogGameItem {
  id: string;
  title: string;
  coverImage: string;
  votesCount: number;
  userVoted: boolean;
  hoursToBeat: number | null;
}

export interface CompletedGameItem {
  id: string;
  title: string;
  coverImage: string;
  updatedAt: string;
  hoursToBeat: number | null;
}

export interface DashboardGame {
  id: string;
  title: string;
  coverImage: string;
  votesCount: number;
  hoursToBeat: number | null;
}

export interface VoteResult {
  gameId: string;
  votesCount: number;
}