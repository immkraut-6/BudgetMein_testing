// BudgetMein Service Worker v1.0
const CACHE_NAME = 'budgetmein-v3-customer-notify';
const PRECACHE = ['/', '/index.html', '/menu.html', '/manifest.json', '/offline.html'];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE).catch(function(err) { console.warn('[SW]', err); });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic') || url.hostname.includes('telegram') ||
      url.hostname.includes('cloudinary')) return;

  if (e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request).then(function(res) {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(c) { c.put(e.request, clone); });
        return res;
      }).catch(function() {
        return caches.match(e.request).then(function(cached) {
          return cached || caches.match('/offline.html') || caches.match('/index.html');
        });
      })
    );
    return;
  }

  if (['style', 'script', 'font'].includes(e.request.destination)) {
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        if (cached) return cached;
        return fetch(e.request).then(function(res) {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function(c) { c.put(e.request, clone); });
          return res;
        });
      })
    );
  }
});
