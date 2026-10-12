import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { asyncHandler, HttpError } from "./lib/http.js";
import { errorHandler, notFound } from "./middleware/error.js";
import {
  chatSchema,
  conversationCreateSchema,
  conversationUpdateSchema,
  loginSchema,
  registerSchema,
  settingsSchema
} from "./validation/schemas.js";

type User = {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  avatarUrl: string | null;
};

type DemoSettings = {
  theme: "system" | "light" | "dark";
  language: "th" | "en";
  aiModel: "AUTO" | "GEMINI" | "OPENAI";
};

type Conversation = {
  id: string;
  title: string;
  pinned: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

type Message = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  imageUrl?: string | null;
  conversationId: string;
  userId: string;
  createdAt: string;
};

const app = express();
const port = Number(process.env.PORT ?? 4000);
const users = new Map<string, User>();
const tokens = new Map<string, string>();
const conversations = new Map<string, Conversation>();
const messages = new Map<string, Message[]>();
const userSettings = new Map<string, DemoSettings>();
const userFavorites = new Map<string, Set<string>>();
const userSavedPlaces = new Map<string, Map<string, string | null>>();
const defaultSettings: DemoSettings = { theme: "light", language: "th", aiModel: "AUTO" };

const places = [
  {
    id: "hup-pa-tat",
    name: "หุบป่าตาด",
    slug: "hup-pa-tat",
    description: "ถ้ำหุบป่าตาดอยู่ในอำเภอลานสัก เป็นหุบเขาที่มีต้นตาดและอยู่ในความดูแลของเขตห้ามล่าสัตว์ป่าถ้ำประทุน",
    imageUrl: null,
    rating: null,
    openHours: null,
    category: "ธรรมชาติ",
    address: "ตำบลทุ่งนางาม อำเภอลานสัก จังหวัดอุทัยธานี 61160",
    entranceFee: "ข้อมูล ททท.: ผู้ใหญ่ชาวไทย 20 บาท เด็กชาวไทย 10 บาท ชาวต่างชาติ 200 บาท; โปรดตรวจสอบกับสถานที่ก่อนเดินทาง",
    sourceUrl: "https://thai.tourismthailand.org/Attraction/%E0%B8%96%E0%B9%89%E0%B8%B3%E0%B8%AB%E0%B8%B8%E0%B8%9B%E0%B9%88%E0%B8%B2%E0%B8%95%E0%B8%B2%E0%B8%94",
    verifiedAt: "2026-10-12T00:00:00.000Z"
  },
  {
    id: "khao-sakae-krang",
    name: "เขาสะแกกรัง",
    slug: "khao-sakae-krang",
    description: "ยอดเขาสะแกกรังเป็นจุดชมวิวเมืองอุทัยธานี และเป็นที่ตั้งของมณฑปประดิษฐานรอยพระพุทธบาทจำลอง",
    imageUrl: null,
    rating: null,
    openHours: null,
    category: "จุดชมวิว",
    address: "ทางหลวงหมายเลข 3220 ตำบลอุทัยใหม่ อำเภอเมืองอุทัยธานี 61000",
    entranceFee: null,
    sourceUrl: "https://thai.tourismthailand.org/Attraction/%E0%B9%80%E0%B8%82%E0%B8%B2%E0%B8%AA%E0%B8%B0%E0%B9%81%E0%B8%81%E0%B8%81%E0%B8%A3%E0%B8%B1%E0%B8%87",
    verifiedAt: "2026-10-12T00:00:00.000Z"
  },
  {
    id: "wat-tha-sung",
    name: "วัดจันทาราม (วัดท่าซุง)",
    slug: "wat-tha-sung",
    description: "วัดจันทาราม หรือวัดท่าซุง ตั้งอยู่ตำบลน้ำซึม อำเภอเมืองอุทัยธานี และมีวิหารแก้ว 100 เมตร",
    imageUrl: null,
    rating: null,
    openHours: null,
    category: "วัด",
    address: "60 หมู่ 1 ถนนอุทัยธานี-มโนรมย์ ตำบลน้ำซึม อำเภอเมืองอุทัยธานี 61000",
    entranceFee: null,
    sourceUrl: "https://thai.tourismthailand.org/Attraction/%E0%B8%A7%E0%B8%B1%E0%B8%94%E0%B8%88%E0%B8%B1%E0%B8%99%E0%B8%97%E0%B8%B2%E0%B8%A3%E0%B8%B2%E0%B8%A1-%E0%B8%A7%E0%B8%B1%E0%B8%94%E0%B8%97%E0%B9%88%E0%B8%B2%E0%B8%8B%E0%B8%B8%E0%B8%87",
    verifiedAt: "2026-10-12T00:00:00.000Z"
  },
  {
    id: "cyber-waterfall",
    name: "น้ำตกไซเบอร์",
    slug: "cyber-waterfall",
    description: "น้ำตกไซเบอร์ หรือ น้ำตกหินลาด อยู่ใกล้หมู่บ้านไซเบอร์ (บ้านซับแม่บือ) อำเภอห้วยคต และอยู่ในความรับผิดชอบของหน่วยพิทักษ์ป่าไซเบอร์",
    imageUrl: null,
    rating: null,
    openHours: null,
    category: "น้ำตก",
    address: "ใกล้หมู่บ้านไซเบอร์ (บ้านซับแม่บือ) อำเภอห้วยคต จังหวัดอุทัยธานี",
    entranceFee: null,
    sourceUrl: "https://thailandtourismdirectory.go.th/attraction/3071",
    verifiedAt: "2026-10-12T00:00:00.000Z"
  }
];

