import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import type { Server } from "node:http";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  void test("PostgreSQL API integration suite requires TEST_DATABASE_URL", { skip: "Set TEST_DATABASE_URL to a disposable migrated database" }, () => {});
} else {
  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "integration-test-secret-with-at-least-32-characters";
  process.env.CLIENT_ORIGIN = "http://127.0.0.1:5173";
  process.env.GEMINI_API_KEY = "integration-test-gemini-key";
  process.env.OPENAI_API_KEY = "";

  const { app } = await import("../app.js");
  const { prisma } = await import("../lib/prisma.js");
  const encoder = new TextEncoder();
  const runId = randomUUID().replace(/-/g, "");
  const testEmails = ["codex_a_" + runId + "@example.test", "codex_b_" + runId + "@example.test"];
  let server: Server | undefined;
  let apiUrl = "";
  let userAToken = "";
  let userBToken = "";
  let originalFetch: typeof fetch = globalThis.fetch;

  function geminiSseResponse() {
    const frames = ["สวัสดี", "ครับ"].map(
      (text) => "data: " + JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }) + "\n\n"
    );
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const frame of frames) controller.enqueue(encoder.encode(frame));
        controller.close();
      }
    });
    return new Response(body, { headers: { "Content-Type": "text/event-stream" } });
  }

  function readUrl(input: Parameters<typeof fetch>[0]) {
    return input instanceof Request ? input.url : String(input);
  }

  async function apiRequest(path: string, token?: string, payload?: unknown) {
    return originalFetch(apiUrl + path, {
      method: payload === undefined ? "GET" : "POST",
      headers: {
        ...(payload === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: "Bearer " + token } : {})
      },
      ...(payload === undefined ? {} : { body: JSON.stringify(payload) })
    });
  }

  async function register(email: string, username: string) {
    const response = await apiRequest("/api/auth/register", undefined, {
      username,
      email,
      password: "Password123",
      confirmPassword: "Password123"
    });
    assert.equal(response.status, 201);
    return (await response.json()) as { token: string; user: { id: string } };
  }

  before(async () => {
    server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve, reject) => {
      server!.once("listening", resolve);
      server!.once("error", reject);
    });
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    apiUrl = "http://127.0.0.1:" + address.port;

    originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      const url = readUrl(input);
      if (url.includes("generativelanguage.googleapis.com")) {
        if (url.includes(":streamGenerateContent")) return geminiSseResponse();
        return new Response(
          JSON.stringify({ candidates: [{ content: { parts: [{ text: "คำตอบทดสอบ" }] } }] }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
      return originalFetch(input, init);
    };

    const userA = await register(testEmails[0]!, "codex_a_" + runId.slice(0, 12));
    const userB = await register(testEmails[1]!, "codex_b_" + runId.slice(0, 12));
    userAToken = userA.token;
    userBToken = userB.token;
  });

  after(async () => {
    if (originalFetch) globalThis.fetch = originalFetch;
    try {
      if (testEmails.length > 0) {
        try {
          await prisma.user.deleteMany({ where: { email: { in: testEmails } } });
        } catch {
          // Preserve the test failure if the database was unavailable during setup.
        }
      }
    } finally {
      if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
      await prisma.$disconnect();
    }
  });

  void test("health checks the database readiness", async () => {
    const response = await apiRequest("/health");
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok", database: "ok" });
  });

  void test("protected API routes reject anonymous requests", async () => {
    const response = await apiRequest("/api/conversations");
    assert.equal(response.status, 401);
  });

  void test("a user cannot read, update, or delete another user's conversation", async () => {
    const created = await apiRequest("/api/conversations", userAToken, { title: "Private " + runId });
    assert.equal(created.status, 201);
    const { conversation } = (await created.json()) as { conversation: { id: string } };

    const messages = await apiRequest("/api/conversations/" + conversation.id + "/messages", userBToken);
    assert.equal(messages.status, 404);

    const update = await originalFetch(apiUrl + "/api/conversations/" + conversation.id, {
      method: "PATCH",
      headers: { Authorization: "Bearer " + userBToken, "Content-Type": "application/json" },
      body: JSON.stringify({ title: "stolen" })
    });
    assert.equal(update.status, 404);

    const deletion = await originalFetch(apiUrl + "/api/conversations/" + conversation.id, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + userBToken }
    });
    assert.equal(deletion.status, 404);

    const stillOwned = await apiRequest("/api/conversations/" + conversation.id + "/messages", userAToken);
    assert.equal(stillOwned.status, 200);
  });

  void test("regeneration replaces the answer without duplicating the user message", async () => {
    const created = await apiRequest("/api/conversations", userAToken, { title: "Retry " + runId });
    const { conversation } = (await created.json()) as { conversation: { id: string } };
    const payload = { conversationId: conversation.id, message: "Question " + runId };

    const first = await apiRequest("/api/chat", userAToken, payload);
    assert.equal(first.status, 200);
    const retry = await apiRequest("/api/chat", userAToken, { ...payload, regenerate: true });
    assert.equal(retry.status, 200);

    const messages = await prisma.message.findMany({ where: { conversationId: conversation.id } });
    assert.equal(messages.filter((message) => message.role === "USER").length, 1);
    assert.equal(messages.filter((message) => message.role === "ASSISTANT").length, 1);
  });

  void test("chat stream forwards provider tokens before the completion event", async () => {
    const response = await apiRequest("/api/chat/stream", userAToken, { message: "Stream " + runId });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /text\/event-stream/);
    const body = await response.text();
    assert.ok(body.indexOf("event: meta") < body.indexOf("event: token"));
    assert.ok(body.indexOf("event: token") < body.indexOf("event: done"));
    assert.match(body, /สวัสดีครับ/);
  });

  void test("seeded place records include official source and verification metadata", async () => {
    const response = await apiRequest("/api/places/trending");
    assert.equal(response.status, 200);
    const { places } = (await response.json()) as { places: Array<{ sourceUrl: string | null; verifiedAt: string | null }> };
    assert.ok(places.length > 0);
    assert.ok(places.some((place) => place.sourceUrl && place.verifiedAt));
  });
}
