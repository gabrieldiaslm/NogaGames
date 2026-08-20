import type { NextFunction, Request, Response } from "express";
import {
  createGroup,
  deleteGroup,
  getGroupById,
  getGroupMembers,
  getMyGroups,
  joinGroupByCode,
  joinGroupByInviteCode,
  removeGroupMember,
} from "../services/group.service.js";
import { getBacklogGames, getCompletedGames, getDashboardWinner, getGroupFilters, getRandomBacklogGame } from "../services/game.service.js";

export async function listGroups(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await getMyGroups(req.userId ?? ""));
  } catch (err) {
    next(err);
  }
}

export async function createGroupHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const group = await createGroup(req.userId ?? "", req.body ?? {});
    res.status(201).json(group);
  } catch (err) {
    next(err);
  }
}

export async function joinGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { inviteCode } = req.body ?? {};
    const group = await joinGroupByCode(req.userId ?? "", id, inviteCode);
    res.json(group);
  } catch (err) {
    next(err);
  }
}

export async function joinByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { inviteCode } = req.body ?? {};
    const group = await joinGroupByInviteCode(req.userId ?? "", inviteCode);
    res.json(group);
  } catch (err) {
    next(err);
  }
}

export async function getGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await getGroupById(req.userId ?? "", req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await getGroupMembers(req.userId ?? "", req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await removeGroupMember(req.userId ?? "", req.params.id, req.params.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function deleteGroupHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteGroup(req.userId ?? "", req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getRandom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await getRandomBacklogGame(req.params.id, req.userId ?? ""));
  } catch (err) {
    next(err);
  }
}

export async function getFilters(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await getGroupFilters(req.params.id, req.userId ?? ""));
  } catch (err) {
    next(err);
  }
}

export async function getGroupBacklog(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filters = {
      genre: req.query.genre ? String(req.query.genre) : undefined,
      year: req.query.year ? Number(req.query.year) : undefined,
      platform: req.query.platform ? String(req.query.platform) : undefined,
    };
    res.json(await getBacklogGames(req.params.id, req.userId ?? "", filters));
  } catch (err) {
    next(err);
  }
}

export async function getGroupCompleted(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filters = {
      genre: req.query.genre ? String(req.query.genre) : undefined,
      year: req.query.year ? Number(req.query.year) : undefined,
      platform: req.query.platform ? String(req.query.platform) : undefined,
    };
    res.json(await getCompletedGames(req.params.id, req.userId ?? "", filters));
  } catch (err) {
    next(err);
  }
}

export async function getGroupDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await getDashboardWinner(req.params.id, req.userId ?? ""));
  } catch (err) {
    next(err);
  }
}