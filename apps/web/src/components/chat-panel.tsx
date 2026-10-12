import { FormEvent, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Copy, Paperclip, RefreshCcw, Send, Square } from "lucide-react";
import { Button } from "./ui/button";
import { MarkdownMessage } from "./markdown-message";
import type { Message } from "../types";
import { formatTime } from "../lib/utils";

type ChatPanelProps = {
  messages: Message[];
  streaming: boolean;
  onSend: (message: string) => void;
  onStop: () => void;
  onRegenerate: () => void;
};

export function ChatPanel({ messages, streaming, onSend, onStop, onRegenerate }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || streaming) return;
    onSend(trimmed);
    setInput("");
  }

  return (
    <main className="glass flex h-full min-h-0 flex-col overflow-hidden rounded-2xl shadow-soft">
      <header className="shrink-0 border-b border-slate-200/70 px-5 py-4 dark:border-white/10">
        <p className="text-xs font-bold uppercase text-primary">AI Travel Guide</p>
        <h2 className="text-xl font-extrabold text-ink dark:text-white">เที่ยวอุทัยธานีแบบรู้จริง</h2>
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
        {messages.length === 0 && (
          <div className="grid h-full place-items-center text-center">
            <div className="max-w-lg">
              <h3 className="text-3xl font-extrabold text-ink dark:text-white">วันนี้อยากเที่ยวแบบไหน?</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                ลองถามเรื่องเส้นทาง 1 วัน คาเฟ่ใกล้วัดท่าซุง จุดชมวิวช่วงเย็น หรือร้านอาหารท้องถิ่นในอุทัยธานี
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.role === "USER" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[86%] rounded-2xl px-4 py-3 ${message.role === "USER" ? "bg-primary text-white" : "bg-white/75 dark:bg-white/7"}`}>
              {message.role === "ASSISTANT" ? <MarkdownMessage content={message.content} /> : <p className="text-sm leading-7">{message.content}</p>}
              {message.imageUrl && <img src={message.imageUrl} alt="" className="mt-3 max-h-72 rounded-xl object-cover" />}
              <div className="mt-2 flex items-center justify-between gap-4 text-[11px] opacity-70">
                <span>{formatTime(message.createdAt)}</span>
                <button type="button" onClick={() => navigator.clipboard.writeText(message.content)} className="inline-flex items-center gap-1">
                  <Copy size={12} />
                  Copy
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="shrink-0 border-t border-slate-200/70 p-4 dark:border-white/10">
        <div className="rounded-2xl border border-slate-200 bg-white/85 p-3 shadow-sm dark:border-white/10 dark:bg-white/5">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) submit(event);
            }}
            placeholder="ถามเรื่องสถานที่ท่องเที่ยว คาเฟ่ โรงแรม หรือจัดแผนเที่ยว..."
            rows={3}
            className="max-h-44 min-h-20 w-full resize-none bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <div className="flex items-center justify-between">
            <Button type="button" size="icon" variant="ghost" aria-label="Attachment future feature">
              <Paperclip size={18} />
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={onRegenerate} disabled={streaming || messages.length === 0}>
                <RefreshCcw size={16} />
                Regenerate
              </Button>
              {streaming ? (
                <Button type="button" variant="danger" onClick={onStop}>
                  <Square size={15} />
                  Stop
                </Button>
              ) : (
                <Button type="submit" disabled={!input.trim()}>
                  <Send size={16} />
                  Send
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}
