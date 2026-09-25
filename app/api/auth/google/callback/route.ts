import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  COOKIE_PKCE_VERIFIER,
  COOKIE_OAUTH_STATE,
} from "@/lib/auth/constants";
import {
  exchangeCodeForTokens,
  fetchGoogleUserProfile,
} from "@/lib/auth/google-oauth";
import { getSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    request.nextUrl.origin ||
    "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(`${origin}/workspace?oauth_error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/workspace?oauth_error=missing_code_or_state`);
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get(COOKIE_OAUTH_STATE)?.value;
  const codeVerifier = cookieStore.get(COOKIE_PKCE_VERIFIER)?.value;

  // 1. Verify CSRF State
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${origin}/workspace?oauth_error=invalid_csrf_state`);
  }

  // 2. Verify PKCE Verifier Presence
  if (!codeVerifier) {
    return NextResponse.redirect(`${origin}/workspace?oauth_error=missing_pkce_verifier`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${origin}/api/auth/google/callback`;

  if (!clientId) {
    return NextResponse.redirect(`${origin}/workspace?oauth_error=missing_client_id`);
  }

  try {
    // 3. Exchange Code for Tokens
    const tokenResponse = await exchangeCodeForTokens({
      code,
      codeVerifier,
      redirectUri,
      clientId,
      clientSecret,
    });

    // 4. Fetch User Profile
    const userProfile = await fetchGoogleUserProfile(tokenResponse.access_token);

    // 5. Seal into Encrypted Session Cookie
    const session = await getSession();
    session.isLoggedIn = true;
    session.createdAt = Date.now();
    session.user = userProfile;
    session.tokens = {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: Date.now() + tokenResponse.expires_in * 1000,
      scope: tokenResponse.scope,
    };
    await session.save();

    // 6. Clear PKCE cookies
    cookieStore.delete(COOKIE_PKCE_VERIFIER);
    cookieStore.delete(COOKIE_OAUTH_STATE);

    return NextResponse.redirect(`${origin}/workspace?oauth_success=true`);
  } catch (err: any) {
    console.error("[OAuth Callback Error]:", err);
    return NextResponse.redirect(
      `${origin}/workspace?oauth_error=${encodeURIComponent(err?.message || "token_exchange_failed")}`
    );
  }
}