function publicUser(user: User) {
  return { id: user.id, username: user.username, email: user.email, avatarUrl: user.avatarUrl };
}

function getUser(req: express.Request) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) return undefined;
  const token = authorization.slice("Bearer ".length);
  const userId = token ? tokens.get(token) : undefined;
  return userId ? users.get(userId) : undefined;
}

function getOwnedConversation(id: string, userId: string) {
  const conversation = conversations.get(id);
  return conversation?.userId === userId ? conversation : undefined;
}

function getSettings(userId: string) {
  return userSettings.get(userId) ?? defaultSettings;
}

function getPlace(id: string) {
  return places.find((place) => place.id === id);
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = getUser(req);
  if (!user) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }
  res.locals.user = user;
  next();
}

function makeAnswer(question: string) {
  return [
    `นี่คือคำตอบจาก backend demo สำหรับคำถาม: **${question}**`,
    "",
    "ถ้าเป็นระบบจริงจะส่งคำถามไป Gemini ก่อน และ fallback ไป ChatGPT เมื่อ Gemini ใช้งานไม่ได้",
    "",
    "สำหรับการเที่ยวอุทัยธานี แนะนำเริ่มจากวัดท่าซุงช่วงเช้า ต่อด้วยเขาสะแกกรังช่วงเย็น และเก็บหุบป่าตาดไว้ในวันที่อยากเดินธรรมชาติ"
  ].join("\n");
}

app.use(helmet());
app.use(cors({ origin: ["http://127.0.0.1:5173", "http://localhost:5173"], credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ status: "ok", mode: "demo" }));

app.post(
  "/api/auth/register",
  asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body);
    const existing = [...users.values()].find(
      (user) => user.email === input.email || user.username.toLowerCase() === input.username.toLowerCase()
    );
    if (existing?.email === input.email) throw new HttpError(409, "Duplicate email");
    if (existing?.username.toLowerCase() === input.username.toLowerCase()) throw new HttpError(409, "Duplicate username");

    const user: User = {
      id: randomUUID(),
      username: input.username,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, 12),
      avatarUrl: null
    };
    const token = randomUUID();
    users.set(user.id, user);
    tokens.set(token, user.id);
    userSettings.set(user.id, { ...defaultSettings });
    res.status(201).json({ token, user: publicUser(user) });
  })
);

app.post(
  "/api/auth/login",
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const user = [...users.values()].find((item) => item.email === input.email);
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new HttpError(401, "Invalid email or password");
    }

    const token = randomUUID();
    tokens.set(token, user.id);
    res.json({ token, user: publicUser(user) });
  })
);

app.get("/api/auth/me", requireAuth, (_req, res) => {
  res.json({ user: publicUser(res.locals.user) });
});

