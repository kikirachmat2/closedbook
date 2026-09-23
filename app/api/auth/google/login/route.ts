import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateOAuthState,
} from "@/lib/auth/pkce";
import { buildGoogleAuthUrl } from "@/lib/auth/google-oauth";
import {
  COOKIE_PKCE_VERIFIER,
  COOKIE_OAUTH_STATE,
  PKCE_TTL_SECONDS,
} from "@/lib/auth/constants";

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "Google OAuth Client ID is not configured (GOOGLE_CLIENT_ID missing)." },
      { status: 500 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const prompt = searchParams.get("prompt") || "consent";

  // Determine redirect URI dynamically or from env
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    request.nextUrl.origin ||
    "http://localhost:3000";
  const redirectUri = `${origin}/api/auth/google/callback`;

  // 1. Generate PKCE Verifier & Challenge
  const verifier = generateCodeVerifier(64);
  const challenge = await generateCodeChallenge(verifier);
  const state = generateOAuthState(32);

  // 2. Build Google Auth URL
  const authUrl = buildGoogleAuthUrl({
    clientId,
    redirectUri,
    codeChallenge: challenge,
    state,
    prompt,
  });

  // 3. Store PKCE verifier and state in secure, short-lived HTTP-only cookies
  const cookieStore = await cookies();
  const isSecure = process.env.NODE_ENV === "production";

  cookieStore.set(COOKIE_PKCE_VERIFIER, verifier, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    maxAge: PKCE_TTL_SECONDS,
    path: "/",
  });

  cookieStore.set(COOKIE_OAUTH_STATE, state, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    maxAge: PKCE_TTL_SECONDS,
    path: "/",
  });

  return NextResponse.redirect(authUrl);
}
