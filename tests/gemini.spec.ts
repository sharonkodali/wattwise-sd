import { beforeEach, describe, expect, it, vi } from "vitest";

const generateContentMock = vi.fn();

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: { generateContent: generateContentMock },
  })),
}));

describe("gemini client fallback", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    generateContentMock.mockReset();
  });

  it("retries 503s and falls back to the next model", async () => {
    generateContentMock
      .mockRejectedValueOnce(new Error("503 overloaded"))
      .mockRejectedValueOnce(new Error("503 overloaded"))
      .mockResolvedValueOnce({ text: JSON.stringify({ ok: true }) });

    const { generateJson } = await import("../lib/gemini");
    const result = await generateJson({
      system: "test",
      parts: [{ text: "hi" }],
      schema: { type: "object" },
    });

    expect(result).toEqual({ ok: true });
    expect(generateContentMock).toHaveBeenCalledTimes(3);
    expect(generateContentMock.mock.calls.map(([call]) => call.model)).toEqual([
      "gemini-3.5-flash",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
    ]);
  });
});
