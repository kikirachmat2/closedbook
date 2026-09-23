import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { GET, POST } from "@/app/api/sw/kill/route";

describe("Service Worker Lifecycle & Kill-Switch (Unit)", () => {
  it("verifies sw.js contains multi-tier caching strategies and offline fallback", () => {
    const swPath = path.join(process.cwd(), "public", "sw.js");
    const swContent = fs.readFileSync(swPath, "utf-8");

    // Cache definitions
    expect(swContent).toContain("cb-precache-");
    expect(swContent).toContain("cb-chunks-");
    expect(swContent).toContain("cb-fonts-");
    expect(swContent).toContain("cb-images-");
    expect(swContent).toContain("cb-api-");

    // Essential precache assets
    expect(swContent).toContain('"/offline"');
    expect(swContent).toContain('"/workspace"');
    expect(swContent).toContain('"/manifest.json"');

    // Strategy & security rules
    expect(swContent).toContain("googleapis.com"); // Network-only check
    expect(swContent).toContain("/api/auth/"); // Never cache auth tokens
    expect(swContent).toContain("SKIP_WAITING");
    expect(swContent).toContain("CLEAR_SITE_DATA");
  });

  it("kill-switch endpoint emits W3C Clear-Site-Data header on POST and GET", async () => {
    const postRes = await POST();
    expect(postRes.status).toBe(200);
    expect(postRes.headers.get("Clear-Site-Data")).toBe('"cache"');

    const json = await postRes.json();
    expect(json.status).toBe("cleared");

    const getRes = await GET();
    expect(getRes.status).toBe(200);
    expect(getRes.headers.get("Clear-Site-Data")).toBe('"cache"');
  });
});
