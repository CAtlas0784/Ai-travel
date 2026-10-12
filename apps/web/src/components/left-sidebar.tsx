import { motion } from "framer-motion";
import { Edit3, Flame, Mail, Pin, Search, Star } from "lucide-react";
import type { Conversation, Place, User } from "../types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { formatTime } from "../lib/utils";

type LeftSidebarProps = {
  user: User;
  places: Place[];
  conversations: Conversation[];
  activeConversationId?: string;
  search: string;
  onSearch: (value: string) => void;
  onPlaceClick: (place: Place) => void;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onTogglePin: (conversation: Conversation) => void;
  onRenameConversation: (conversation: Conversation) => void;
  onDeleteConversation: (id: string) => void;
};

export function LeftSidebar({
  user,
  places,
  conversations,
  activeConversationId,
  search,
  onSearch,
  onPlaceClick,
  onSelectConversation,
  onNewChat,
  onTogglePin,
  onRenameConversation,
  onDeleteConversation
}: LeftSidebarProps) {
  return (
    <aside className="glass flex h-full min-h-0 flex-col overflow-hidden rounded-2xl p-4 shadow-soft lg:rounded-l-none">
      <div className="flex shrink-0 items-center gap-3 rounded-xl bg-white/70 p-3 dark:bg-white/5">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-sm font-bold text-white">
          {user.username.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink dark:text-white">{user.username}</p>
          <p className="flex items-center gap-1 truncate text-xs text-slate-500">
            <Mail size={12} />
            {user.email}
          </p>
        </div>
      </div>

      <Button className="mt-4 w-full shrink-0" onClick={onNewChat}>บทสนทนาใหม่</Button>

      <div className="mt-4 min-h-0 shrink-[2] space-y-2 overflow-y-auto pr-1">
        <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
          <Flame size={15} className="text-gold" />
          Trending Tourist Attractions
        </div>
        <div className="grid gap-2">
          {places.map((place) => (
            <motion.button
              whileHover={{ y: -2 }}
              key={place.id}
              onClick={() => onPlaceClick(place)}
              className="overflow-hidden rounded-xl border border-white/70 bg-white/75 text-left shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-white/5"
            >
              <img src={place.imageUrl} alt={place.name} className="h-24 w-full object-cover" />
              <div className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold">{place.name}</p>
                  <span className="flex items-center gap-1 text-xs text-gold"><Star size={13} fill="currentColor" />{place.rating}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{place.description}</p>
                <p className="mt-2 text-xs font-semibold text-primary">{place.openHours}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex min-h-[220px] flex-1 flex-col overflow-hidden">
        <div className="relative shrink-0">
          <Search size={15} className="absolute left-3 top-3 text-slate-400" />
          <Input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search chat" className="pl-9" />
        </div>
        <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`group rounded-xl border p-3 transition ${
                activeConversationId === conversation.id
                  ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/50"
                  : "border-white/60 bg-white/55 hover:bg-white/80 dark:border-white/10 dark:bg-white/5"
              }`}
            >
              <button className="w-full text-left" onClick={() => onSelectConversation(conversation.id)}>
                <p className="line-clamp-1 text-sm font-semibold">{conversation.title}</p>
                <p className="mt-1 text-xs text-slate-500">{formatTime(conversation.updatedAt)}</p>
              </button>
              <div className="mt-2 flex items-center gap-1 opacity-100 md:opacity-0 md:transition md:group-hover:opacity-100">
                <Button variant="ghost" size="sm" onClick={() => onTogglePin(conversation)}>
                  <Pin size={13} />
                  {conversation.pinned ? "Unpin" : "Pin"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onRenameConversation(conversation)}>
                  <Edit3 size={13} />
                  Rename
                </Button>
                <Button variant="danger" size="sm" onClick={() => onDeleteConversation(conversation.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
