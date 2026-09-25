import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { revokeGoogleToken } from "@/lib/auth/google-oauth";

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (session.tokens?.refreshToken || session.tokens?.accessToken) {
    const tokenToRevoke = session.tokens.refreshToken || session.tokens.accessToken;
    try {
      await revokeGoogleToken(tokenToRevoke);
    } catch (err) {
      console.warn("[OAuth Revoke Warning]: Google token revocation failed or already revoked", err);
    }
  }

  // Destroy the local encrypted session cookie
  session.destroy();

  return NextResponse.json({
    ok: true,
    message: "Google account disconnected and session destroyed.",
  });
}

export async function GET(request: NextRequest) {
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    request.nextUrl.origin ||
    "http://localhost:3000";

  await POST(request);
  return NextResponse.redirect(`${origin}/workspace?disconnected=true`);
}
