/* ========================================
 * ポケバトルアシスト - Service Worker
 * ======================================== */

var CACHE_NAME = 'pokebattle-v1';

var ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/data.js',
  './js/kana.js',
  './js/store.js',
  './js/search.js',
  './js/score.js',
  './js/firebase.js',
  './js/pokemon-input.js',
  './js/router.js',
  './js/views/home.js',
  './js/views/type-list.js',
  './js/views/type-edit.js',
  './js/views/party-list.js',
  './js/views/party-edit.js',
  './js/views/simulator.js',
  './js/views/settings.js',
  './data/pokemon_champions.json',
  './data/abbreviations.json',
  './data/natures.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// インストール: アセットをキャッシュ
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// アクティベート: 古いキャッシュを削除
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// フェッチ: キャッシュ優先、なければネットワーク
self.addEventListener('fetch', function(event) {
  // Firebase / 外部URLはキャッシュしない
  if (event.request.url.indexOf('firestore') >= 0 ||
      event.request.url.indexOf('googleapis') >= 0 ||
      event.request.url.indexOf('gstatic') >= 0 ||
      event.request.url.indexOf('firebase') >= 0) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        // 正常なレスポンスのみキャッシュ
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
        return response;
      });
    })
  );
});
