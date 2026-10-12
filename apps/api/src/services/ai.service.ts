import { env } from "../config/env.js";

const SYSTEM_PROMPT = `You are an expert travel guide specializing in Uthai Thani Province.
Always answer in Thai unless the user requests another language.
Do not invent current travel information. If the verified records do not contain the requested detail, say that the information is unavailable and recommend confirming it with the official venue.`;

type AiMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type TokenHandler = (token: string) => void;

function systemMessage(travelContext?: string) {
  return [SYSTEM_PROMPT, travelContext].filter(Boolean).join("\n\n");
}

function requestSignal(signal?: AbortSignal) {
  const timeout = AbortSignal.timeout(45_000);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

async function* readSseData(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const takeEvent = () => {
    const boundary = buffer.search(/\r?\n\r?\n/);
    if (boundary < 0) return undefined;
    const event = buffer.slice(0, boundary);
    const separator = buffer.slice(boundary).match(/^\r?\n\r?\n/)?.[0] ?? "\n\n";
    buffer = buffer.slice(boundary + separator.length);
    const data = event
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).replace(/^ /, ""))
      .join("\n");
    return data || undefined;
  };

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      while (true) {
        const data = takeEvent();
        if (data === undefined) break;
        yield data;
      }
    }

    buffer += decoder.decode();
    const remaining = buffer
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).replace(/^ /, ""))
      .join("\n");
    if (remaining) yield remaining;
  } finally {
    reader.releaseLock();
  }
}

function getRequestMessages(messages: AiMessage[]) {
  return messages.filter((message) => message.role !== "system");
}

async function askGemini(messages: AiMessage[], signal?: AbortSignal, onToken?: TokenHandler, travelContext?: string) {
  if (!env.GEMINI_API_KEY) throw new Error("Gemini API key is not configured");

  const streaming = Boolean(onToken);
  const endpoint = streaming ? "streamGenerateContent?alt=sse" : "generateContent";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:${endpoint}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      signal: requestSignal(signal),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemMessage(travelContext) }] },
        contents: getRequestMessages(messages).map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }]
        })),
        generationConfig: { temperature: 0.7, topP: 0.9 }
      })
    }
  );

  if (!response.ok) throw new Error(`Gemini failed with ${response.status}`);

  if (streaming) {
    if (!response.body) throw new Error("Gemini returned an empty response stream");
    let text = "";
    for await (const data of readSseData(response.body)) {
      const chunk = JSON.parse(data) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const token = chunk.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
      if (token) {
        text += token;
        onToken?.(token);
      }
    }
    if (!text.trim()) throw new Error("Gemini returned an empty answer");
    return text.trim();
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text).join("")?.trim();
  if (!text) throw new Error("Gemini returned an empty answer");
  return text;
}

async function askOpenAi(messages: AiMessage[], signal?: AbortSignal, onToken?: TokenHandler, travelContext?: string) {
  if (!env.OPENAI_API_KEY) throw new Error("OpenAI API key is not configured");

  const streaming = Boolean(onToken);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    signal: requestSignal(signal),
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      reasoning_effort: "none",
      temperature: 0.7,
      stream: streaming,
      messages: [{ role: "developer", content: systemMessage(travelContext) }, ...getRequestMessages(messages)]
    })
  });

  if (!response.ok) throw new Error(`OpenAI failed with ${response.status}`);

  if (streaming) {
    if (!response.body) throw new Error("OpenAI returned an empty response stream");
    let text = "";
    for await (const data of readSseData(response.body)) {
      if (data === "[DONE]") break;
      const chunk = JSON.parse(data) as {
        choices?: Array<{ delta?: { content?: string | null } }>;
      };
      const token = chunk.choices?.[0]?.delta?.content ?? "";
      if (token) {
        text += token;
        onToken?.(token);
      }
    }
    if (!text.trim()) throw new Error("OpenAI returned an empty answer");
    return text.trim();
  }

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("OpenAI returned an empty answer");
  return text;
}

export async function answerTravelQuestion(
  messages: AiMessage[],
  preference: "AUTO" | "GEMINI" | "OPENAI" = "AUTO",
  signal?: AbortSignal,
  onToken?: TokenHandler,
  travelContext?: string
) {
  const providers =
    preference === "OPENAI"
      ? [askOpenAi, askGemini]
      : preference === "GEMINI"
        ? [askGemini, askOpenAi]
        : [askGemini, askOpenAi];

  let lastError: unknown;
  let emittedTokenCount = 0;
  for (const provider of providers) {
    try {
      return await provider(messages, signal, onToken
        ? (token) => {
            emittedTokenCount += 1;
            onToken(token);
          }
        : undefined, travelContext);
    } catch (error) {
      if (signal?.aborted || emittedTokenCount > 0) throw error;
      lastError = error;
    }
  }

  console.error("All AI providers failed", lastError);
  const fallback = "ขออภัย ตอนนี้ระบบ AI ไม่สามารถตอบคำถามได้ กรุณาลองใหม่อีกครั้งในภายหลัง";
  onToken?.(fallback);
  return fallback;
}
