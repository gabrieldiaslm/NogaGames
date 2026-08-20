import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import {
  createGroupHandler,
  getGroup,
  joinGroup,
  listGroups,
  listMembers,
  removeMember,
} from "../controllers/group.controller.js";
import { getBacklog, getCompleted, getDashboard } from "../controllers/game.controller.js";

export const groupRoutes = Router();

groupRoutes.use(authMiddleware);

groupRoutes.get("/", listGroups);
groupRoutes.post("/", createGroupHandler);
groupRoutes.post("/:id/join", joinGroup);
groupRoutes.get("/:id", getGroup);
groupRoutes.get("/:id/members", listMembers);
groupRoutes.delete("/:id/members/:userId", removeMember);
groupRoutes.get("/:id/dashboard", getDashboard);
groupRoutes.get("/:id/backlog", getBacklog);
groupRoutes.get("/:id/completed", getCompleted);