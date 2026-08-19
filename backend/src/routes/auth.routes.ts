import { Router } from "express";
import { login, me, register } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.js";

export const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.get("/me", authMiddleware, me);