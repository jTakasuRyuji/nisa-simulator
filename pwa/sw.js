// NISAシミュレータ PWA Service Worker
const CACHE_NAME = 'nisa-sim-pwa-v1';
const CORE_FILES = ['./', './index.html', './manifest.webmanifest'];
const OPTIONAL_FILES = [
  './icon-192.png',
  './icon-512.png',
  './icon.svg',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      // コアは確実にキャッシュし、任意ファイルは失敗しても全体を止めない
      return cache.addAll(CORE_FILES).then(function() {
        return Promise.allSettled(OPTIONAL_FILES.map(function(url) { return cache.add(url); }));
      });
    }).then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE_NAME; })
        .map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        // 取得できたものは次回用にキャッシュする
        if (response && (response.status === 200 || response.type === 'opaque')) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, copy); });
        }
        return response;
      });
    })
  );
});
