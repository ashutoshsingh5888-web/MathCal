const CACHE_NAME = "mental-math-daily-v2";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",

  "./css/variables.css",
  "./css/layout.css",
  "./css/components.css",
  "./css/responsive.css",

  "./js/state.js",
  "./js/storage.js",
  "./js/generators.js",
  "./js/progress.js",
  "./js/ui.js",
  "./js/practice.js",
  "./js/review.js",
  "./js/daily-test.js",
  "./js/settings.js",
  "./js/dashboard.js",
  "./js/feedback.js",
  "./js/app.js",

  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // network-first for fonts/CDN, cache-first for same-origin app shell
  const isSameOrigin = new URL(event.request.url).origin === self.location.origin;

  if (!isSameOrigin) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
