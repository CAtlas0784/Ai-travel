import { env } from "../config/env.js";

const SYSTEM_PROMPT = `You are an expert travel guide specializing in Uthai Thani Province.
You know attractions, cafes, restaurants, hotels, temples, nature, local food, local culture, travel routes, opening hours, and entrance fees.
Always answer in Thai unless the user requests another language.
If the requested information is unknown, do not hallucinate. Say clearly that the information is unavailable.`;

type AiMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

async function askGemini(messages: AiMessage[]) {
  if (!env.GEMINI_API_KEY) throw new Error("Gemini API key is not configured");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: messages
          .filter((message) => message.role !== "system")
          .map((message) => ({
            role: message.role === "assistant" ? "model" : "user",
            parts: [{ text: message.content }]
          })),
        generationConfig: { temperature: 0.7, topP: 0.9 }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini failed with ${response.status}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text).join("")?.trim();
  if (!text) throw new Error("Gemini returned an empty answer");
  return text;
}

async function askOpenAi(messages: AiMessage[]) {
  if (!env.OPENAI_API_KEY) throw new Error("OpenAI API key is not configured");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "GPT-5 nano",
      temperature: 0.7,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI failed with ${response.status}`);
  }

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("OpenAI returned an empty answer");
  return text;
}

export async function answerTravelQuestion(messages: AiMessage[], preference: "AUTO" | "GEMINI" | "OPENAI" = "AUTO") {
  const orderedProviders = preference === "OPENAI" ? [askOpenAi, askGemini] : [askGemini, askOpenAi];

  let lastError: unknown;
  for (const provider of orderedProviders) {
    try {
      return await provider(messages);
    } catch (error) {
      lastError = error;
    }
  }

  console.error("All AI providers failed", lastError);
  return "ขออภัย ตอนนี้ระบบ AI ไม่สามารถตอบคำถามได้ กรุณาลองใหม่อีกครั้งในภายหลัง";
}

export function toStreamChunks(text: string) {
  return text.match(/.{1,36}(\s|$)/g) ?? [text];
}