app.get("/api/places/trending", (_req, res) => res.json({ places }));
app.get("/api/places/:id", (req, res, next) => {
  const place = getPlace(req.params.id);
  if (!place) return next(new HttpError(404, "Place not found"));
  res.json({ place });
});

app.get("/api/settings", requireAuth, (req, res) => {
  const user = res.locals.user as User;
  res.json({ settings: getSettings(user.id) });
});

app.patch("/api/settings", requireAuth, (req, res, next) => {
  const input = settingsSchema.safeParse(req.body);
  if (!input.success) return next(input.error);
  const user = res.locals.user as User;
  const settings = { ...getSettings(user.id), ...input.data };
  userSettings.set(user.id, settings);
  res.json({ settings });
});

app.get("/api/user/profile", requireAuth, (_req, res) => {
  res.json({ user: publicUser(res.locals.user) });
});

app.get("/api/conversations", requireAuth, (req, res) => {
  const user = res.locals.user as User;
  const search = String(req.query.search ?? "").toLowerCase();
  const items = [...conversations.values()]
    .filter((conversation) => conversation.userId === user.id)
    .filter((conversation) => !search || conversation.title.toLowerCase().includes(search))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt))
    .map((conversation) => ({ ...conversation, messages: messages.get(conversation.id)?.slice(-1) ?? [] }));
  res.json({ conversations: items });
});

app.post("/api/conversations", requireAuth, (req, res, next) => {
  const input = conversationCreateSchema.safeParse(req.body);
  if (!input.success) return next(input.error);
  const user = res.locals.user as User;
  const now = new Date().toISOString();
  const conversation: Conversation = {
    id: randomUUID(),
    title: input.data.title,
    pinned: false,
    userId: user.id,
    createdAt: now,
    updatedAt: now
  };
  conversations.set(conversation.id, conversation);
  messages.set(conversation.id, []);
  res.status(201).json({ conversation });
});

app.patch("/api/conversations/:id", requireAuth, (req, res, next) => {
  const input = conversationUpdateSchema.safeParse(req.body);
  if (!input.success) return next(input.error);
  const user = res.locals.user as User;
  const current = getOwnedConversation(req.params.id, user.id);
  if (!current) return next(new HttpError(404, "Conversation not found"));
  const updated = { ...current, ...input.data, updatedAt: new Date().toISOString() };
  conversations.set(updated.id, updated);
  res.json({ conversation: updated });
});

app.delete("/api/conversations/:id", requireAuth, (req, res, next) => {
  const user = res.locals.user as User;
  const conversation = getOwnedConversation(req.params.id, user.id);
  if (!conversation) return next(new HttpError(404, "Conversation not found"));
  conversations.delete(conversation.id);
  messages.delete(conversation.id);
  res.status(204).send();
});

app.get("/api/conversations/:id/messages", requireAuth, (req, res, next) => {
  const user = res.locals.user as User;
  const conversation = getOwnedConversation(req.params.id, user.id);
  if (!conversation) return next(new HttpError(404, "Conversation not found"));
  res.json({ messages: messages.get(conversation.id) ?? [] });
});

async function createDemoAnswer(user: User, body: unknown) {
  const input = chatSchema.parse(body);
  let conversation = input.conversationId ? getOwnedConversation(input.conversationId, user.id) : undefined;
  if (input.conversationId && !conversation) throw new HttpError(404, "Conversation not found");

  if (!conversation) {
    if (input.regenerate) throw new HttpError(400, "Cannot regenerate without a conversation");
    const now = new Date().toISOString();
    conversation = {
      id: randomUUID(),
      title: input.message.slice(0, 56),
      pinned: false,
      userId: user.id,
      createdAt: now,
      updatedAt: now
    };
    conversations.set(conversation.id, conversation);
    messages.set(conversation.id, []);
  }

  const conversationMessages = messages.get(conversation.id) ?? [];
  if (input.regenerate) {
    const latest = conversationMessages.slice(-2);
    const unanswered = latest.length === 1 && latest[0]?.role === "USER" && latest[0].content === input.message;
    const previousAnswer =
      latest[1]?.role === "USER" && latest[0]?.role === "ASSISTANT" && latest[1].content === input.message;
    if (!unanswered && !previousAnswer) {
      throw new HttpError(409, "The latest answer cannot be regenerated");
    }
    if (previousAnswer) conversationMessages.pop();
  } else {
    conversationMessages.push({
      id: randomUUID(),
      role: "USER",
      content: input.message,
      imageUrl: input.imageUrl,
      conversationId: conversation.id,
      userId: user.id,
      createdAt: new Date().toISOString()
    });
  }

  conversation.updatedAt = new Date().toISOString();
  const answer = makeAnswer(input.message);
  const assistantMessage: Message = {
    id: randomUUID(),
    role: "ASSISTANT",
    content: answer,
    conversationId: conversation.id,
    userId: user.id,
    createdAt: new Date().toISOString()
  };
  conversationMessages.push(assistantMessage);
  messages.set(conversation.id, conversationMessages);
  return { conversation, assistantMessage, answer };
}

