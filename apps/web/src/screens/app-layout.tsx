import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Menu, PanelRightOpen } from "lucide-react";
import { LeftSidebar } from "../components/left-sidebar";
import { RightSidebar } from "../components/right-sidebar";
import { ChatPanel } from "../components/chat-panel";
import { Button } from "../components/ui/button";
import { api, streamChat } from "../lib/api";
import { useAuth } from "../providers/auth-provider";
import type { Conversation, Message, Place, Settings } from "../types";

const DEMO_TOKEN = "demo-preview-token";
const demoPlaces: Place[] = [
  {
    id: "hup-pa-tat",
    name: "หุบป่าตาด",
    description: "ป่าดึกดำบรรพ์ในถ้ำหินปูน บรรยากาศลึกลับ เหมาะกับสายธรรมชาติและถ่ายภาพ",
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    rating: 4.8,
    openHours: "08:30 - 16:30",
    category: "ธรรมชาติ"
  },
  {
    id: "khao-sakae-krang",
    name: "เขาสะแกกรัง",
    description: "จุดชมวิวเมืองอุทัยธานี เหมาะกับช่วงเช้าและเย็น เห็นแม่น้ำและเมืองแบบกว้าง",
    imageUrl: "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?auto=format&fit=crop&w=1200&q=80",
    rating: 4.7,
    openHours: "เปิดตลอดวัน",
    category: "จุดชมวิว"
  },
  {
    id: "wat-tha-sung",
    name: "วัดท่าซุง",
    description: "วัดสำคัญของอุทัยธานี โดดเด่นด้วยวิหารแก้วและสถาปัตยกรรมที่งดงาม",
    imageUrl: "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1200&q=80",
    rating: 4.9,
    openHours: "09:00 - 16:00",
    category: "วัด"
  }
];

const demoSettings: Settings = { theme: "light", language: "th", aiModel: "AUTO" };

