import { prisma } from "../lib/prisma.js";
import { MOCK_CATALOG } from "../services/rawg.service.js";

const byExternalId = new Map(MOCK_CATALOG.map((game) => [game.id, game]));

const games = await prisma.game.findMany({
  select: { id: true, externalId: true, title: true, coverImage: true, hoursToBeat: true },
});

let updatedCovers = 0;
let updatedHours = 0;
let skipped = 0;

for (const game of games) {
  if (game.externalId === null) {
    skipped += 1;
    continue;
  }

  const catalogGame = byExternalId.get(game.externalId);
  if (!catalogGame) {
    skipped += 1;
    continue;
  }

  const data: { coverImage?: string; hoursToBeat?: number | null } = {};

  if (catalogGame.background_image && catalogGame.background_image !== game.coverImage) {
    data.coverImage = catalogGame.background_image;
  }
  if (catalogGame.hoursToBeat !== game.hoursToBeat) {
    data.hoursToBeat = catalogGame.hoursToBeat;
  }

  if (Object.keys(data).length > 0) {
    await prisma.game.update({ where: { id: game.id }, data });
    if (data.coverImage) {
      updatedCovers += 1;
      console.log(`[capa] ${game.title} -> ${data.coverImage}`);
    }
    if (data.hoursToBeat !== undefined) {
      updatedHours += 1;
      console.log(`[horas] ${game.title} -> ${data.hoursToBeat ?? "null"}h`);
    }
  } else {
    skipped += 1;
  }
}

console.log(
  `Sincronizado: ${updatedCovers} capas e ${updatedHours} tempos atualizados, ${skipped} inalterados.`,
);

await prisma.$disconnect();