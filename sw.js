// Service Worker - オフライン対応
const CACHE = 'cpa-v1';
const FILES = [
  './',
  './index.html',
];

// インストール時：index.htmlをキャッシュ
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES))
  );
  self.skipWaiting();
});

// アクティベート時：古いキャッシュ削除
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// フェッチ時：キャッシュ優先、なければネット
self.addEventListener('fetch', e => {
  // PDF用CDNはネット優先（失敗してもOK）
  if (e.request.url.includes('cdnjs.cloudflare.com')) {
    e.respondWith(
      fetch(e.request).catch(() => new Response('', {status: 503}))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
