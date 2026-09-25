import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let report: any = null;

    if (contentType.includes("application/csp-report") || contentType.includes("application/json")) {
      report = await request.json();
    } else {
      const text = await request.text();
      report = { raw: text };
    }

    // In production, log CSP violation to native runtime logs without exposing user PII
    if (process.env.NODE_ENV !== "production") {
      console.warn("[CSP Violation]:", JSON.stringify(report, null, 2));
    } else {
      console.warn("[CSP Violation Directive]:", report?.["csp-report"]?.["violated-directive"] || "unknown");
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
