import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, HttpError } from "../lib/http.js";
import { conversationCreateSchema, conversationUpdateSchema } from "../validation/schemas.js";

export const conversationRouter = Router();
conversationRouter.use(requireAuth);

conversationRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const conversations = await prisma.conversation.findMany({
      where: {
        userId: req.user!.id,
        title: search ? { contains: search, mode: "insensitive" } : undefined
      },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } }
    });
    res.json({ conversations });
  })
);

conversationRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = conversationCreateSchema.parse(req.body);
    const conversation = await prisma.conversation.create({
      data: { title: input.title, userId: req.user!.id }
    });
    res.status(201).json({ conversation });
  })
);

conversationRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = conversationUpdateSchema.parse(req.body);
    const conversation = await prisma.conversation.update({
      where: { id: req.params.id, userId: req.user!.id },
      data: input
    });
    res.json({ conversation });
  })
);

conversationRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.conversation.delete({ where: { id: req.params.id, userId: req.user!.id } });
    res.status(204).send();
  })
);

conversationRouter.get(
  "/:id/messages",
  asyncHandler(async (req, res) => {
    const conversation = await prisma.conversation.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      include: { messages: { orderBy: { createdAt: "asc" } } }
    });
    if (!conversation) throw new HttpError(404, "Conversation not found");
    res.json({ messages: conversation.messages });
  })
);
