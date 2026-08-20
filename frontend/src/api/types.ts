export interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
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

export interface GroupSummary {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  ownerId: string;
  memberCount: number;
  gameCount: number;
  myRole: "ADMIN" | "MEMBER";
  createdAt: string;
}

export interface GroupMemberItem {
  id: string;
  username: string;
  avatarUrl: string | null;
  role: "ADMIN" | "MEMBER";
  joinedAt: string;
}

export interface Voter {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export type GameStatus = "BACKLOG" | "PLAYING" | "COMPLETED";