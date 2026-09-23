// =========================================================================
// CLOSEDBOOK PRODUCTION OS — HIGH-RESILIENCE SERVICE WORKER (G.2 PWA)
// =========================================================================

const SW_VERSION = "v2.0.0";
const PRECACHE_NAME = `cb-precache-${SW_VERSION}`;
const CHUNKS_CACHE_NAME = `cb-chunks-${SW_VERSION}`;
const FONTS_CACHE_NAME = `cb-fonts-${SW_VERSION}`;
const IMAGES_CACHE_NAME = `cb-images-${SW_VERSION}`;
const API_CACHE_NAME = `cb-api-${SW_VERSION}`;

const ALL_CACHES = [
  PRECACHE_NAME,
  CHUNKS_CACHE_NAME,
  FONTS_CACHE_NAME,
  IMAGES_CACHE_NAME,
  API_CACHE_NAME,
];

// 1. Core assets to precache on install
const PRECACHE_ASSETS = [
  "/",
  "/workspace",
  "/offline",
  "/manifest.json",
  "/icon.svg",
  "/icon.png",
  "/favicon.ico",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
];

// Helper: Timeout promise
function timeout(ms) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Network timeout after ${ms}ms`)), ms)
  );
}

// =========================================================================
// SERVICE WORKER LIFECYCLE
// =========================================================================

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn("[SW] Precache failed:", err);
      })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (!ALL_CACHES.includes(key)) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// =========================================================================
// FETCH STRATEGIES PER ASSET TYPE
// =========================================================================

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Only intercept GET requests
  if (request.method !== "GET") return;

  // 2. NETWORK-ONLY: Google Drive, OAuth, & Auth Endpoints (NEVER cache tokens/auth data)
  if (
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("google.com") ||
    url.pathname.startsWith("/api/auth/") ||
    url.pathname.startsWith("/api/sw/kill")
  ) {
    return; // Pass through straight to network
  }

  // 3. NAVIGATION REQUESTS (App Shell) -> Network-First with Offline Fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(PRECACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          // Check matching cache
          const cached = await caches.match(request);
          if (cached) return cached;

          // If navigating workspace or internal page while offline, fallback
          if (url.pathname.startsWith("/workspace")) {
            const wsCached = await caches.match("/workspace");
            if (wsCached) return wsCached;
          }

          // Ultimate offline fallback page
          const offlinePage = await caches.match("/offline");
          return offlinePage || caches.match("/");
        })
    );
    return;
  }

  // 4. FONTS -> Cache-First
  if (
    url.hostname.includes("fonts.gstatic.com") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".ttf")
  ) {
    event.respondWith(
      caches.open(FONTS_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const fetched = await fetch(request);
        if (fetched.status === 200) {
          cache.put(request, fetched.clone());
        }
        return fetched;
      })
    );
    return;
  }

  // 5. IMAGES -> Cache-First
  if (
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".jpg")
  ) {
    event.respondWith(
      caches.open(IMAGES_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const fetched = await fetch(request);
          if (fetched.status === 200) {
            cache.put(request, fetched.clone());
          }
          return fetched;
        } catch {
          return cached;
        }
      })
    );
    return;
  }

  // 6. JS/CSS BUNDLE CHUNKS -> Stale-While-Revalidate
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(CHUNKS_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => null);

        // Return cached immediately if available, while network updates in background
        return cached || (await fetchPromise);
      })
    );
    return;
  }

  // 7. INTERNAL API GET REQUESTS -> Network-First with 3s Timeout
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      Promise.race([fetch(request), timeout(3000)])
        .then(async (res) => {
          if (res.status === 200) {
            const cache = await caches.open(API_CACHE_NAME);
            cache.put(request, res.clone());
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(
            JSON.stringify({ error: "Offline: Unable to reach network API" }),
            { status: 503, headers: { "Content-Type": "application/json" } }
          );
        })
    );
    return;
  }

  // 8. DEFAULT FALLBACK
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// =========================================================================
// MESSAGE LISTENER & KILL SWITCH
// =========================================================================

self.addEventListener("message", (event) => {
  if (!event.data) return;

  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data.type === "CLEAR_SITE_DATA") {
    // Kill-switch handler: clear all caches
    caches.keys().then((keys) => {
      return Promise.all(keys.map((k) => caches.delete(k)));
    });
  }
});

// =========================================================================
// BACKGROUND SYNC API (OFFLINE MUTATIONS FLUSH)
// =========================================================================

self.addEventListener("sync", (event) => {
  if (event.tag === "closedbook-flush-mutations") {
    event.waitUntil(
      self.clients.matchAll({ type: "window" }).then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: "TRIGGER_BACKGROUND_FLUSH" });
        }
      })
    );
  }
});
