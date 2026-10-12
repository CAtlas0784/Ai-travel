import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

export const userRouter = Router();
userRouter.use(requireAuth);

userRouter.get("/profile", (req, res) => {
  res.json({ user: req.user });
});
