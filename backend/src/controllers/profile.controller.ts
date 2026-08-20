import type { NextFunction, Request, Response } from "express";
import { getProfile, updateProfile } from "../services/profile.service.js";

export async function showProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await getProfile(req.userId ?? ""));
  } catch (err) {
    next(err);
  }
}

export async function patchProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await updateProfile(req.userId ?? "", req.body ?? {}));
  } catch (err) {
    next(err);
  }
}