import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/http.js";
import { settingsSchema } from "../validation/schemas.js";

export const settingsRouter = Router();
settingsRouter.use(requireAuth);

settingsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const settings = await prisma.userSettings.upsert({
      where: { userId: req.user!.id },
      create: { userId: req.user!.id },
      update: {}
    });
    res.json({ settings });
  })
);

settingsRouter.patch(
  "/",
  asyncHandler(async (req, res) => {
    const input = settingsSchema.parse(req.body);
    const settings = await prisma.userSettings.upsert({
      where: { userId: req.user!.id },
      create: { userId: req.user!.id, ...input },
      update: input
    });
    res.json({ settings });
  })
);
