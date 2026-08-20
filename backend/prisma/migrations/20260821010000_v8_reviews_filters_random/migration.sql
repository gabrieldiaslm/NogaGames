-- v8: avaliações (GameReview), gênero/plataforma no Game, status DROPPED

-- Novo status DROPPED
ALTER TYPE "GameStatus" ADD VALUE 'DROPPED';

-- Novas colunas de metadados
ALTER TABLE "Game" ADD COLUMN "genre" TEXT;
ALTER TABLE "Game" ADD COLUMN "platform" TEXT;

-- CreateTable GameReview
CREATE TABLE "GameReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GameReview_pkey" PRIMARY KEY ("id")
);

-- ForeignKeys
ALTER TABLE "GameReview" ADD CONSTRAINT "GameReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GameReview" ADD CONSTRAINT "GameReview_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Unique: cada usuário avalia uma vez por jogo
CREATE UNIQUE INDEX "GameReview_userId_gameId_key" ON "GameReview"("userId", "gameId");

-- Backfill: gênero/plataforma dos jogos já conhecidos do catálogo
UPDATE "Game" AS g
SET "genre" = v.genre, "platform" = v.platform
FROM (VALUES
  (3328, 'RPG', 'PC'),
  (58175, 'RPG', 'PC'),
  (34125, 'Action', 'PC'),
  (34269, 'Platformer', 'PC'),
  (9767, 'Platformer', 'PC'),
  (654, 'Simulation', 'PC'),
  (8515, 'RPG', 'PC'),
  (58718, 'Action', 'PlayStation'),
  (33824, 'Action', 'PlayStation'),
  (4476, 'Puzzle', 'PC'),
  (200001, 'Adventure', 'PC'),
  (200002, 'Adventure', 'PlayStation'),
  (200003, 'Action', 'PC'),
  (200004, 'Adventure', 'PC'),
  (200005, 'Action', 'PlayStation'),
  (200006, 'Action', 'Xbox'),
  (200007, 'Horror', 'PC'),
  (200008, 'Horror', 'PC'),
  (200009, 'RPG', 'PlayStation'),
  (200010, 'RPG', 'PC'),
  (200011, 'RPG', 'PC'),
  (200012, 'RPG', 'PC'),
  (200013, 'Fighting', 'PC'),
  (200014, 'Adventure', 'PC'),
  (200015, 'Platformer', 'PC'),
  (200016, 'Adventure', 'PC'),
  (200017, 'Adventure', 'Xbox'),
  (200018, 'Action', 'Switch'),
  (200019, 'Adventure', 'PlayStation'),
  (200020, 'Adventure', 'PlayStation'),
  (200021, 'RPG', 'PC'),
  (200022, 'Shooter', 'PC'),
  (200023, 'Action', 'PlayStation'),
  (200024, 'Shooter', 'PC'),
  (200025, 'Shooter', 'PC'),
  (200026, 'Shooter', 'PC'),
  (200027, 'Action', 'Xbox'),
  (200028, 'Action', 'PlayStation'),
  (200029, 'Adventure', 'Nintendo'),
  (200030, 'Adventure', 'Nintendo'),
  (200031, 'Strategy', 'PC'),
  (200032, 'Adventure', 'PC'),
  (200033, 'Adventure', 'Switch'),
  (200034, 'RPG', 'PC'),
  (200035, 'RPG', 'Xbox'),
  (200036, 'RPG', 'PlayStation'),
  (200037, 'Platformer', 'PlayStation'),
  (200038, 'Action', 'PlayStation'),
  (200039, 'RPG', 'PlayStation'),
  (200040, 'Action', 'PC'),
  (200041, 'RPG', 'PC'),
  (200042, 'Action', 'PC'),
  (200043, 'RPG', 'PC'),
  (200044, 'Action', 'PC'),
  (200045, 'Platformer', 'PlayStation'),
  (200046, 'Action', 'PlayStation'),
  (200047, 'Adventure', 'Xbox'),
  (200048, 'Horror', 'PC'),
  (200049, 'Horror', 'Xbox'),
  (200050, 'Action', 'PlayStation'),
  (200051, 'RPG', 'PC'),
  (200052, 'RPG', 'PC'),
  (200053, 'Platformer', 'PC'),
  (200054, 'Action', 'PlayStation'),
  (200055, 'Shooter', 'PC')
) AS v(id, genre, platform)
WHERE g."externalId" = v.id;