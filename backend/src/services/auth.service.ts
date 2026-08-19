import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../types/errors.js";
import type { AuthUser } from "../types/index.js";

const BCRYPT_COST = 10;

export async function registerUser(input: {
  username: string;
  email: string;
  password: string;
}): Promise<AuthUser> {
  const username = input.username?.trim();
  const email = input.email?.trim().toLowerCase();

  if (!username || !email || !input.password) {
    throw new AppError(400, "Username, e-mail e senha são obrigatórios.");
  }

  if (input.password.length < 6) {
    throw new AppError(400, "A senha deve ter pelo menos 6 caracteres.");
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);

  try {
    const user = await prisma.user.create({
      data: { username, email, passwordHash },
    });
    return { id: user.id, username: user.username, email: user.email };
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      throw new AppError(409, "Username ou e-mail já cadastrado.");
    }
    throw err;
  }
}

export async function getProfile(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(404, "Usuário não encontrado.");
  }

  return { id: user.id, username: user.username, email: user.email };
}

export async function loginUser(
  username: string,
  password: string,
): Promise<{ token: string }> {
  const user = await prisma.user.findUnique({
    where: { username: username?.trim() },
  });

  if (!user || !(await bcrypt.compare(password ?? "", user.passwordHash))) {
    throw new AppError(401, "Credenciais inválidas.");
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET ?? "",
    { expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as jwt.SignOptions["expiresIn"] },
  );

  return { token };
}