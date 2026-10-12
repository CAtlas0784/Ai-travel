export type User = {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
};

export type Conversation = {
  id: string;
  title: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
};

export type Message = {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  imageUrl?: string | null;
  createdAt: string;
};

export type Place = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rating: number;
  openHours: string;
  category: string;
};

export type Settings = {
  theme: "system" | "light" | "dark";
  language: "th" | "en";
  aiModel: "AUTO" | "GEMINI" | "OPENAI";
};
