var staticCacheName = 'mws-restaurant-static-v1';

var allCaches = [
  staticCacheName
];

self.addEventListener('install', function(event) {
    console.log('install');
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      const imageUrls = Array.from(Array(10).keys()).map(i => `/img/${i +1}.jpg`);
      return cache.addAll([
        '/index.html',
        '/restaurant.html',
        '/js/main.js',
        '/js/restaurant_info.js',
        '/js/dbhelper.js',
        '/css/styles.css',
        '/data/restaurants.json',
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
  var requestUrl = new URL(event.request.url);

  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
