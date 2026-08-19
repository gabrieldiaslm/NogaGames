import type { NextFunction, Request, Response } from "express";
import { getProfile, loginUser, registerUser } from "../services/auth.service.js";

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await registerUser(req.body ?? {});
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, password } = req.body ?? {};
    const result = await loginUser(username, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await getProfile(req.userId ?? "");
    res.json(profile);
  } catch (err) {
    next(err);
  }
}