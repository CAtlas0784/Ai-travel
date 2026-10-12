import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/http.js";

export const placeRouter = Router();

placeRouter.get(
  "/trending",
  asyncHandler(async (_req, res) => {
    const places = await prisma.place.findMany({ orderBy: [{ rating: "desc" }, { name: "asc" }], take: 8 });
    res.json({ places });
  })
);

placeRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const place = await prisma.place.findUnique({ where: { id: req.params.id } });
    res.json({ place });
  })
);
