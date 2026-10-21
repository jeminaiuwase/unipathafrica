/* UniPath Africa service worker — network first, offline fallback */
const CACHE = 'unipath-v9';
const SHELL = ['/', '/index.html', '/assets/css/styles.css', '/assets/js/core.js', '/assets/js/app.js', '/assets/js/prepare.js', '/assets/js/extras.js', '/assets/js/costs.js', '/assets/js/thrive.js', '/assets/js/money.js', '/assets/js/features.js', '/data/content.json', '/assets/img/icon.svg', '/manifest.webmanifest'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !isFont) return;
  if (sameOrigin && url.pathname.startsWith('/api/')) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res && res.ok && (sameOrigin || isFont)) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then((m) => m || (req.mode === 'navigate' ? caches.match('/index.html') : undefined)))
  );
});
