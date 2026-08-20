import axios from "axios";
import type { GameSearchResult } from "../types/index.js";

const RAWG_URL = "https://api.rawg.io/api/games";
const RAWG_TIMEOUT_MS = 8000;
const PAGE_SIZE = 20;

interface RawgGame {
  id: number;
  name: string;
  background_image: string | null;
  released: string | null;
  hoursToBeat: number | null;
  genres?: Array<{ name: string }>;
  platforms?: Array<{ platform: { name: string } }>;
}

const CATALOG_META: Record<number, { genre: string; platform: string }> = {
  3328: { genre: "RPG", platform: "PC" },
  58175: { genre: "RPG", platform: "PC" },
  34125: { genre: "Action", platform: "PC" },
  34269: { genre: "Platformer", platform: "PC" },
  9767: { genre: "Platformer", platform: "PC" },
  654: { genre: "Simulation", platform: "PC" },
  8515: { genre: "RPG", platform: "PC" },
  58718: { genre: "Action", platform: "PlayStation" },
  33824: { genre: "Action", platform: "PlayStation" },
  4476: { genre: "Puzzle", platform: "PC" },
  200001: { genre: "Adventure", platform: "PC" },
  200002: { genre: "Adventure", platform: "PlayStation" },
  200003: { genre: "Action", platform: "PC" },
  200004: { genre: "Adventure", platform: "PC" },
  200005: { genre: "Action", platform: "PlayStation" },
  200006: { genre: "Action", platform: "Xbox" },
  200007: { genre: "Horror", platform: "PC" },
  200008: { genre: "Horror", platform: "PC" },
  200009: { genre: "RPG", platform: "PlayStation" },
  200010: { genre: "RPG", platform: "PC" },
  200011: { genre: "RPG", platform: "PC" },
  200012: { genre: "RPG", platform: "PC" },
  200013: { genre: "Fighting", platform: "PC" },
  200014: { genre: "Adventure", platform: "PC" },
  200015: { genre: "Platformer", platform: "PC" },
  200016: { genre: "Adventure", platform: "PC" },
  200017: { genre: "Adventure", platform: "Xbox" },
  200018: { genre: "Action", platform: "Switch" },
  200019: { genre: "Adventure", platform: "PlayStation" },
  200020: { genre: "Adventure", platform: "PlayStation" },
  200021: { genre: "RPG", platform: "PC" },
  200022: { genre: "Shooter", platform: "PC" },
  200023: { genre: "Action", platform: "PlayStation" },
  200024: { genre: "Shooter", platform: "PC" },
  200025: { genre: "Shooter", platform: "PC" },
  200026: { genre: "Shooter", platform: "PC" },
  200027: { genre: "Action", platform: "Xbox" },
  200028: { genre: "Action", platform: "PlayStation" },
  200029: { genre: "Adventure", platform: "Nintendo" },
  200030: { genre: "Adventure", platform: "Nintendo" },
  200031: { genre: "Strategy", platform: "PC" },
  200032: { genre: "Adventure", platform: "PC" },
  200033: { genre: "Adventure", platform: "Switch" },
  200034: { genre: "RPG", platform: "PC" },
  200035: { genre: "RPG", platform: "Xbox" },
  200036: { genre: "RPG", platform: "PlayStation" },
  200037: { genre: "Platformer", platform: "PlayStation" },
  200038: { genre: "Action", platform: "PlayStation" },
  200039: { genre: "RPG", platform: "PlayStation" },
  200040: { genre: "Action", platform: "PC" },
  200041: { genre: "RPG", platform: "PC" },
  200042: { genre: "Action", platform: "PC" },
  200043: { genre: "RPG", platform: "PC" },
  200044: { genre: "Action", platform: "PC" },
  200045: { genre: "Platformer", platform: "PlayStation" },
  200046: { genre: "Action", platform: "PlayStation" },
  200047: { genre: "Adventure", platform: "Xbox" },
  200048: { genre: "Horror", platform: "PC" },
  200049: { genre: "Horror", platform: "Xbox" },
  200050: { genre: "Action", platform: "PlayStation" },
  200051: { genre: "RPG", platform: "PC" },
  200052: { genre: "RPG", platform: "PC" },
  200053: { genre: "Platformer", platform: "PC" },
  200054: { genre: "Action", platform: "PlayStation" },
  200055: { genre: "Shooter", platform: "PC" },
};

