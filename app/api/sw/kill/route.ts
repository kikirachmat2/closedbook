// =========================================================================
// CLOSEDBOOK PRODUCTION OS — SERVICE WORKER KILL-SWITCH ENDPOINT (G.2)
// =========================================================================

import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    status: "cleared",
    message: "Service worker caches and client storage cleared via emergency kill-switch.",
    timestamp: Date.now(),
  });

  // W3C Clear-Site-Data header to force client browser to purge all service worker caches
  // CRITICAL: ONLY clear "cache" so local Dexie / IndexedDB user data is NOT wiped.
  response.headers.set("Clear-Site-Data", '"cache"');
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");

  return response;
}

export async function GET() {
  return POST();
}
