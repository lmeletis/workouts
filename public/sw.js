// Offline cache: serve from cache when available, refresh in the background.
const CACHE = 'train-v2';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './index.html', './manifest.webmanifest', './icon.svg'])));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const isPage = req.mode === 'navigate';
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(isPage ? './index.html' : req);
      const network = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(isPage ? './index.html' : req, res.clone());
          return res;
        })
        .catch(() => cached);
      // Pages: try network first so updates land; assets: cache first.
      return isPage ? network.then((r) => r || cached) : cached || network;
    })
  );
});
