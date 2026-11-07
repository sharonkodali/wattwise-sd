import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/gemini", async () => {
  const actual = await vi.importActual<typeof import("../lib/gemini")>("@/lib/gemini");
  return {
    ...actual,
    generateJson: vi.fn(),
    friendlyError: actual.friendlyError,
  };
});

import { POST } from "../app/api/analyze-bill/route";
import { generateJson } from "@/lib/gemini";

const mockGenerateJson = vi.mocked(generateJson);

describe("analyze-bill route", () => {
  beforeEach(() => {
    mockGenerateJson.mockReset();
  });

  it("returns a 400 when no file is uploaded", async () => {
    const res = await POST(new Request("http://localhost/api/analyze-bill", { method: "POST", body: new FormData() }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("No file uploaded");
  });

  it("returns a 400 for the wrong file type", async () => {
    const form = new FormData();
    form.append("file", new File(["hello"], "bill.txt", { type: "text/plain" }));

    const res = await POST(new Request("http://localhost/api/analyze-bill", { method: "POST", body: form }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Please upload a PDF");
  });

  it("returns a 413 for files that are too large", async () => {
    const form = new FormData();
    const large = new File([new Uint8Array(5 * 1024 * 1024)], "big-bill.png", { type: "image/png" });
    form.append("file", large);

    const res = await POST(new Request("http://localhost/api/analyze-bill", { method: "POST", body: form }));
    expect(res.status).toBe(413);
    const json = await res.json();
    expect(json.error).toContain("too large");
  });

  it("returns a 422 when the file is not a utility bill", async () => {
    const form = new FormData();
    form.append("file", new File(["bill"], "receipt.png", { type: "image/png" }));
    mockGenerateJson.mockResolvedValue({
      isUtilityBill: false,
      billingPeriod: "",
      ratePlan: "",
      provider: "SDG&E",
      totalDue: 0,
      kwhByPeriod: { onPeak: 0, offPeak: 0, superOffPeak: 0 },
      lineItems: [],
      summary: "",
      topSavingTip: "",
    });

    const res = await POST(new Request("http://localhost/api/analyze-bill", { method: "POST", body: form }));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toContain("utility bill");
  });
});
