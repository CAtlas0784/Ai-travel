import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/http.js";
import { chatSchema } from "../validation/schemas.js";
import { answerTravelQuestion, toStreamChunks } from "../services/ai.service.js";

export const chatRouter = Router();
chatRouter.use(requireAuth);

async function createAnswer(userId: string, body: unknown) {
  const input = chatSchema.parse(body);
  const conversation =
    input.conversationId
      ? await prisma.conversation.update({
          where: { id: input.conversationId, userId },
          data: { updatedAt: new Date() }
        })
      : await prisma.conversation.create({
          data: {
            userId,
            title: input.message.slice(0, 56)
          }
        });

  await prisma.message.create({
    data: {
      role: "USER",
      content: input.message,
      imageUrl: input.imageUrl,
      userId,
      conversationId: conversation.id
    }
  });

  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 12
  });
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  const answer = await answerTravelQuestion(
    history.map((message: { role: string; content: string }) => ({
      role: message.role === "ASSISTANT" ? "assistant" : "user",
      content: message.content
    })),
    settings?.aiModel ?? "AUTO"
  );

  const assistantMessage = await prisma.message.create({
    data: {
      role: "ASSISTANT",
      content: answer,
      userId,
      conversationId: conversation.id
    }
  });

  return { conversation, assistantMessage, answer };
}

chatRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const result = await createAnswer(req.user!.id, req.body);
    res.json({ conversation: result.conversation, message: result.assistantMessage });
  })
);

chatRouter.post(
  "/stream",
  asyncHandler(async (req, res) => {
    const result = await createAnswer(req.user!.id, req.body);
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    });

    res.write(`event: meta\ndata: ${JSON.stringify({ conversation: result.conversation })}\n\n`);
    for (const chunk of toStreamChunks(result.answer)) {
      res.write(`event: token\ndata: ${JSON.stringify({ token: chunk })}\n\n`);
      await new Promise((resolve) => setTimeout(resolve, 28));
    }
    res.write(`event: done\ndata: ${JSON.stringify({ message: result.assistantMessage })}\n\n`);
    res.end();
  })
);
