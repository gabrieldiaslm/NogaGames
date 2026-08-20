import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import {
  createGroupHandler,
  deleteGroupHandler,
  getFilters,
  getGroup,
  getGroupBacklog,
  getGroupCompleted,
  getGroupDashboard,
  getGroupReviewsHandler,
  getRandom,
  joinByCode,
  joinGroup,
  listGroups,
  listMembers,
  removeMember,
} from "../controllers/group.controller.js";

export const groupRoutes = Router();

groupRoutes.use(authMiddleware);

groupRoutes.get("/", listGroups);
groupRoutes.post("/", createGroupHandler);
groupRoutes.post("/join", joinByCode);
groupRoutes.post("/:id/join", joinGroup);
groupRoutes.get("/:id", getGroup);
groupRoutes.get("/:id/members", listMembers);
groupRoutes.delete("/:id/members/:userId", removeMember);
groupRoutes.get("/:id/dashboard", getGroupDashboard);
groupRoutes.get("/:id/backlog", getGroupBacklog);
groupRoutes.get("/:id/completed", getGroupCompleted);
groupRoutes.get("/:id/random", getRandom);
groupRoutes.get("/:id/reviews", getGroupReviewsHandler);
groupRoutes.get("/:id/filters", getFilters);
groupRoutes.delete("/:id", deleteGroupHandler);