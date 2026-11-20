// Dos Caminos — funciona sin conexión.
const CACHE = 'dos-caminos-v21';
const FILES = ['./', 'index.html', 'styles.css', 'manifest.webmanifest', 'js/app.js', 'js/parser.js', 'js/examples.js', 'js/render.js', 'js/scenes.js', 'js/figure.js', 'js/scenes2.js', 'js/audio.js', 'js/encoder.js', 'js/storage.js', 'js/music.js', 'js/publish.js', 'js/zip.js', 'js/format.js', 'js/finals.js', 'js/objects.js', 'js/uses.js', 'js/mp4strip.js', 'js/moments.js', 'vendor/mp4-muxer.mjs', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))); self.clients.claim(); });
// red primero (para recibir actualizaciones), caché si no hay conexión
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