export function AppLayout() {
  const { user, token, logout } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [settings, setSettings] = useState<Settings>();
  const [search, setSearch] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId),
    [activeConversationId, conversations]
  );

  useEffect(() => {
    if (!token) return;
    if (token === DEMO_TOKEN) {
      setPlaces(demoPlaces);
      setSettings(demoSettings);
      document.documentElement.classList.remove("dark");
      return;
    }
    void refreshConversations();
    void api.trendingPlaces().then(({ places }) => setPlaces(places));
    void api.settings(token).then(({ settings }) => {
      setSettings(settings);
      document.documentElement.classList.toggle("dark", settings.theme === "dark");
    });
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const timeout = window.setTimeout(() => void refreshConversations(search), 180);
    return () => window.clearTimeout(timeout);
  }, [search, token]);

  async function refreshConversations(nextSearch = search) {
    if (!token) return;
    if (token === DEMO_TOKEN) return;
    const { conversations } = await api.conversations(token, nextSearch);
    setConversations(conversations);
  }

  async function selectConversation(id: string) {
    if (!token) return;
    if (token === DEMO_TOKEN) {
      setActiveConversationId(id);
      setLeftOpen(false);
      return;
    }
    setActiveConversationId(id);
    const { messages } = await api.messages(token, id);
    setMessages(messages);
    setLeftOpen(false);
  }

  async function newChat() {
    if (!token) return;
    if (token === DEMO_TOKEN) {
      const conversation: Conversation = {
        id: crypto.randomUUID(),
        title: "บทสนทนาใหม่",
        pinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setConversations((current) => [conversation, ...current]);
      setActiveConversationId(conversation.id);
      setMessages([]);
      setLeftOpen(false);
      return;
    }
    const { conversation } = await api.createConversation(token);
    setConversations((current) => [conversation, ...current]);
    setActiveConversationId(conversation.id);
    setMessages([]);
    setLeftOpen(false);
  }

  async function sendMessage(content: string) {
    if (!token || !user) return;
    const optimisticUserMessage: Message = {
      id: crypto.randomUUID(),
      role: "USER",
      content,
      createdAt: new Date().toISOString()
    };
    const streamingMessage: Message = {
      id: crypto.randomUUID(),
      role: "ASSISTANT",
      content: "",
      createdAt: new Date().toISOString()
    };
    setMessages((current) => [...current, optimisticUserMessage, streamingMessage]);
    setStreaming(true);
    if (token === DEMO_TOKEN) {
      window.setTimeout(() => {
        const answer =
          `ได้เลยครับ นี่คือโหมดพรีวิวหน้าเว็บแบบไม่ต่อ API\n\n` +
          `สำหรับคำถาม: **${content}**\n\n` +
          `ถ้าเป็นระบบจริง AI จะตอบเป็นภาษาไทยเกี่ยวกับสถานที่ท่องเที่ยว ร้านอาหาร คาเฟ่ โรงแรม และเส้นทางในจังหวัดอุทัยธานี พร้อมข้อมูลเวลาเปิด ค่าเข้า และคำแนะนำการเดินทาง`;
        setMessages((current) =>
          current.map((message) => (message.id === streamingMessage.id ? { ...message, content: answer } : message))
        );
        setStreaming(false);
      }, 450);
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamChat(
        token,
        { conversationId: activeConversationId, message: content },
        {
          onMeta(conversation) {
            setActiveConversationId(conversation.id);
            setConversations((current) => [conversation, ...current.filter((item) => item.id !== conversation.id)]);
          },
          onToken(chunk) {
            setMessages((current) =>
              current.map((message) => (message.id === streamingMessage.id ? { ...message, content: message.content + chunk } : message))
            );
          },
          onDone(message) {
            setMessages((current) => current.map((item) => (item.id === streamingMessage.id ? message : item)));
            void refreshConversations();
          }
        },
        controller.signal
      );
    } catch (error) {
      if (!controller.signal.aborted) {
        setMessages((current) =>
          current.map((message) =>
            message.id === streamingMessage.id ? { ...message, content: "ขออภัย ส่งคำถามไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" } : message
          )
        );
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function stopGenerating() {
    abortRef.current?.abort();
    setStreaming(false);
  }

  function regenerate() {
    const lastUserMessage = [...messages].reverse().find((message) => message.role === "USER");
    if (lastUserMessage) void sendMessage(lastUserMessage.content);
  }

  async function updateSettings(payload: Partial<Settings>) {
    if (!token) return;
    if (token === DEMO_TOKEN) {
      const nextSettings = { ...(settings ?? demoSettings), ...payload };
      setSettings(nextSettings);
      document.documentElement.classList.toggle("dark", nextSettings.theme === "dark");
      return;
    }
    const { settings: updatedSettings } = await api.updateSettings(token, payload);
    setSettings(updatedSettings);
    document.documentElement.classList.toggle("dark", updatedSettings.theme === "dark");
  }

  async function togglePin(conversation: Conversation) {
    if (!token) return;
    if (token === DEMO_TOKEN) {
      setConversations((current) =>
        current.map((item) => (item.id === conversation.id ? { ...item, pinned: !item.pinned } : item))
      );
      return;
    }
    const { conversation: updated } = await api.updateConversation(token, conversation.id, { pinned: !conversation.pinned });
    setConversations((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }

  async function renameConversation(conversation: Conversation) {
    if (!token) return;
    const title = window.prompt("ตั้งชื่อบทสนทนา", conversation.title)?.trim();
    if (!title) return;
    if (token === DEMO_TOKEN) {
      setConversations((current) => current.map((item) => (item.id === conversation.id ? { ...item, title } : item)));
      return;
    }
    const { conversation: updated } = await api.updateConversation(token, conversation.id, { title });
    setConversations((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }

  async function deleteConversation(id: string) {
    if (!token) return;
    if (token === DEMO_TOKEN) {
      setConversations((current) => current.filter((item) => item.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(undefined);
        setMessages([]);
      }
      return;
    }
    await api.deleteConversation(token, id);
    setConversations((current) => current.filter((item) => item.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(undefined);
      setMessages([]);
    }
  }

  function askAboutPlace(place: Place) {
    void sendMessage(`ช่วยแนะนำสถานที่นี้หน่อย: ${place.name}`);
  }

  if (!user) return null;

  return (
    <div className="grid h-dvh max-h-dvh grid-cols-1 gap-3 overflow-hidden p-3 lg:grid-cols-[320px_minmax(0,1fr)_280px]">
      <div className={`${leftOpen ? "fixed inset-y-3 left-3 z-30 w-[min(320px,calc(100vw-24px))]" : "hidden"} min-h-0 lg:block`}>
        <LeftSidebar
          user={user}
          places={places}
          conversations={conversations}
          activeConversationId={activeConversation?.id}
          search={search}
          onSearch={setSearch}
          onPlaceClick={askAboutPlace}
          onSelectConversation={selectConversation}
          onNewChat={newChat}
          onTogglePin={togglePin}
          onRenameConversation={renameConversation}
          onDeleteConversation={deleteConversation}
        />
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative min-h-0 overflow-hidden">
        <div className="absolute left-4 top-4 z-10 flex gap-2 lg:hidden">
          <Button size="icon" variant="secondary" onClick={() => setLeftOpen(true)}><Menu size={17} /></Button>
          <Button size="icon" variant="secondary" onClick={() => setRightOpen(true)}><PanelRightOpen size={17} /></Button>
        </div>
        <ChatPanel messages={messages} streaming={streaming} onSend={sendMessage} onStop={stopGenerating} onRegenerate={regenerate} />
      </motion.div>

      <div className={`${rightOpen ? "fixed inset-y-3 right-3 z-30 w-[min(280px,calc(100vw-24px))]" : "hidden"} min-h-0 lg:block`}>
        <RightSidebar settings={settings} onSettingsChange={updateSettings} onLogout={logout} />
      </div>

      {(leftOpen || rightOpen) && (
        <button className="fixed inset-0 z-20 bg-black/20 lg:hidden" aria-label="Close sidebar" onClick={() => { setLeftOpen(false); setRightOpen(false); }} />
      )}
    </div>
  );
}
