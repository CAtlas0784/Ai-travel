import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { randomUUID } from "node:crypto";

type User = {
  id: string;
  username: string;
  email: string;
  password: string;
  avatarUrl: string | null;
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

const places = [
  {
    id: "hup-pa-tat",
    name: "หุบป่าตาด",
    slug: "hup-pa-tat",
    description: "ป่าดึกดำบรรพ์ในถ้ำหินปูน บรรยากาศลึกลับ เหมาะกับสายธรรมชาติและถ่ายภาพ",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    rating: 4.8,
    openHours: "08:30 - 16:30",
    category: "ธรรมชาติ"
  },
  {
    id: "khao-sakae-krang",
    name: "เขาสะแกกรัง",
    slug: "khao-sakae-krang",
    description: "จุดชมวิวเมืองอุทัยธานี เหมาะกับช่วงเช้าและเย็น เห็นแม่น้ำและเมืองแบบกว้าง",
    imageUrl: "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?auto=format&fit=crop&w=1200&q=80",
    rating: 4.7,
    openHours: "เปิดตลอดวัน",
    category: "จุดชมวิว"
  },
  {
    id: "wat-tha-sung",
    name: "วัดท่าซุง",
    slug: "wat-tha-sung",
    description: "วัดสำคัญของอุทัยธานี โดดเด่นด้วยวิหารแก้วและบรรยากาศสงบงาม",
    imageUrl: "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1200&q=80",
    rating: 4.9,
    openHours: "09:00 - 16:00",
    category: "วัด"
  },
  {
    id: "cyber-waterfall",
    name: "น้ำตกไซเบอร์",
    slug: "cyber-waterfall",
    description: "น้ำตกกลางธรรมชาติ เหมาะกับทริปพักใจและเดินเล่นในอากาศร่มรื่น",
    imageUrl: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1200&q=80",
    rating: 4.6,
    openHours: "08:00 - 17:00",
    category: "น้ำตก"
  }
];

function publicUser(user: User) {
  return { id: user.id, username: user.username, email: user.email, avatarUrl: user.avatarUrl };
}

function getUser(req: express.Request) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  const userId = token ? tokens.get(token) : undefined;
  return userId ? users.get(userId) : undefined;
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

app.post("/api/auth/register", (req, res) => {
  const { username, email, password } = req.body ?? {};
  if (!username || !email || !password) {
    res.status(422).json({ message: "Missing register fields" });
    return;
  }
  if ([...users.values()].some((user) => user.email === email)) {
    res.status(409).json({ message: "Duplicate email" });
    return;
  }
  const user: User = { id: randomUUID(), username, email, password, avatarUrl: null };
  const token = randomUUID();
  users.set(user.id, user);
  tokens.set(token, user.id);
  res.status(201).json({ token, user: publicUser(user) });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body ?? {};
  const user = [...users.values()].find((item) => item.email === email && item.password === password);
  if (!user) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }
  const token = randomUUID();
  tokens.set(token, user.id);
  res.json({ token, user: publicUser(user) });
});

app.get("/api/auth/me", requireAuth, (_req, res) => {
  res.json({ user: publicUser(res.locals.user) });
});

app.get("/api/places/trending", (_req, res) => res.json({ places }));

app.get("/api/settings", requireAuth, (_req, res) => {
  res.json({ settings: { theme: "light", language: "th", aiModel: "AUTO" } });
});

app.patch("/api/settings", requireAuth, (req, res) => {
  res.json({ settings: { theme: "light", language: "th", aiModel: "AUTO", ...req.body } });
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

app.post("/api/conversations", requireAuth, (req, res) => {
  const user = res.locals.user as User;
  const now = new Date().toISOString();
  const conversation: Conversation = {
    id: randomUUID(),
    title: req.body?.title ?? "บทสนทนาใหม่",
    pinned: false,
    userId: user.id,
    createdAt: now,
    updatedAt: now
  };
  conversations.set(conversation.id, conversation);
  messages.set(conversation.id, []);
  res.status(201).json({ conversation });
});

app.patch("/api/conversations/:id", requireAuth, (req, res) => {
  const current = conversations.get(req.params.id);
  if (!current) {
    res.status(404).json({ message: "Conversation not found" });
    return;
  }
  const updated = { ...current, ...req.body, updatedAt: new Date().toISOString() };
  conversations.set(updated.id, updated);
  res.json({ conversation: updated });
});

app.delete("/api/conversations/:id", requireAuth, (req, res) => {
  conversations.delete(req.params.id);
  messages.delete(req.params.id);
  res.status(204).send();
});

app.get("/api/conversations/:id/messages", requireAuth, (req, res) => {
  res.json({ messages: messages.get(req.params.id) ?? [] });
});

app.post("/api/chat/stream", requireAuth, async (req, res) => {
  const user = res.locals.user as User;
  const now = new Date().toISOString();
  const conversationId = req.body?.conversationId ?? randomUUID();
  let conversation = conversations.get(conversationId);
  if (!conversation) {
    conversation = {
      id: conversationId,
      title: String(req.body?.message ?? "บทสนทนาใหม่").slice(0, 56),
      pinned: false,
      userId: user.id,
      createdAt: now,
      updatedAt: now
    };
    conversations.set(conversation.id, conversation);
    messages.set(conversation.id, []);
  }

  const userMessage: Message = {
    id: randomUUID(),
    role: "USER",
    content: String(req.body?.message ?? ""),
    conversationId,
    userId: user.id,
    createdAt: now
  };
  const answer = makeAnswer(userMessage.content);
  const assistantMessage: Message = {
    id: randomUUID(),
    role: "ASSISTANT",
    content: answer,
    conversationId,
    userId: user.id,
    createdAt: new Date().toISOString()
  };
  messages.set(conversationId, [...(messages.get(conversationId) ?? []), userMessage, assistantMessage]);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive"
  });
  res.write(`event: meta\ndata: ${JSON.stringify({ conversation })}\n\n`);
  for (const chunk of answer.match(/.{1,36}(\s|$)/g) ?? [answer]) {
    res.write(`event: token\ndata: ${JSON.stringify({ token: chunk })}\n\n`);
    await new Promise((resolve) => setTimeout(resolve, 24));
  }
  res.write(`event: done\ndata: ${JSON.stringify({ message: assistantMessage })}\n\n`);
  res.end();
});

app.post("/api/chat", requireAuth, (req, res) => {
  const answer = makeAnswer(String(req.body?.message ?? ""));
  res.json({
    conversation: { id: req.body?.conversationId ?? randomUUID(), title: "Demo chat", pinned: false },
    message: { id: randomUUID(), role: "ASSISTANT", content: answer, createdAt: new Date().toISOString() }
  });
});

app.get("/api/favorites", requireAuth, (_req, res) => res.json({ favorites: [] }));
app.post("/api/favorites/:placeId", requireAuth, (req, res) => {
  res.status(201).json({ favorite: { place: places.find((place) => place.id === req.params.placeId) } });
});
app.delete("/api/favorites/:placeId", requireAuth, (_req, res) => res.status(204).send());
app.get("/api/saved-places", requireAuth, (_req, res) => res.json({ savedPlaces: [] }));
app.post("/api/saved-places/:placeId", requireAuth, (req, res) => {
  res.status(201).json({ savedPlace: { place: places.find((place) => place.id === req.params.placeId), note: req.body?.note } });
});
app.delete("/api/saved-places/:placeId", requireAuth, (_req, res) => res.status(204).send());

app.listen(port, "127.0.0.1", () => {
  console.log(`Demo API ready on http://127.0.0.1:${port}`);
});
