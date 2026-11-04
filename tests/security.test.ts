import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_JSON_BYTES, readJsonBody, sanitizeIdentityHeaders } from "../lib/request-security.ts";

test("untrusted requests cannot supply identity, even with mixed-case headers", async () => {
  const request = new Request("https://example.test/api/v1/profile", {
    method: "PUT",
    headers: {
      "OAI-Authenticated-User-Id": "another-user",
      "oai-authenticated-user-email": "sample@example.test",
      "oai-authenticated-user-full-name": "Forged name",
      "oai-authenticated-user-new-field": "untrusted",
      "content-type": "application/json",
    },
    body: '{"displayName":"Example"}',
  });
  const sanitized = sanitizeIdentityHeaders(request);
  assert.ok([...sanitized.headers.keys()].every(name => !name.startsWith("oai-authenticated-user-")));
  assert.equal(sanitized.headers.get("content-type"), "application/json");
  assert.equal(await sanitized.text(), '{"displayName":"Example"}');
});

test("only explicitly trusted requests retain gateway identity", () => {
  const request = new Request("https://example.test", { headers: { "oai-authenticated-user-id": "trusted" } });
  assert.equal(sanitizeIdentityHeaders(request, true).headers.get("oai-authenticated-user-id"), "trusted");
  assert.equal(sanitizeIdentityHeaders(request, false).headers.get("oai-authenticated-user-id"), null);
});

test("JSON parser accepts objects and rejects malformed JSON and non-objects", async () => {
  const request = (body: string) => new Request("https://example.test", { method: "POST", body });
  assert.deepEqual(await readJsonBody(request('{"name":"Example"}')), { name: "Example" });
  for (const body of ["", "{", "[]", "null", '"string"', "1"]) {
    await assert.rejects(readJsonBody(request(body)), { status: 400 });
  }
});

test("JSON body limits count bytes, including chunked multibyte requests", async () => {
  let canceled = false;
  const chunk = new TextEncoder().encode("é".repeat(10_000));
  const stream = new ReadableStream({
    pull(controller) { controller.enqueue(chunk); },
    cancel() { canceled = true; },
  });
  const request = new Request("https://example.test", {
    method: "POST", body: stream, duplex: "half",
  } as RequestInit);
  await assert.rejects(readJsonBody(request), { status: 413 });
  assert.equal(canceled, true);
  const tooLarge = new Request("https://example.test", {
    method: "POST", headers: { "content-length": String(MAX_JSON_BYTES + 1) }, body: "{}",
  });
  await assert.rejects(readJsonBody(tooLarge), { status: 413 });
  const atLimit = '{"x":"' + "a".repeat(MAX_JSON_BYTES - 8) + '"}';
  assert.equal(new TextEncoder().encode(atLimit).byteLength, MAX_JSON_BYTES);
  await readJsonBody(new Request("https://example.test", { method: "POST", body: atLimit }));
});
