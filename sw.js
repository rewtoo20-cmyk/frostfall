// Оффлайн-кэш FROSTFALL: сначала сеть (всегда свежая версия), без сети - из кэша
const CACHE = 'frostfall-v2';
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './index.html', './manifest.webmanifest', './icon-192.png']).catch(() => {}))); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== CACHE).map((x) => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET' || !r.url.startsWith(self.location.origin)) return;
  e.respondWith(caches.open(CACHE).then(async (c) => { try { const res = await fetch(r, { cache: 'no-cache' }); if (res && res.ok) c.put(r, res.clone()); return res; } catch (x) { const hit = await c.match(r); if (hit) return hit; throw x; } }));
});
