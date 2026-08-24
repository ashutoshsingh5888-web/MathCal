const CACHE_NAME = "mental-math-daily-v10";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./about.html",
  "./guide.html",
  "./robots.txt",
  "./sitemap.xml",

  "./practice/tables.html",
  "./practice/squares.html",
  "./practice/cubes.html",
  "./practice/powers.html",
  "./practice/arithmetic.html",

  "./interactive/squares-ending-in-5.html",
  "./interactive/base-100-multiplication.html",

  "./blog/index.html",
  "./blog/square-numbers-ending-in-5.html",
  "./blog/multiply-numbers-close-to-100.html",
  "./blog/square-numbers-close-to-50.html",
  "./blog/square-numbers-close-to-100.html",
  "./blog/cube-two-digit-numbers.html",
  "./blog/multiply-by-11.html",
  "./blog/multiply-by-9-and-99.html",
  "./blog/multiply-by-5-25-125.html",
  "./blog/same-tens-complementary-units.html",
  "./blog/vedic-cross-multiplication.html",

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
  "./js/learn.js",
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
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
