import type { Conversation, Message, Place, Settings, User } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type ApiOptions = RequestInit & {
  token?: string | null;
};

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message ?? "Request failed");
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  register: (payload: { username: string; email: string; password: string; confirmPassword: string }) =>
    request<{ token: string; user: User }>("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload: { email: string; password: string }) =>
    request<{ token: string; user: User }>("/api/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  me: (token: string) => request<{ user: User }>("/api/auth/me", { token }),
  conversations: (token: string, search = "") =>
    request<{ conversations: Conversation[] }>(`/api/conversations?search=${encodeURIComponent(search)}`, { token }),
  messages: (token: string, conversationId: string) =>
    request<{ messages: Message[] }>(`/api/conversations/${conversationId}/messages`, { token }),
  createConversation: (token: string, title = "บทสนทนาใหม่") =>
    request<{ conversation: Conversation }>("/api/conversations", { method: "POST", token, body: JSON.stringify({ title }) }),
  updateConversation: (token: string, id: string, payload: Partial<Pick<Conversation, "title" | "pinned">>) =>
    request<{ conversation: Conversation }>(`/api/conversations/${id}`, { method: "PATCH", token, body: JSON.stringify(payload) }),
  deleteConversation: (token: string, id: string) =>
    request<void>(`/api/conversations/${id}`, { method: "DELETE", token }),
  trendingPlaces: () => request<{ places: Place[] }>("/api/places/trending"),
  settings: (token: string) => request<{ settings: Settings }>("/api/settings", { token }),
  updateSettings: (token: string, payload: Partial<Settings>) =>
    request<{ settings: Settings }>("/api/settings", { method: "PATCH", token, body: JSON.stringify(payload) })
};

export async function streamChat(
  token: string,
  payload: { conversationId?: string; message: string; imageUrl?: string; regenerate?: boolean },
  handlers: {
    onMeta: (conversation: Conversation) => void;
    onToken: (token: string) => void;
    onDone: (message: Message) => void;
  },
  signal?: AbortSignal
) {
  const response = await fetch(`${API_URL}/api/chat/stream`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok || !response.body) throw new Error("Unable to start chat");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const handleEvent = (event: string) => {
    const eventType = event.match(/^event: (.+)$/m)?.[1];
    const data = event.match(/^data: (.+)$/m)?.[1];
    if (!eventType || !data) return;
    const parsed = JSON.parse(data);
    if (eventType === "meta") handlers.onMeta(parsed.conversation);
    if (eventType === "token") handlers.onToken(parsed.token);
    if (eventType === "done") handlers.onDone(parsed.message);
    if (eventType === "error") throw new Error(parsed.message ?? "AI response could not be completed");
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() ?? "";

    for (const event of events) handleEvent(event);
  }

  buffer += decoder.decode();
  if (buffer.trim()) handleEvent(buffer);
}
