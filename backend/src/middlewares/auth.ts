import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId: string;
  username: string;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token de autenticação ausente." });
    return;
  }

  try {
    const payload = jwt.verify(
      header.slice("Bearer ".length),
      process.env.JWT_SECRET ?? "",
    ) as JwtPayload;

    req.userId = payload.userId;
    req.username = payload.username;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido ou expirado." });
  }
}