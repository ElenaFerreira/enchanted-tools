const CACHE_NAME = "enchanted-tools-v1";

// Ressources à mettre en cache lors de l'installation
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
];

// Installation : mise en cache des ressources essentielles
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  // Active immédiatement le nouveau service worker
  self.skipWaiting();
});

// Activation : nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Prend le contrôle de toutes les pages immédiatement
  self.clients.claim();
});

// Stratégie : Network First avec fallback sur le cache
self.addEventListener("fetch", (event) => {
  // Ignore les requêtes non-GET
  if (event.request.method !== "GET") return;

  // Ignore les requêtes vers des APIs externes (ex: Supabase)
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Ignore les requêtes vers les API routes Next.js
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone la réponse pour la mettre en cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Si le réseau échoue, tente le cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Page hors ligne par défaut pour les requêtes de navigation
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable",
          });
        });
      })
  );
});
