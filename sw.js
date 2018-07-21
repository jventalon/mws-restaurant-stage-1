var staticCacheName = 'mws-restaurant-static-v1';

var allCaches = [
  staticCacheName
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(staticCacheName).then(function(cache) {
            const imageUrls = Array.from(Array(10).keys()).map(i => `/img/${i +1}.jpg`);
            return cache.addAll([
                '/',
                '/restaurant.html',
                '/js/main.min.js',
                '/js/restaurant.min.js',
                '/css/main.min.css',
                '/css/restaurant.min.css',
                ...imageUrls
            ]);
        })
    );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName.startsWith('mws-restaurant-') &&
                 !allCaches.includes(cacheName);
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
    let request = event.request;
    // remove the url parameters of the restaurant page to match with the cache
    let urlParts = request.url.split('?');
    if (urlParts.length > 1 && urlParts[0].includes('restaurant.html')) {
        let url = new URL(urlParts[0]);
        request = new Request(url);
    }
    event.respondWith(
        caches.match(request).then(function(response) {
            return response || fetch(request);
        })
    );
});