app.post(
  "/api/chat/stream",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = res.locals.user as User;
    const result = await createDemoAnswer(user, req.body);
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    });
    res.write(`event: meta\ndata: ${JSON.stringify({ conversation: result.conversation })}\n\n`);
    for (const chunk of result.answer.match(/.{1,36}(\s|$)/g) ?? [result.answer]) {
      res.write(`event: token\ndata: ${JSON.stringify({ token: chunk })}\n\n`);
      await new Promise((resolve) => setTimeout(resolve, 24));
    }
    res.write(`event: done\ndata: ${JSON.stringify({ message: result.assistantMessage })}\n\n`);
    res.end();
  })
);

app.post(
  "/api/chat",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = res.locals.user as User;
    const result = await createDemoAnswer(user, req.body);
    res.json({ conversation: result.conversation, message: result.assistantMessage });
  })
);

app.get("/api/favorites", requireAuth, (req, res) => {
  const user = res.locals.user as User;
  const favorites = [...(userFavorites.get(user.id) ?? [])].flatMap((placeId) => {
    const place = getPlace(placeId);
    return place ? [{ place }] : [];
  });
  res.json({ favorites });
});

app.post("/api/favorites/:placeId", requireAuth, (req, res, next) => {
  const place = getPlace(req.params.placeId);
  if (!place) return next(new HttpError(404, "Place not found"));
  const user = res.locals.user as User;
  const favorites = userFavorites.get(user.id) ?? new Set<string>();
  favorites.add(place.id);
  userFavorites.set(user.id, favorites);
  res.status(201).json({ favorite: { place } });
});

app.delete("/api/favorites/:placeId", requireAuth, (req, res) => {
  const user = res.locals.user as User;
  userFavorites.get(user.id)?.delete(req.params.placeId);
  res.status(204).send();
});

app.get("/api/saved-places", requireAuth, (req, res) => {
  const user = res.locals.user as User;
  const savedPlaces = [...(userSavedPlaces.get(user.id) ?? new Map<string, string | null>())].flatMap(([placeId, note]) => {
    const place = getPlace(placeId);
    return place ? [{ place, note }] : [];
  });
  res.json({ savedPlaces });
});

app.post("/api/saved-places/:placeId", requireAuth, (req, res, next) => {
  const place = getPlace(req.params.placeId);
  if (!place) return next(new HttpError(404, "Place not found"));
  const user = res.locals.user as User;
  const savedPlaces = userSavedPlaces.get(user.id) ?? new Map<string, string | null>();
  const note = typeof req.body?.note === "string" ? req.body.note.slice(0, 240) : savedPlaces.get(place.id) ?? null;
  savedPlaces.set(place.id, note);
  userSavedPlaces.set(user.id, savedPlaces);
  res.status(201).json({ savedPlace: { place, note } });
});

app.delete("/api/saved-places/:placeId", requireAuth, (req, res) => {
  const user = res.locals.user as User;
  userSavedPlaces.get(user.id)?.delete(req.params.placeId);
  res.status(204).send();
});

app.use(notFound);
app.use(errorHandler);

app.listen(port, "127.0.0.1", () => {
  console.log(`Demo API ready on http://127.0.0.1:${port}`);
});
