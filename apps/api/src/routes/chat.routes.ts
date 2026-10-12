import { Router } from "express";
import type { Conversation } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { asyncHandler, HttpError } from "../lib/http.js";
import { chatSchema } from "../validation/schemas.js";
import { answerTravelQuestion } from "../services/ai.service.js";

export const chatRouter = Router();
chatRouter.use(requireAuth);

async function createAnswer(
  userId: string,
  body: unknown,
  signal?: AbortSignal,
  onConversation?: (conversation: Conversation) => void,
  onToken?: (token: string) => void
) {
  const input = chatSchema.parse(body);
  let conversation = input.conversationId
    ? await prisma.conversation.findFirst({ where: { id: input.conversationId, userId } })
    : null;

  if (input.conversationId && !conversation) {
    throw new HttpError(404, "Conversation not found");
  }

  if (!conversation) {
    if (input.regenerate) throw new HttpError(400, "Cannot regenerate without a conversation");
    conversation = await prisma.conversation.create({
      data: {
        userId,
        title: input.message.slice(0, 56)
      }
    });
  }

  if (input.regenerate) {
    const latestMessages = await prisma.message.findMany({
      where: { conversationId: conversation.id, userId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 2
    });
    const [latestMessage, previousMessage] = latestMessages;
    const canRetryUnansweredMessage = latestMessage?.role === "USER" && latestMessage.content === input.message;
    const canRegenerateLatestAnswer =
      latestMessage?.role === "ASSISTANT" &&
      previousMessage?.role === "USER" &&
      previousMessage.content === input.message;
    if (!canRetryUnansweredMessage && !canRegenerateLatestAnswer) {
      throw new HttpError(409, "The latest answer cannot be regenerated");
    }
    if (canRegenerateLatestAnswer) await prisma.message.delete({ where: { id: latestMessage.id } });
  } else {
    await prisma.message.create({
      data: {
        role: "USER",
        content: input.message,
        imageUrl: input.imageUrl,
        userId,
        conversationId: conversation.id
      }
    });
  }

  conversation = await prisma.conversation.update({
    where: { id: conversation.id, userId },
    data: { updatedAt: new Date() }
  });

  const recentHistory = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 12
  });
  const history = recentHistory.reverse();
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  onConversation?.(conversation);
  const answer = await answerTravelQuestion(
    history.map((message: { role: string; content: string }) => ({
      role: message.role === "ASSISTANT" ? "assistant" : "user",
      content: message.content
    })),
    settings?.aiModel ?? "AUTO",
    signal,
    onToken
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
    const controller = new AbortController();
    res.on("close", () => {
      if (!res.writableEnded) controller.abort();
    });

    try {
      const result = await createAnswer(
        req.user!.id,
        req.body,
        controller.signal,
        (conversation) => {
          res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive"
          });
          res.write(`event: meta\ndata: ${JSON.stringify({ conversation })}\n\n`);
        },
        (token) => {
          if (!controller.signal.aborted && !res.destroyed) {
            res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
          }
        }
      );
      if (controller.signal.aborted || res.destroyed) return;
      res.write(`event: done\ndata: ${JSON.stringify({ message: result.assistantMessage })}\n\n`);
      res.end();
    } catch (error) {
      if (controller.signal.aborted || res.destroyed) return;
      if (!res.headersSent) throw error;
      res.write(`event: error\ndata: ${JSON.stringify({ message: "AI response could not be completed. Please try again." })}\n\n`);
      res.end();
    }
  })
);
