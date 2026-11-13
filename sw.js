// Service worker: rede primeiro para os ficheiros da app, cache-primeiro para as bibliotecas externas fixas e mosaicos de mapa.
const C = 'keeprun-v26', T = 'keeprun-tiles-v1';
const CORE = ['./', 'index.html', 'social.js', 'treinos.js', 'pro.js', 'anim.js', 'firebase-config.js', 'manifest.webmanifest', 'icon-192.png', 'vendor/leaflet/leaflet.js', 'vendor/leaflet/leaflet.css'];
const EXT = ['https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'];
const CDN = ['cdnjs.cloudflare.com', 'www.gstatic.com', 'cdn.jsdelivr.net'];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(C).then(c => Promise.all([
    ...CORE.map(u => c.add(u).catch(() => {})),
    ...EXT.map(u => c.add(new Request(u, { mode: 'cors' })).catch(() => {}))
  ])));
});
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== C && k !== T).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url), isTile = u.hostname.endsWith('tile.openstreetmap.org');
  if (u.origin === location.origin) {
    e.respondWith(fetch(r, { cache: 'no-cache' }).then(res => {
      if (res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)).catch(() => {}); }
      return res;
    }).catch(() => caches.match(r)));
  } else if (CDN.includes(u.hostname) || isTile) {
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => {
      if (res.ok) { try { const cp = res.clone(); caches.open(isTile ? T : C).then(c => c.put(r, cp)).catch(() => {}); } catch (x) {} }
      return res;
    })));
  }
});

self.addEventListener('push', e => {
  let p = {};
  if (e.data) {
    try { p = e.data.json(); } catch (err) { p = { notification: { body: e.data.text() } }; }
  }
  const n = p.notification || {};
  const d = p.data || {};
  const ic = new URL('icon-192.png', self.registration.scope).href;
  e.waitUntil(self.registration.showNotification(n.title || 'KeepRun', {
    body: n.body || 'Tens uma nova interação na KeepRun',
    icon: ic,
    badge: ic,
    tag: d.tag || 'kr-notif',
    renotify: true,
    data: { url: d.url || './', type: d.type || '', entityId: d.entityId || '', nid: d.nid || '' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const d = e.notification.data || {};
  const target = new URL(d.url || './', self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const win = list.find(c => 'focus' in c);
    if (win) {
      win.postMessage({ type: 'KR_NOTIF', data: d });
      return win.focus();
    }
    return clients.openWindow(target);
  }));
});
