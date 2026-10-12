import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/http.js";

export const savedPlaceRouter = Router();
savedPlaceRouter.use(requireAuth);

savedPlaceRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const savedPlaces = await prisma.savedPlace.findMany({
      where: { userId: req.user!.id },
      include: { place: true },
      orderBy: { createdAt: "desc" }
    });
    res.json({ savedPlaces });
  })
);

savedPlaceRouter.post(
  "/:placeId",
  asyncHandler(async (req, res) => {
    const note = typeof req.body?.note === "string" ? req.body.note.slice(0, 240) : undefined;
    const savedPlace = await prisma.savedPlace.upsert({
      where: { userId_placeId: { userId: req.user!.id, placeId: req.params.placeId } },
      create: { userId: req.user!.id, placeId: req.params.placeId, note },
      update: { note },
      include: { place: true }
    });
    res.status(201).json({ savedPlace });
  })
);

savedPlaceRouter.delete(
  "/:placeId",
  asyncHandler(async (req, res) => {
    await prisma.savedPlace.delete({ where: { userId_placeId: { userId: req.user!.id, placeId: req.params.placeId } } });
    res.status(204).send();
  })
);
