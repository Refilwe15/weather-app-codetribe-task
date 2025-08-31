const cacheName = "weather-app-v1";
const assetsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/assets/clear.png",
  "/assets/clouds.png",
  "/assets/rain.png",
  "/assets/snow.png",
  "/assets/drizzle.png",
  "/assets/mist.png",
  "/assets/thunder.png",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.7/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"
];

self.addEventListener("install", e=>{ e.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(assetsToCache))); });
self.addEventListener("fetch", e=>{
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
