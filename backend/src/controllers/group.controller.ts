import type { NextFunction, Request, Response } from "express";
import {
  createGroup,
  getGroupById,
  getGroupMembers,
  getMyGroups,
  joinGroupByCode,
  removeGroupMember,
} from "../services/group.service.js";

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