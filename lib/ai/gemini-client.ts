// =========================================================================
// CLOSEDBOOK PRODUCTION OS — GEMINI BYOK CLIENT (ADR-011)
// Zero-Server-Retention: Client-to-Google direct BYOK streaming fetch
// =========================================================================

export class GeminiError extends Error {
  constructor(
    message: string,
    public code: "INVALID_KEY" | "RATE_LIMIT" | "SERVER_ERROR" | "SAFETY_BLOCKED" | "NETWORK_ERROR" | "UNKNOWN",
    public status?: number,
    public retryAfter?: number
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

export interface GeminiMessagePart {
  text?: string;
  inline_data?: {
    mime_type: string;
    data: string; // Base64
  };
}

export interface GeminiContentMessage {
  role: "user" | "model";
  parts: GeminiMessagePart[];
}

export interface GeminiStreamOptions {
  apiKey: string;
  model?: string; // defaults to 'gemini-2.0-flash'
  messages: GeminiContentMessage[];
  systemInstruction?: string;
  temperature?: number;
  abortSignal?: AbortSignal;
  onChunk?: (chunkText: string) => void;
}

export const DEFAULT_GEMINI_MODEL = "gemini-2.0-flash";

/**
 * Direct BYOK streaming client for Google Generative AI (Gemini 2.0 Flash)
 * Uses native Server-Sent Events (SSE) stream over HTTP fetch.
 */
export async function* streamGeminiContent(
  options: GeminiStreamOptions
): AsyncGenerator<string, void, unknown> {
  const {
    apiKey,
    model = DEFAULT_GEMINI_MODEL,
    messages,
    systemInstruction,
    temperature = 0.7,
    abortSignal,
    onChunk,
  } = options;

  if (!apiKey || apiKey.trim().length === 0) {
    throw new GeminiError("API Key Gemini belum diset. Silakan masukkan di Pengaturan.", "INVALID_KEY", 401);
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:streamGenerateContent?key=${encodeURIComponent(apiKey)}&alt=sse`;

  const requestBody: Record<string, any> = {
    contents: messages,
    generationConfig: {
      temperature,
    },
  };

  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: abortSignal,
    });
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw err;
    }
    throw new GeminiError(
      `Gagal terhubung ke Gemini API: ${err.message || "Network offline"}`,
      "NETWORK_ERROR"
    );
  }

  if (!response.ok) {
    let errorDetail = "";
    try {
      const errJson = await response.json();
      errorDetail = errJson?.error?.message || response.statusText;
    } catch {
      errorDetail = await response.text().catch(() => response.statusText);
    }

    if (response.status === 400 && errorDetail.toLowerCase().includes("key")) {
      throw new GeminiError(`API key Gemini tidak valid: ${errorDetail}`, "INVALID_KEY", 401);
    }

    if (response.status === 401 || response.status === 403) {
      throw new GeminiError(`Akses ditolak (API Key tidak sah): ${errorDetail}`, "INVALID_KEY", response.status);
    }

    if (response.status === 429) {
      const retryHeader = response.headers.get("Retry-After");
      const retrySeconds = retryHeader ? parseInt(retryHeader, 10) : 30;
      throw new GeminiError(
        `Batas kuota Gemini tercapai (Rate Limit). Coba lagi dalam ${retrySeconds} detik.`,
        "RATE_LIMIT",
        429,
        retrySeconds
      );
    }

    if (response.status >= 500) {
      throw new GeminiError(
        `Layanan Google Gemini sedang mengalami gangguan (${response.status}): ${errorDetail}`,
        "SERVER_ERROR",
        response.status
      );
    }

    throw new GeminiError(`Error dari Gemini (${response.status}): ${errorDetail}`, "UNKNOWN", response.status);
  }

  if (!response.body) {
    throw new GeminiError("Respons Gemini tidak memiliki stream data body", "UNKNOWN");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;

        const dataStr = trimmed.slice(5).trim();
        if (dataStr === "[DONE]") return;

        try {
          const parsed = JSON.parse(dataStr);

          // Check for prompt or content safety blocks
          const candidate = parsed?.candidates?.[0];
          if (candidate?.finishReason === "SAFETY") {
            throw new GeminiError(
              "Respons dihentikan oleh filter keamanan konten Google Gemini.",
              "SAFETY_BLOCKED"
            );
          }

          const textChunk = candidate?.content?.parts?.[0]?.text;
          if (textChunk) {
            if (onChunk) onChunk(textChunk);
            yield textChunk;
          }
        } catch (jsonErr: any) {
          if (jsonErr instanceof GeminiError) throw jsonErr;
          // Ignore partial or unparseable SSE metadata lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Lightweight connection test for a user-provided Gemini API key
 */
export async function testGeminiApiKey(
  apiKey: string
): Promise<{ success: boolean; message: string }> {
  try {
    const generator = streamGeminiContent({
      apiKey,
      messages: [{ role: "user", parts: [{ text: "ping" }] }],
    });

    const first = await generator.next();
    if (!first.done || first.value) {
      return { success: true, message: "Koneksi ke Gemini 2.0 Flash berhasil!" };
    }
    return { success: true, message: "Koneksi terverifikasi." };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Gagal menguji API key",
    };
  }
}
