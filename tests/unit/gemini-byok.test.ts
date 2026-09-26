import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  streamGeminiContent,
  testGeminiApiKey,
  GeminiError,
} from "@/lib/ai/gemini-client";
import {
  saveGeminiApiKey,
  getGeminiApiKey,
  removeGeminiApiKey,
  getGeminiKeyStatus,
  setGeminiKeyStatus,
} from "@/lib/ai/gemini-key-storage";

describe("Gemini BYOK Client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("throws INVALID_KEY if API key is empty", async () => {
    const generator = streamGeminiContent({
      apiKey: "",
      messages: [{ role: "user", parts: [{ text: "halo" }] }],
    });

    await expect(generator.next()).rejects.toThrow(GeminiError);
    try {
      const g = streamGeminiContent({ apiKey: "  ", messages: [] });
      await g.next();
    } catch (e: any) {
      expect(e.code).toBe("INVALID_KEY");
      expect(e.status).toBe(401);
    }
  });

  it("parses SSE data chunks correctly and calls onChunk", async () => {
    const mockSSE = [
      'data: {"candidates":[{"content":{"parts":[{"text":"Halo "}]}}]}\n\n',
      'data: {"candidates":[{"content":{"parts":[{"text":"Dunia!"}]}}]}\n\n',
      "data: [DONE]\n\n",
    ].join("");

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(mockSSE));
        controller.close();
      },
    });

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      body: stream,
    } as any);

    const receivedChunks: string[] = [];
    const chunks: string[] = [];

    for await (const chunk of streamGeminiContent({
      apiKey: "test-api-key",
      messages: [{ role: "user", parts: [{ text: "halo" }] }],
      onChunk: (c) => receivedChunks.push(c),
    })) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual(["Halo ", "Dunia!"]);
    expect(receivedChunks).toEqual(["Halo ", "Dunia!"]);
  });

  it("handles 401/403 Invalid API key error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({ error: { message: "API_KEY_INVALID" } }),
    } as any);

    const generator = streamGeminiContent({
      apiKey: "invalid-key",
      messages: [{ role: "user", parts: [{ text: "test" }] }],
    });

    try {
      await generator.next();
      expect.fail("Should have thrown");
    } catch (err: any) {
      expect(err).toBeInstanceOf(GeminiError);
      expect(err.code).toBe("INVALID_KEY");
      expect(err.status).toBe(401);
    }
  });

  it("handles 429 Rate Limit with Retry-After header", async () => {
    const headers = new Headers();
    headers.set("Retry-After", "45");

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      headers,
      json: async () => ({ error: { message: "Quota exceeded" } }),
    } as any);

    const generator = streamGeminiContent({
      apiKey: "valid-key",
      messages: [{ role: "user", parts: [{ text: "test" }] }],
    });

    try {
      await generator.next();
      expect.fail("Should have thrown");
    } catch (err: any) {
      expect(err).toBeInstanceOf(GeminiError);
      expect(err.code).toBe("RATE_LIMIT");
      expect(err.status).toBe(429);
      expect(err.retryAfter).toBe(45);
    }
  });

  it("handles 500 Server Error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      json: async () => ({ error: { message: "Internal server issue" } }),
    } as any);

    const generator = streamGeminiContent({
      apiKey: "valid-key",
      messages: [{ role: "user", parts: [{ text: "test" }] }],
    });

    try {
      await generator.next();
      expect.fail("Should have thrown");
    } catch (err: any) {
      expect(err).toBeInstanceOf(GeminiError);
      expect(err.code).toBe("SERVER_ERROR");
      expect(err.status).toBe(503);
    }
  });

  it("testGeminiApiKey returns success false on error", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "API key not valid" } }),
    } as any);

    const res = await testGeminiApiKey("bad-key");
    expect(res.success).toBe(false);
  });
});

class MockStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] || null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

describe("Gemini Key Storage", () => {
  const mockLocalStorage = new MockStorage();
  const mockSessionStorage = new MockStorage();

  beforeEach(async () => {
    (globalThis as any).window = globalThis;
    (globalThis as any).localStorage = mockLocalStorage;
    (globalThis as any).sessionStorage = mockSessionStorage;
    mockLocalStorage.clear();
    mockSessionStorage.clear();
    await removeGeminiApiKey();
  });

  it("encrypts, stores, and decrypts the API key roundtrip", async () => {
    const rawKey = "AIzaSyD-TEST-REALISTIC-GEMINI-KEY-123456";
    const saveResult = await saveGeminiApiKey(rawKey);

    expect(["encrypted", "session"]).toContain(saveResult.mode);

    const retrieved = await getGeminiApiKey();
    expect(retrieved).toBe(rawKey);

    expect(getGeminiKeyStatus()).toBe("active");
  });

  it("clears the key completely on removeGeminiApiKey", async () => {
    await saveGeminiApiKey("AIzaSyD-REMOVE-TEST");
    expect(await getGeminiApiKey()).toBe("AIzaSyD-REMOVE-TEST");

    await removeGeminiApiKey();
    expect(await getGeminiApiKey()).toBeNull();
    expect(getGeminiKeyStatus()).toBe("none");
  });

  it("updates and gets status correctly", () => {
    expect(getGeminiKeyStatus()).toBe("none");
    setGeminiKeyStatus("active");
    expect(getGeminiKeyStatus()).toBe("active");
    setGeminiKeyStatus("invalid");
    expect(getGeminiKeyStatus()).toBe("invalid");
    setGeminiKeyStatus("none");
    expect(getGeminiKeyStatus()).toBe("none");
  });
});
