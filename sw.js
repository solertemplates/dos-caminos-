// Dos Caminos — funciona sin conexión y SIEMPRE carga la última versión cuando hay red.
// Cada archivo se pide a la red saltándose la caché del navegador (Safari puede guardar copias viejas
// hasta 10 minutos y mezclar archivos de versiones distintas). La copia guardada solo se usa sin conexión.
const CACHE = 'dos-caminos-v31';
const FILES = ['./', 'index.html', 'styles.css', 'manifest.webmanifest', 'version.json', 'js/version.js', 'js/app.js', 'js/parser.js', 'js/examples.js', 'js/render.js', 'js/scenes.js', 'js/figure.js', 'js/scenes2.js', 'js/audio.js', 'js/encoder.js', 'js/storage.js', 'js/music.js', 'js/publish.js', 'js/zip.js', 'js/format.js', 'js/finals.js', 'js/objects.js', 'js/uses.js', 'js/mp4strip.js', 'js/moments.js', 'js/remux.js', 'js/ausente.js', 'vendor/mp4-muxer.mjs', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(url.href, { cache: 'no-store', credentials: 'same-origin' })
      .then((r) => {
        if (r.ok) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); }
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
