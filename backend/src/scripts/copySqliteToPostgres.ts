import { DatabaseSync } from "node:sqlite";
import type { GameStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

const db = new DatabaseSync("prisma/dev.db.backup-sqlite");

interface SqliteUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

interface SqliteGame {
  id: string;
  externalId: number | null;
  title: string;
  coverImage: string;
  releaseYear: number | null;
  description: string | null;
  hoursToBeat: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface SqliteVote {
  id: string;
  userId: string;
  gameId: string;
  createdAt: string;
}

const users = db.prepare("SELECT * FROM User").all() as unknown as SqliteUser[];
const games = db.prepare("SELECT * FROM Game").all() as unknown as SqliteGame[];
const votes = db.prepare("SELECT * FROM Vote").all() as unknown as SqliteVote[];

db.close();

function toDate(value: string | number): Date {
  return new Date(Number(value));
}

const userRows = users.map((u) => ({ ...u, createdAt: toDate(u.createdAt) }));

await prisma.user.createMany({ data: userRows, skipDuplicates: true });
console.log(`Inseridos: ${users.length} usuarios`);

const defaultGroup = await prisma.group.findFirst({ orderBy: { createdAt: "asc" } });
if (!defaultGroup) {
  throw new Error("Nenhum grupo encontrado. Crie um grupo antes de copiar os jogos.");
}

const gameRows = games.map((g) => ({
  ...g,
  status: g.status as GameStatus,
  groupId: defaultGroup.id,
  addedById: defaultGroup.ownerId,
  createdAt: toDate(g.createdAt),
  updatedAt: toDate(g.updatedAt),
}));
await prisma.game.createMany({ data: gameRows, skipDuplicates: true });
console.log(`Inseridos: ${games.length} jogos (grupo ${defaultGroup.name})`);

const voteRows = votes.map((v) => ({ ...v, createdAt: toDate(v.createdAt) }));
await prisma.vote.createMany({ data: voteRows, skipDuplicates: true });
console.log(`Inseridos: ${votes.length} votos`);

const [u, g, v] = await Promise.all([
  prisma.user.count(),
  prisma.game.count(),
  prisma.vote.count(),
]);
console.log(`Postgres agora: ${u} usuarios, ${g} jogos, ${v} votos`);

await prisma.$disconnect();