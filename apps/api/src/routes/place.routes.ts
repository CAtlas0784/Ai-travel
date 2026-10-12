import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, HttpError } from "../lib/http.js";

export const placeRouter = Router();

placeRouter.get(
  "/trending",
  asyncHandler(async (_req, res) => {
    const places = await prisma.place.findMany({ orderBy: { name: "asc" }, take: 12 });
    res.json({ places });
  })
);

placeRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const place = await prisma.place.findUnique({ where: { id: req.params.id } });
    if (!place) throw new HttpError(404, "Place not found");
    res.json({ place });
  })
);
