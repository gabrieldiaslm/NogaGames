import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { patchProfile, showProfile } from "../controllers/profile.controller.js";

export const profileRoutes = Router();

profileRoutes.use(authMiddleware);

profileRoutes.get("/", showProfile);
profileRoutes.patch("/", patchProfile);