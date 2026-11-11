import assert from "node:assert/strict";
import test from "node:test";

import { readJsonBody, authorizeAiRequest } from "../lib/server/security.ts";

function jsonRequest(body: string, headers: Record<string, string> = {}) {
  return new Request("https://titan.example/api/test", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body,
  });
}

test("readJsonBody accepts valid JSON within the byte limit", async () => {
  const result = await readJsonBody(jsonRequest('{"ok":true}'), 64);
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.body, { ok: true });
});

test("readJsonBody rejects non-JSON content types", async () => {
  const result = await readJsonBody(
    jsonRequest("{}", { "content-type": "text/plain" }),
    64,
  );
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.response.status, 415);
});

test("readJsonBody rejects malformed JSON", async () => {
  const result = await readJsonBody(jsonRequest("{"), 64);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.response.status, 400);
});

test("readJsonBody rejects invalid UTF-8", async () => {
  const request = new Request("https://titan.example/api/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: new Uint8Array([0xff, 0xfe, 0x7b, 0x7d]),
  });
  const result = await readJsonBody(request, 64);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.response.status, 400);
});

test("readJsonBody rejects oversized streamed bodies", async () => {
  const result = await readJsonBody(jsonRequest(JSON.stringify({ data: "x".repeat(128) })), 32);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.response.status, 413);
});

test("readJsonBody rejects invalid size configuration", async () => {
  const result = await readJsonBody(jsonRequest("{}"), 0);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.response.status, 500);
});

test("AI authorization fails closed when Firebase is not configured", async () => {
  const previousServer = process.env.FIREBASE_PROJECT_ID;
  const previousClient = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  delete process.env.FIREBASE_PROJECT_ID;
  delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  try {
    const request = new Request("https://titan.example/api/chat", {
      method: "POST",
      headers: { authorization: "Bearer invalid" },
    });
    const result = await authorizeAiRequest(request, "chat", {
      perMinute: 30,
      perDay: 200,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.response.status, 503);
  } finally {
    if (previousServer === undefined) delete process.env.FIREBASE_PROJECT_ID;
    else process.env.FIREBASE_PROJECT_ID = previousServer;
    if (previousClient === undefined) delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    else process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = previousClient;
  }
});
