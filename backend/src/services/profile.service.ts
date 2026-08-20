import { prisma } from "../lib/prisma.js";
import { AppError } from "../types/errors.js";
import type { AuthUser } from "../types/index.js";

export interface Profile extends AuthUser {
  avatarUrl: string | null;
}

export async function getProfile(userId: string): Promise<Profile> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "Usuário não encontrado.");
  }
  return { id: user.id, username: user.username, email: user.email, avatarUrl: user.avatarUrl };
}

export async function updateProfile(
  userId: string,
  data: { username?: string; avatarUrl?: string | null },
): Promise<Profile> {
  const username = typeof data.username === "string" ? data.username.trim() : undefined;
  const avatarUrl = typeof data.avatarUrl === "string" ? (data.avatarUrl.trim() || null) : undefined;

  if (username !== undefined && !username) {
    throw new AppError(400, "O username não pode ficar vazio.");
  }

  if (username !== undefined) {
    const taken = await prisma.user.findFirst({
      where: { username, NOT: { id: userId } },
      select: { id: true },
    });
    if (taken) {
      throw new AppError(409, "Este username já está em uso.");
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(username !== undefined ? { username } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    },
  });

  return { id: user.id, username: user.username, email: user.email, avatarUrl: user.avatarUrl };
}