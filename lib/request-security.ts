export const MAX_JSON_BYTES = 50_000;

export class RequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Only a trusted authentication gateway may supply these identity headers. */
export function sanitizeIdentityHeaders(request: Request, trusted = false): Request {
  if (trusted) return request;
  const headers = new Headers(request.headers);
  for (const name of [...headers.keys()]) {
    if (name.startsWith("oai-authenticated-user-")) headers.delete(name);
  }
  return new Request(request, { headers });
}

/** Bound bytes while reading, including requests without Content-Length. */
export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  const length = request.headers.get("content-length");
  if (length && Number(length) > MAX_JSON_BYTES) {
    throw new RequestError("Request is too large.", 413);
  }
  const reader = request.body?.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0;
  let text = "";
  try {
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_JSON_BYTES) {
          await reader.cancel();
          throw new RequestError("Request is too large.", 413);
        }
        text += decoder.decode(value, { stream: true });
      }
    }
    text += decoder.decode();
    const body: unknown = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new RequestError("Invalid request.", 400);
    }
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError("Invalid JSON.", 400);
  } finally {
    reader?.releaseLock();
  }
}
