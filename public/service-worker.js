// public/service-worker.js
const CACHE_NAME = "administracionlifters-jueces-v1";
const urlsToCache = [
  "/jueces/calificar",
  "/index.html",
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Solo interceptamos peticiones que contengan /jueces/
  if (!req.url.includes("/jueces/")) {
    return; // dejar pasar otras peticiones
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        // opcional: podrías clonar la respuesta y actualizar cache aquí
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match("/offline.html"))
      )
  );
});
