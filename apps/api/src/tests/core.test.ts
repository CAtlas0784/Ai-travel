import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import type { VerifiedPlace } from "../services/travel-context.js";
import { buildTravelContext, selectRelevantPlaces } from "../services/travel-context.js";

process.env.DATABASE_URL = "postgresql://test:test@127.0.0.1:5432/test?schema=public";
process.env.JWT_SECRET = "unit-test-jwt-secret-that-is-at-least-32-characters";
process.env.GEMINI_API_KEY = "unit-test-gemini-key";
process.env.OPENAI_API_KEY = "unit-test-openai-key";

const { answerTravelQuestion } = await import("../services/ai.service.js");
const encoder = new TextEncoder();
const fetchCalls: Array<{ url: string; body: string }> = [];
let geminiResponse = () => new Response("Unexpected Gemini request", { status: 500 });
let openAiResponse = () => new Response("Unexpected OpenAI request", { status: 500 });
let originalFetch: typeof fetch = globalThis.fetch;

function sseResponse(frames: string[]) {
  const bytes = encoder.encode(frames.join(""));
  const midpoint = Math.max(1, Math.floor(bytes.length / 2));
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes.slice(0, midpoint));
      controller.enqueue(bytes.slice(midpoint));
      controller.close();
    }
  });
  return new Response(body, { headers: { "Content-Type": "text/event-stream" } });
}

function geminiFrame(text: string) {
  return `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] })}\r\n\r\n`;
}

function openAiFrame(text: string) {
  return `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`;
}

const places: VerifiedPlace[] = [
  {
    name: "วัดจันทาราม (วัดท่าซุง)",
    description: "มีวิหารแก้ว 100 เมตร",
    category: "วัด",
    address: "อำเภอเมืองอุทัยธานี",
    openHours: null,
    entranceFee: null,
    sourceUrl: "https://example.test/wat-tha-sung",
    verifiedAt: new Date("2026-10-12T00:00:00.000Z")
  },
  {
    name: "น้ำตกไซเบอร์",
    description: "อยู่ใกล้หมู่บ้านไซเบอร์",
    category: "น้ำตก",
    address: null,
    openHours: null,
    entranceFee: null,
    sourceUrl: null,
    verifiedAt: null
  }
];

beforeEach(() => {
  fetchCalls.length = 0;
  geminiResponse = () => new Response("Unexpected Gemini request", { status: 500 });
  openAiResponse = () => new Response("Unexpected OpenAI request", { status: 500 });
  originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    fetchCalls.push({ url, body: String(init?.body ?? "") });
    if (url.includes("generativelanguage.googleapis.com")) return geminiResponse();
    if (url.includes("api.openai.com")) return openAiResponse();
    return originalFetch(input, init);
  };
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

void test("travel context prefers a named place and keeps unverified fields unknown", () => {
  assert.deepEqual(selectRelevantPlaces("วัดท่าซุงเปิดกี่โมง", places), [places[0]]);

  const context = buildTravelContext("วัดท่าซุงเปิดกี่โมง", places);
  assert.match(context, /\"openHours\": null/);
  assert.match(context, /https:\/\/example\.test\/wat-tha-sung/);
  assert.match(context, /2026-10-12/);
  assert.match(context, /never guess missing hours/i);
});

void test("travel context returns a bounded list for broad trip questions", () => {
  assert.deepEqual(selectRelevantPlaces("ช่วยจัดทริปอุทัยธานี", places, 1), [places[0]]);
  assert.equal(selectRelevantPlaces("เที่ยว", places, 0).length, 0);
});

void test("Gemini SSE chunks are decoded across byte boundaries", async () => {
  geminiResponse = () => sseResponse([geminiFrame("สวัสดี"), geminiFrame("ครับ")]);
  const tokens: string[] = [];
  const answer = await answerTravelQuestion(
    [{ role: "user", content: "แนะนำทริป" }],
    "GEMINI",
    undefined,
    (token) => tokens.push(token),
    "Verified place data"
  );

  assert.equal(answer, "สวัสดีครับ");
  assert.deepEqual(tokens, ["สวัสดี", "ครับ"]);
  assert.match(fetchCalls[0]!.url, /streamGenerateContent\?alt=sse/);
  assert.match(fetchCalls[0]!.body, /Verified place data/);
});

void test("OpenAI is used as fallback when Gemini fails before sending tokens", async () => {
  geminiResponse = () => new Response("Unavailable", { status: 503 });
  openAiResponse = () => sseResponse([openAiFrame("OpenAI answer"), "data: [DONE]\n\n"]);
  const tokens: string[] = [];
  const answer = await answerTravelQuestion(
    [{ role: "user", content: "แนะนำทริป" }],
    "AUTO",
    undefined,
    (token) => tokens.push(token)
  );

  assert.equal(answer, "OpenAI answer");
  assert.deepEqual(tokens, ["OpenAI answer"]);
  assert.equal(fetchCalls.filter((call) => call.url.includes("generativelanguage.googleapis.com")).length, 1);
  assert.equal(fetchCalls.filter((call) => call.url.includes("api.openai.com")).length, 1);
});

void test("AI provider failures after the first token do not append a second provider answer", async () => {
  let sentFirstFrame = false;
  geminiResponse = () =>
    new Response(
      new ReadableStream<Uint8Array>({
        pull(controller) {
          if (sentFirstFrame) {
            controller.error(new Error("Gemini stream interrupted"));
            return;
          }
          sentFirstFrame = true;
          controller.enqueue(encoder.encode(geminiFrame("บางส่วน")));
        }
      }),
      { headers: { "Content-Type": "text/event-stream" } }
    );
  const tokens: string[] = [];

  await assert.rejects(
    answerTravelQuestion(
      [{ role: "user", content: "แนะนำทริป" }],
      "AUTO",
      undefined,
      (token) => tokens.push(token)
    ),
    /Gemini stream interrupted/
  );

  assert.deepEqual(tokens, ["บางส่วน"]);
  assert.equal(fetchCalls.some((call) => call.url.includes("api.openai.com")), false);
});
