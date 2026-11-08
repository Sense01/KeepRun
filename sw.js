// Service worker: rede primeiro para os ficheiros da app, cache-primeiro para as bibliotecas externas fixas.
const C = 'keeprun-v6';
const CORE = ['./', 'index.html', 'social.js', 'treinos.js', 'anim.js', 'firebase-config.js', 'manifest.webmanifest', 'icon-192.png', 'vendor/leaflet/leaflet.js', 'vendor/leaflet/leaflet.css'];
const EXT = ['https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'];
const CDN = ['cdnjs.cloudflare.com', 'www.gstatic.com'];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(c => Promise.all([
    ...CORE.map(u => c.add(u).catch(() => {})),
    ...EXT.map(u => c.add(new Request(u, { mode: 'no-cors' })).catch(() => {}))
  ])));
});
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    e.respondWith(fetch(r, { cache: 'no-cache' }).then(res => {
      if (res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)).catch(() => {}); }
      return res;
    }).catch(() => caches.match(r)));
  } else if (CDN.includes(u.hostname)) {
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => {
      try { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)).catch(() => {}); } catch (x) {}
      return res;
    })));
  }
});
