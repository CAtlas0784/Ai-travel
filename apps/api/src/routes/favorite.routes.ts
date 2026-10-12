import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/http.js";

export const favoriteRouter = Router();
favoriteRouter.use(requireAuth);

favoriteRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const favorites = await prisma.favoritePlace.findMany({
      where: { userId: req.user!.id },
      include: { place: true },
      orderBy: { createdAt: "desc" }
    });
    res.json({ favorites });
  })
);

favoriteRouter.post(
  "/:placeId",
  asyncHandler(async (req, res) => {
    const favorite = await prisma.favoritePlace.upsert({
      where: { userId_placeId: { userId: req.user!.id, placeId: req.params.placeId } },
      create: { userId: req.user!.id, placeId: req.params.placeId },
      update: {},
      include: { place: true }
    });
    res.status(201).json({ favorite });
  })
);

favoriteRouter.delete(
  "/:placeId",
  asyncHandler(async (req, res) => {
    await prisma.favoritePlace.delete({ where: { userId_placeId: { userId: req.user!.id, placeId: req.params.placeId } } });
    res.status(204).send();
  })
);
