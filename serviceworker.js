const PRECACHE = 'cache-v-1';
const RUNTIME = 'runtime';

const PRECACHE_URLS = [
  'index.html',
  'css/styles.css',
  'js/dbhelper.js',
  'js/main.js',
  'js/register.js',
  'js/restaurant_info.js',
  'restaurant.html',
  'manifest.json',
  'img/1.jpg',
  'img/2.jpg',
  'img/3.jpg',
  'img/4.jpg',
  'img/5.jpg',
  'img/6.jpg',
  'img/7.jpg',
  'img/8.jpg',
  'img/9.jpg',
  'img/10.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(PRECACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  console.log('Service worker activated...');
  const currentCaches = [PRECACHE, RUNTIME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const storageUrl = event.request.url.split(/[?#]/)[0];
  if (storageUrl.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(storageUrl).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return caches.open(RUNTIME).then(cache => {
          return fetch(event.request).then(response => {
            return cache.put(storageUrl, response.clone()).then(() => {
              return response;
            });
          });
        });
      })
    );
  }
});
    
      