export class RawgUnavailableError extends Error {
  constructor() {
    super("RAWG indisponível");
    this.name = "RawgUnavailableError";
  }
}

function toSearchResult(game: RawgGame): GameSearchResult {
  const meta = CATALOG_META[game.id];
  const rawYear = game.released ? Number(game.released.slice(0, 4)) : null;
  return {
    externalId: game.id,
    title: game.name,
    coverImage: game.background_image ?? "",
    releaseYear: rawYear && rawYear > 0 ? rawYear : null,
    hoursToBeat: game.hoursToBeat,
    genre: game.genres?.[0]?.name ?? meta?.genre ?? null,
    platform: game.platforms?.[0]?.platform.name ?? meta?.platform ?? null,
  };
}

function mockEntry(
  id: number,
  name: string,
  released: string | null,
  image: string,
  hoursToBeat: number | null,
): RawgGame {
  return {
    id,
    name,
    background_image: image,
    released,
    hoursToBeat,
  };
}

export const MOCK_CATALOG: RawgGame[] = [
  mockEntry(3328, "The Witcher 3: Wild Hunt", "2015", "https://media.rawg.io/media/resize/1280/-/games/618/618c2031a07bbff6b4f611f10b6bcdbc.jpg", 51),
  mockEntry(58175, "Elden Ring", "2022", "https://media.rawg.io/media/resize/1280/-/games/b29/b294fdd866dcdb643e7bab370a552855.jpg", 56),
  mockEntry(34125, "Hades", "2020", "https://media.rawg.io/media/resize/1280/-/games/1f4/1f47a270b8f241e4676b14d39ec620f7.jpg", 23),
  mockEntry(34269, "Celeste", "2018", "https://media.rawg.io/media/resize/1280/-/games/594/59487800889ebac294c7c2c070d02356.jpg", 8.5),
  mockEntry(9767, "Hollow Knight", "2017", "https://media.rawg.io/media/resize/1280/-/games/4cf/4cfc6b7f1850590a4634b08bfab308ab.jpg", 28),
  mockEntry(654, "Stardew Valley", "2016", "https://media.rawg.io/media/resize/1280/-/games/713/713269608dc8f2f40f5a670a14b2de94.jpg", 52.5),
  mockEntry(8515, "Baldur's Gate 3", "2023", "https://media.rawg.io/media/resize/1280/-/games/699/69907ecf13f172e9e144069769c3be73.jpg", 74),
  mockEntry(58718, "God of War", "2018", "https://media.rawg.io/media/resize/1280/-/games/4be/4be6a6ad0364751a96229c56bf69be59.jpg", 20.5),
  mockEntry(33824, "Red Dead Redemption 2", "2018", "https://media.rawg.io/media/resize/1280/-/games/511/5118aff5091cb3efec399c808f8c598f.jpg", 49.5),
  mockEntry(4476, "Portal 2", "2011", "https://media.rawg.io/media/resize/1280/-/games/2ba/2bac0e87cf45e5b508f227d281c9252a.jpg", 8.5),
  mockEntry(200001, "Outer Wilds", "2019", "https://media.rawg.io/media/resize/1280/-/games/9f4/9f418898f5415668ca47b5f4ab1ecfeb.jpg", 16),
  mockEntry(200002, "Plague Tale: Resonance", "2022", "https://media.rawg.io/media/resize/1280/-/games/cd0/cd074f3f6045297cda9ad077273c09b6.jpg", 12),
  mockEntry(200003, "Control Resonant", "2019", "https://media.rawg.io/media/resize/1280/-/games/253/2534a46f3da7fa7c315f1387515ca393.jpg", 14),
  mockEntry(200004, "Dredge", "2023", "https://media.rawg.io/media/resize/1280/-/games/c2c/c2c9f1c026b6c1be5bc2160baf7224ea.jpg", 10),
  mockEntry(200005, "Drakengard", "2003", "https://media.rawg.io/media/resize/1280/-/games/9eb/9ebb26d197a75b8c62c52a1aa3e45ff6.jpg", 26),
  mockEntry(200006, "Asura's Wrath", "2012", "https://media.rawg.io/media/resize/1280/-/games/438/438c07ddb573d47f1c50e2ca1859982f.jpg", 10),
  mockEntry(200007, "Alan Wake 2", "2023", "https://media.rawg.io/media/resize/1280/-/games/5b9/5b963d7633cd640fa2dbc4069d1c6377.jpg", 26),
  mockEntry(200008, "Resident Evil Village", "2021", "https://media.rawg.io/media/resize/1280/-/games/6cc/6cc23249972a427f697a3d10eb57a820.jpg", 10),
  mockEntry(200009, "NieR: Automata", "2017", "https://media.rawg.io/media/resize/1280/-/games/5a4/5a44112251d70a25291cc33757220fce.jpg", 21),
  mockEntry(200010, "Disco Elysium", "2019", "https://media.rawg.io/media/resize/1280/-/games/840/8408ad3811289a6a5830cae60fb0b62a.jpg", 22.5),
  mockEntry(200011, "Divinity: Original Sin - Enhanced Edition", "2015", "https://media.rawg.io/media/resize/1280/-/games/33b/33b825c76382931df0fd8ecddf5caebe.jpg", 60.5),
  mockEntry(200012, "Cyberpunk 2077 + Phantom Liberty", "2020", "https://media.rawg.io/media/resize/1280/-/games/26d/26d4437715bee60138dab4a7c8c59c92.jpg", 25),
  mockEntry(200013, "Dragon Ball Xenoverse 2", "2016", "https://media.rawg.io/media/resize/1280/-/games/e58/e58c97f607ceafe069b80a769d021ae2.jpg", 23),
  mockEntry(200014, "1000xResist", "2024", "https://media.rawg.io/media/resize/1280/-/games/7c7/7c7fc7ac07c17fad71095cca1c78bc65.jpg", 12),
  mockEntry(200015, "Gris", "2018", "https://media.rawg.io/media/resize/1280/-/games/51c/51c430f1795c79b78f863a9f22dc422d.jpg", 4),
  mockEntry(200016, "Little Nightmares", "2017", "https://media.rawg.io/media/resize/1280/-/games/8a0/8a02f84a5916ede2f923b88d5f8217ba.jpg", 4),
  mockEntry(200017, "Valiant Hearts: The Great War", "2014", "https://media.rawg.io/media/resize/1280/-/games/39a/39a8aa7798b685f9625e857bc394259d.jpg", 6.5),
  mockEntry(200018, "Bayonetta 2", "2014", "https://media.rawg.io/media/resize/1280/-/games/3d7/3d7c8e749b18cfc898c80016594981fe.jpg", 9),
  mockEntry(200019, "Shadow of the Colossus", "2005", "https://media.rawg.io/media/resize/1280/-/games/8ea/8ea1e2850d7568bc9733d546c0ac6ce1.jpg", 9.5),
  mockEntry(200020, "Heavy Rain", "2010", "https://media.rawg.io/media/resize/1280/-/games/0af/0af85e8edddfa55368e47c539914a220.jpg", 10),
  mockEntry(200021, "Child of Light", "2014", "https://media.rawg.io/media/resize/1280/-/games/c47/c4796c4c49e7e06ad328e07aa8944cdd.jpg", 11),
  mockEntry(200022, "Half-Life", "1998", "https://media.rawg.io/media/resize/1280/-/games/6c5/6c55e22185876626881b76c11922b073.jpg", 12),
  mockEntry(200023, "Metal Gear Solid 2: Sons of Liberty", "2001", "https://media.rawg.io/media/resize/1280/-/games/0f1/0f105a3d3ba6225269c4a08b43ecbb73.jpg", 13),
  mockEntry(200024, "BioShock", "2007", "https://media.rawg.io/media/resize/1280/-/games/bc0/bc06a29ceac58652b684deefe7d56099.jpg", 14),
  mockEntry(200025, "BioShock 2", "2010", "https://media.rawg.io/media/resize/1280/-/games/157/15742f2f67eacff546738e1ab5c19d20.jpg", 14),
  mockEntry(200026, "BioShock Infinite", "2013", "https://media.rawg.io/media/resize/1280/-/games/fc1/fc1307a2774506b5bd65d7e8424664a7.jpg", 14),
  mockEntry(200027, "Alice: Madness Returns", "2011", "https://media.rawg.io/media/resize/1280/-/games/0b5/0b5410b1e4b3fb72696dcefbf4f1cf40.jpg", 15),
  mockEntry(200028, "Metal Gear Solid 3: Snake Eater", "2004", "https://media.rawg.io/media/resize/1280/-/games/2c6/2c60e20bebae94ee080bdf0993253b4d.jpg", 16),
  mockEntry(200029, "The Legend of Zelda: Majora's Mask", "2000", "https://media.rawg.io/media/resize/1280/-/games/b3c/b3c209cd49aae8a469a59b79b54dc599.jpg", 21),
  mockEntry(200030, "The Legend of Zelda: Ocarina of Time", "1998", "https://media.rawg.io/media/resize/1280/-/games/3a0/3a0c8e9ed3a711c542218831b893a0fa.jpg", 27),
  mockEntry(200031, "Marvel's Midnight Suns", "2022", "https://media.rawg.io/media/resize/1280/-/games/d47/d471344cc698b2dc660ab09880e1e884.jpg", 37.5),
  mockEntry(200032, "The Walking Dead: The Telltale Definitive Series", "2019", "https://media.rawg.io/media/resize/1280/-/games/810/8101cb5bf4db5f85ca1b6fab14cab5ee.jpg", 45),
  mockEntry(200033, "The Legend of Zelda: Breath of the Wild", "2017", "https://media.rawg.io/media/resize/1280/-/games/cc1/cc196a5ad763955d6532cdba236f730c.jpg", 50),
  mockEntry(200034, "Divinity: Original Sin II", "2017", "https://media.rawg.io/media/resize/1280/-/games/424/424facd40f4eb1f2794fe4b4bb28a277.jpg", 59.5),
  mockEntry(200035, "Mass Effect Trilogy", "2012", "https://media.rawg.io/media/resize/1280/-/games/64e/64e2a77f37ddc48d102127234af99886.jpg", 110),
  mockEntry(200036, "Metaphor: ReFantazio", "2024", "https://media.rawg.io/media/resize/1280/-/games/2cd/2cd2467a32aaaed0bdeb192c2831cfe0.jpg", 50),
  mockEntry(200037, "Crash Bandicoot 4: It's About Time", "2020", "https://media.rawg.io/media/resize/1280/-/games/54a/54a14917b3298bbaacdf9873c3af7229.jpg", 9),
  mockEntry(200038, "Assassin's Creed Shadows", "2025", "https://media.rawg.io/media/resize/1280/-/games/526/526881e0f5f8c1550e51df3801f96ea3.jpg", 42.5),
  mockEntry(200039, "Persona 4", "2008", "https://media.rawg.io/media/resize/1280/-/games/052/05237236b13f321e0fd9efa984a7d7a1.jpg", 60),
  mockEntry(200040, "Mad Max", "2015", "https://media.rawg.io/media/resize/1280/-/games/d7d/d7d33daa1892e2468cd0263d5dfc957e.jpg", 20),
  mockEntry(200041, "Fallout 3", "2008", "https://media.rawg.io/media/resize/1280/-/games/5a4/5a4e70bb8a862829dbaa398aa5f66afc.jpg", 27),
  mockEntry(200042, "Hotline Miami", "2012", "https://media.rawg.io/media/resize/1280/-/games/9fa/9fa63622543e5d4f6d99aa9d73b043de.jpg", 5),
  mockEntry(200043, "Undertale", "2015", "https://media.rawg.io/media/resize/1280/-/games/ffe/ffed87105b14f5beff72ff44a7793fd5.jpg", 7),
  mockEntry(200044, "DmC: Devil May Cry", "2013", "https://media.rawg.io/media/resize/1280/-/games/295/295eb868c241e6ad32ac033b8e6a2ede.jpg", 9),
  mockEntry(200045, "Crash Bandicoot N. Sane Trilogy", "2017", "https://media.rawg.io/media/resize/1280/-/games/444/4440f674e2bcb257e249a9ab595d8ab6.jpg", 20),
  mockEntry(200046, "Metal Gear Solid", "1998", "https://media.rawg.io/media/resize/1280/-/games/bbc/bbce6f1659d35ffc16aed8b66e9990a1.jpg", 11),
  mockEntry(200047, "Murdered: Soul Suspect", "2014", "https://media.rawg.io/media/resize/1280/-/games/54a/54a3e4c617217848dc43c4de9989fe37.jpg", 7),
  mockEntry(200048, "Alan Wake", "2010", "https://media.rawg.io/media/resize/1280/-/games/5c0/5c0dd63002cb23f804aab327d40ef119.jpg", 11),
  mockEntry(200049, "Alan Wake's American Nightmare", "2012", "https://media.rawg.io/media/resize/1280/-/games/0b3/0b34647c42271600399b93d19b10f1aa.jpg", 3.5),
  mockEntry(200050, "Assassin's Creed Mirage", "2023", "https://media.rawg.io/media/resize/1280/-/games/fbd/fbd0128013b7965904be571e75fb30c0.jpg", 16.5),
  mockEntry(200051, "Fallout: New Vegas", "2010", "https://media.rawg.io/media/resize/1280/-/games/995/9951d9d55323d08967640f7b9ab3e342.jpg", 31),
  mockEntry(200052, "Clair Obscur: Expedition 33", "2025", "https://media.rawg.io/media/resize/1280/-/games/466/4667f17fdee9ebbcea2049e54f8e2b96.jpg", 30),
  mockEntry(200053, "Ori and the Will of the Wisps", "2020", "https://media.rawg.io/media/resize/1280/-/games/718/71891d2484a592d871e91dc826707e1c.jpg", 12),
  mockEntry(200054, "Star Wars Jedi: Survivor", "2023", "https://media.rawg.io/media/resize/1280/-/games/3e4/3e43e29ae126ef951842393f5ff7f33a.jpg", 20),
  mockEntry(200055, "Mullet MadJack", "2024", "https://media.rawg.io/media/resize/1280/-/games/abb/abb7001813e2976becc44289d61d59c3.jpg", 3),
];

