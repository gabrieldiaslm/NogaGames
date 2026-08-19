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

export type GameStatus = "BACKLOG" | "PLAYING" | "COMPLETED";