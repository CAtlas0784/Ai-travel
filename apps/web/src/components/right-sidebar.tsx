import { LogOut, Moon, Settings, Shield, Sun, UserCircle } from "lucide-react";
import { Button } from "./ui/button";
import type { Settings as SettingsType } from "../types";

type RightSidebarProps = {
  settings?: SettingsType;
  onSettingsChange: (settings: Partial<SettingsType>) => void;
  onLogout: () => void;
};

export function RightSidebar({ settings, onSettingsChange, onLogout }: RightSidebarProps) {
  return (
    <aside className="glass flex h-full flex-col rounded-2xl p-4 shadow-soft lg:rounded-r-none">
      <div className="flex items-center gap-2 text-sm font-bold">
        <Settings size={18} className="text-primary" />
        Settings
      </div>

      <section className="mt-5 space-y-3">
        <p className="text-xs font-bold uppercase text-slate-500">Theme</p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant={settings?.theme === "light" ? "secondary" : "ghost"} onClick={() => onSettingsChange({ theme: "light" })}>
            <Sun size={16} /> Light
          </Button>
          <Button variant={settings?.theme === "dark" ? "secondary" : "ghost"} onClick={() => onSettingsChange({ theme: "dark" })}>
            <Moon size={16} /> Dark
          </Button>
        </div>
      </section>

      <section className="mt-6 space-y-3">
        <p className="text-xs font-bold uppercase text-slate-500">Language</p>
        <select
          className="h-11 w-full rounded-lg border border-slate-200 bg-white/80 px-3 text-sm dark:border-white/10 dark:bg-white/5"
          value={settings?.language ?? "th"}
          onChange={(event) => onSettingsChange({ language: event.target.value as SettingsType["language"] })}
        >
          <option value="th">ไทย</option>
          <option value="en">English</option>
        </select>
      </section>

      <section className="mt-6 space-y-3">
        <p className="text-xs font-bold uppercase text-slate-500">AI Model</p>
        <select
          className="h-11 w-full rounded-lg border border-slate-200 bg-white/80 px-3 text-sm dark:border-white/10 dark:bg-white/5"
          value={settings?.aiModel ?? "AUTO"}
          onChange={(event) => onSettingsChange({ aiModel: event.target.value as SettingsType["aiModel"] })}
        >
          <option value="AUTO">Auto</option>
          <option value="GEMINI">Gemini</option>
          <option value="OPENAI">ChatGPT</option>
        </select>
      </section>

      <section className="mt-6 space-y-2">
        <Button variant="ghost" className="w-full justify-start"><UserCircle size={16} /> Profile</Button>
        <Button variant="ghost" className="w-full justify-start"><Shield size={16} /> Privacy Policy</Button>
        <Button variant="ghost" className="w-full justify-start">Terms</Button>
      </section>

      <div className="mt-auto rounded-xl border border-slate-200 bg-white/60 p-3 text-xs leading-5 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
        <p className="font-bold text-ink dark:text-white">About Project</p>
        <p>Uthai Thani AI Travel Assistant</p>
        <p>Version 1.0.0</p>
      </div>
      <Button variant="danger" className="mt-3 w-full" onClick={onLogout}>
        <LogOut size={16} />
        Logout
      </Button>
    </aside>
  );
}
