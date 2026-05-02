const CACHE_VERSION = "v5";
const STATIC_CACHE = `ahlcg-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `ahlcg-runtime-${CACHE_VERSION}`;
const BASE = "/botse_audio";

const APP_ASSETS = [
  `${BASE}/`,
  `${BASE}/manifest.webmanifest`,
  `${BASE}/icons/icon-192.png`,
  `${BASE}/icons/icon-512.png`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

async function networkFirst(request, fallbackToCache = true) {
  const runtimeCache = await caches.open(RUNTIME_CACHE);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.ok && request.method === "GET") {
      runtimeCache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    if (!fallbackToCache) throw new Error("Network request failed");

    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    return caches.match(`${BASE}/`);
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  const isNavigationRequest = event.request.mode === "navigate";
  const isDynamicAsset =
    event.request.destination === "script" ||
    event.request.destination === "style" ||
    event.request.destination === "font" ||
    event.request.destination === "audio" ||
    event.request.destination === "video" ||
    event.request.destination === "manifest" ||
    url.pathname.endsWith(".json");

  if (isNavigationRequest || isDynamicAsset) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();

          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });

          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match(`${BASE}/`);
          }
        });
    })
  );
});