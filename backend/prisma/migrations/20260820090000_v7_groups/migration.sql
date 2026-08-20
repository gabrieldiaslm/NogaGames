-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('BACKLOG', 'PLAYING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "GroupRole" AS ENUM ('ADMIN', 'MEMBER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "role" "GroupRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- AlterTable Game: status String -> GameStatus (cast preserva dados)
ALTER TABLE "Game" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Game" ALTER COLUMN "status" TYPE "GameStatus" USING ("status"::"GameStatus");
ALTER TABLE "Game" ALTER COLUMN "status" SET DEFAULT 'BACKLOG';

-- AlterTable Game: novas colunas (nullable para backfill)
ALTER TABLE "Game" ADD COLUMN "groupId" TEXT;
ALTER TABLE "Game" ADD COLUMN "addedById" TEXT;

-- Backfill: grupo padrão com o usuário mais antigo como owner
INSERT INTO "Group" ("id", "name", "description", "ownerId", "inviteCode", "createdAt")
SELECT 'group-heranca', 'Grupo inicial', 'Grupo criado automaticamente na migracao v7', u."id", 'GRUPO-INICIAL-001', CURRENT_TIMESTAMP
FROM "User" u ORDER BY u."createdAt" ASC LIMIT 1;

-- Backfill: todos os usuários viram membros (owner = ADMIN)
INSERT INTO "GroupMember" ("id", "userId", "groupId", "role", "joinedAt")
SELECT 'gm-' || u."id", u."id", 'group-heranca',
       CASE WHEN u."id" = (SELECT g."ownerId" FROM "Group" g WHERE g."id" = 'group-heranca') THEN 'ADMIN'::"GroupRole" ELSE 'MEMBER'::"GroupRole" END,
       CURRENT_TIMESTAMP
FROM "User" u;

-- Backfill: jogos existentes entram no grupo padrão
UPDATE "Game" SET "groupId" = 'group-heranca', "addedById" = (SELECT g."ownerId" FROM "Group" g WHERE g."id" = 'group-heranca') WHERE "groupId" IS NULL;

-- AlterTable Game: colunas obrigatórias
ALTER TABLE "Game" ALTER COLUMN "groupId" SET NOT NULL;
ALTER TABLE "Game" ALTER COLUMN "addedById" SET NOT NULL;

-- Unicidade por grupo (jogo pode existir em vários grupos, mas não duplicado no mesmo)
DROP INDEX "Game_externalId_key";
CREATE UNIQUE INDEX "Game_groupId_externalId_key" ON "Game"("groupId", "externalId");

-- AlterTable UserGame: status String -> GameStatus
ALTER TABLE "UserGame" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "UserGame" ALTER COLUMN "status" TYPE "GameStatus" USING ("status"::"GameStatus");
ALTER TABLE "UserGame" ALTER COLUMN "status" SET DEFAULT 'BACKLOG';

-- ForeignKeys
ALTER TABLE "Group" ADD CONSTRAINT "Group_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Game" ADD CONSTRAINT "Game_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Game" ADD CONSTRAINT "Game_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Unique constraints
CREATE UNIQUE INDEX "Group_inviteCode_key" ON "Group"("inviteCode");
CREATE UNIQUE INDEX "GroupMember_userId_groupId_key" ON "GroupMember"("userId", "groupId");