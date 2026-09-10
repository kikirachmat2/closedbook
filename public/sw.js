// =========================================================================
// CLOSEDBOOK PRODUCTION OS — SERVICE WORKER (OFFLINE ASSET CACHING)
// =========================================================================

const CACHE_NAME = "closedbook-pwa-v1.0.0";

// Core static assets to precache on install
const PRECACHE_URLS = [
  "/",
  "/workspace",
  "/manifest.json",
  "/icon.svg",
  "/icon.png",
  "/favicon.ico",
  "/favicon-32x32.png",
  "/apple-touch-icon.png"
];

// Install event — precache static core shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn("[SW] Precache failed:", err);
      })
  );
});

// Activate event — clean up stale caches from previous versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event — intelligent routing strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Never intercept non-GET requests or external API calls
  if (request.method !== "GET") return;
  if (
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("script.google.com") ||
    url.hostname.includes("google.com")
  ) {
    return;
  }

  // 2. Navigation requests (/ and /workspace) -> Network-First with Cache Fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Fallback to cache if network is unavailable
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          
          // Secondary fallback to root or workspace
          if (url.pathname.startsWith("/workspace")) {
            const workspaceFallback = await caches.match("/workspace");
            if (workspaceFallback) return workspaceFallback;
          }
          return caches.match("/");
        })
    );
    return;
  }

  // 3. Static Next.js assets and images -> Cache-First with Network Fallback
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".woff2")
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 4. Default fallback: network with cache backup
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Listen for update skip_waiting signals
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
