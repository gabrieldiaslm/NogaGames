import { randomBytes } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../types/errors.js";

const INVITE_CODE_LENGTH = 10;

function generateInviteCode(): string {
  return randomBytes(INVITE_CODE_LENGTH).toString("base64url").toUpperCase().slice(0, INVITE_CODE_LENGTH);
}

export async function requireGroupMember(userId: string, groupId: string): Promise<void> {
  const member = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
  if (!member) {
    throw new AppError(403, "Você não é membro deste grupo.");
  }
}

export async function requireGroupAdmin(userId: string, groupId: string): Promise<void> {
  const member = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
  if (!member) {
    throw new AppError(403, "Você não é membro deste grupo.");
  }
  if (member.role !== "ADMIN") {
    throw new AppError(403, "Apenas o ADMIN do grupo pode fazer isso.");
  }
}

export interface GroupSummary {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  ownerId: string;
  memberCount: number;
  gameCount: number;
  myRole: "ADMIN" | "MEMBER";
  createdAt: string;
}

export async function createGroup(
  userId: string,
  data: { name?: string; description?: string },
): Promise<GroupSummary> {
  const name = String(data.name ?? "").trim();
  if (!name) {
    throw new AppError(400, "O nome do grupo é obrigatório.");
  }

  const group = await prisma.group.create({
    data: {
      name,
      description: data.description?.trim() ? String(data.description).trim() : null,
      ownerId: userId,
      inviteCode: generateInviteCode(),
      members: {
        create: { userId, role: "ADMIN" },
      },
    },
    include: { _count: { select: { members: true, games: true } } },
  });

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    inviteCode: group.inviteCode,
    ownerId: group.ownerId,
    memberCount: group._count.members,
    gameCount: group._count.games,
    myRole: "ADMIN",
    createdAt: group.createdAt.toISOString(),
  };
}

export async function getMyGroups(userId: string): Promise<GroupSummary[]> {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: { _count: { select: { members: true, games: true } } },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return memberships.map((membership) => ({
    id: membership.group.id,
    name: membership.group.name,
    description: membership.group.description,
    inviteCode: membership.group.inviteCode,
    ownerId: membership.group.ownerId,
    memberCount: membership.group._count.members,
    gameCount: membership.group._count.games,
    myRole: membership.role,
    createdAt: membership.group.createdAt.toISOString(),
  }));
}

export async function joinGroupByCode(userId: string, groupId: string, inviteCode?: string): Promise<GroupSummary> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { _count: { select: { members: true, games: true } } },
  });

  if (!group) {
    throw new AppError(404, "Grupo não encontrado.");
  }
  if (String(inviteCode ?? "").trim().toUpperCase() !== group.inviteCode) {
    throw new AppError(403, "Código de convite inválido.");
  }

  const existing = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
  if (existing) {
    throw new AppError(409, "Você já participa deste grupo.");
  }

  await prisma.groupMember.create({
    data: { userId, groupId, role: "MEMBER" },
  });

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    inviteCode: group.inviteCode,
    ownerId: group.ownerId,
    memberCount: group._count.members + 1,
    gameCount: group._count.games,
    myRole: "MEMBER",
    createdAt: group.createdAt.toISOString(),
  };
}

export interface GroupMemberItem {
  id: string;
  username: string;
  avatarUrl: string | null;
  role: "ADMIN" | "MEMBER";
  joinedAt: string;
}

export async function getGroupMembers(userId: string, groupId: string): Promise<GroupMemberItem[]> {
  await requireGroupMember(userId, groupId);

  const members = await prisma.groupMember.findMany({
    where: { groupId },
    include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    orderBy: [{ role: "desc" }, { joinedAt: "asc" }],
  });

  return members.map((member) => ({
    id: member.user.id,
    username: member.user.username,
    avatarUrl: member.user.avatarUrl,
    role: member.role,
    joinedAt: member.joinedAt.toISOString(),
  }));
}

export async function removeGroupMember(
  actorId: string,
  groupId: string,
  targetUserId: string,
): Promise<void> {
  await requireGroupAdmin(actorId, groupId);

  if (targetUserId === actorId) {
    throw new AppError(400, "O ADMIN não pode remover a si mesmo.");
  }

  try {
    await prisma.groupMember.delete({
      where: { userId_groupId: { userId: targetUserId, groupId } },
    });
  } catch (err) {
    if ((err as { code?: string }).code === "P2025") {
      throw new AppError(404, "Membro não encontrado no grupo.");
    }
    throw err;
  }
}

export async function getGroupById(userId: string, groupId: string): Promise<GroupSummary> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { _count: { select: { members: true, games: true } } },
  });
  if (!group) {
    throw new AppError(404, "Grupo não encontrado.");
  }

  await requireGroupMember(userId, groupId);

  const myRole = (await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
    select: { role: true },
  }))?.role;

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    inviteCode: group.inviteCode,
    ownerId: group.ownerId,
    memberCount: group._count.members,
    gameCount: group._count.games,
    myRole: myRole ?? "MEMBER",
    createdAt: group.createdAt.toISOString(),
  };
}

export async function deleteGroup(actorId: string, groupId: string): Promise<void> {
  await requireGroupAdmin(actorId, groupId);

  try {
    await prisma.group.delete({ where: { id: groupId } });
  } catch (err) {
    if ((err as { code?: string }).code === "P2025") {
      throw new AppError(404, "Grupo não encontrado.");
    }
    throw err;
  }
}