export function normalizeTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function mockHours(externalId: number, title?: string): number | null {
  const byId = MOCK_CATALOG.find((game) => game.id === externalId);
  if (byId) {
    return byId.hoursToBeat;
  }
  if (title) {
    const byTitle = MOCK_CATALOG.find((game) => normalizeTitle(game.name) === normalizeTitle(title));
    if (byTitle) {
      return byTitle.hoursToBeat;
    }
  }
  return null;
}

export function mockSearch(q: string): GameSearchResult[] {
  const term = q.toLowerCase();
  return MOCK_CATALOG.filter((g) => g.name.toLowerCase().includes(term)).map(toSearchResult);
}

function mockById(externalId: number): GameSearchResult | undefined {
  const game = MOCK_CATALOG.find((g) => g.id === externalId);
  return game ? toSearchResult(game) : undefined;
}

export async function searchGamesRawg(q: string): Promise<GameSearchResult[]> {
  const key = process.env.RAWG_KEY?.trim();

  if (!key) {
    return mockSearch(q);
  }

  try {
    const { data } = await axios.get<{ results: RawgGame[] }>(RAWG_URL, {
      params: { search: q, key, page_size: PAGE_SIZE },
      timeout: RAWG_TIMEOUT_MS,
    });
    return data.results
      .filter((g) => g.name)
      .map((g) => toSearchResult({ ...g, hoursToBeat: mockHours(g.id, g.name) }));
  } catch {
    throw new RawgUnavailableError();
  }
}

export async function getGameDetailsRawg(externalId: number): Promise<GameSearchResult> {
  const key = process.env.RAWG_KEY?.trim();

  if (!key) {
    const mock = mockById(externalId);
    if (!mock) {
      throw new RawgUnavailableError();
    }
    return mock;
  }

  try {
    const { data } = await axios.get<RawgGame>(`${RAWG_URL}/${externalId}`, {
      params: { key },
      timeout: RAWG_TIMEOUT_MS,
    });
    return toSearchResult({ ...data, hoursToBeat: mockHours(data.id, data.name) });
  } catch {
    throw new RawgUnavailableError();
  }
}