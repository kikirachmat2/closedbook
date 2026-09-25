import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { refreshGoogleAccessToken } from "@/lib/auth/google-oauth";

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session.isLoggedIn || !session.tokens?.refreshToken) {
    return NextResponse.json(
      { ok: false, error: "No active session or refresh token available." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "true";
  const now = Date.now();
  const timeUntilExpiry = session.tokens.expiresAt - now;

  // Refresh if within 5-minute threshold (300,000 ms) or if forced
  const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;
  if (!force && timeUntilExpiry > REFRESH_THRESHOLD_MS) {
    return NextResponse.json({
      ok: true,
      refreshed: false,
      expiresAt: session.tokens.expiresAt,
      message: "Token is still valid outside the 5-minute renewal window.",
    });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId) {
    return NextResponse.json(
      { ok: false, error: "GOOGLE_CLIENT_ID missing." },
      { status: 500 }
    );
  }

  try {
    const newTokens = await refreshGoogleAccessToken({
      refreshToken: session.tokens.refreshToken,
      clientId,
      clientSecret,
    });

    session.tokens.accessToken = newTokens.accessToken!;
    session.tokens.expiresAt = newTokens.expiresAt!;
    if (newTokens.refreshToken) {
      session.tokens.refreshToken = newTokens.refreshToken;
    }
    await session.save();

    return NextResponse.json({
      ok: true,
      refreshed: true,
      expiresAt: session.tokens.expiresAt,
    });
  } catch (err: any) {
    console.error("[Silent Refresh Failed]:", err);

    // If Google returned invalid_grant, session has been revoked externally
    if (err?.message?.includes("invalid_grant")) {
      session.destroy();
      return NextResponse.json(
        { ok: false, error: "SESSION_REVOKED", message: "Google refresh token was revoked by user." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { ok: false, error: err?.message || "refresh_failed" },
      { status: 500 }
    );
  }
}
