import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV !== "production";

  // Production uses 'strict-dynamic' + 'nonce-${nonce}' with zero 'unsafe-eval' and zero 'unsafe-inline' (ADR-003)
  const scriptSrc = isDev
    ? "'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com"
    : `'self' 'nonce-${nonce}' 'strict-dynamic' https://apis.google.com`;

  const cspHeader = `
    default-src 'self';
    script-src ${scriptSrc};
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://*.googleusercontent.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://accounts.google.com https://www.googleapis.com https://oauth2.googleapis.com https://generativelanguage.googleapis.com;
    worker-src 'self' blob:;
    frame-src https://accounts.google.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self' https://accounts.google.com;
    frame-ancestors 'none';
    report-uri /api/csp-report;
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  // Forward nonce to Next.js so it attaches the nonce attribute to all framework script tags
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Set response headers
  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(self), geolocation=(), browsing-topics=()"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)",
  ],
};
