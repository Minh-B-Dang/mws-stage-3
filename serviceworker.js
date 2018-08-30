(function() {
    'use strict';
    var cacheFiles = [
      '/',
      '/index.html',
      '/restaurant.html',
      '/manifest.json',
      '/img/1.jpg',
      '/img/2.jpg',
      '/img/3.jpg',
      '/img/4.jpg',
      '/img/5.jpg',
      '/img/6.jpg',
      '/img/7.jpg',
      '/img/8.jpg',
      '/img/9.jpg',
      '/img/10.jpg',
      '/css/styles.css',
      '/js/dbhelper.js',
      '/js/main.js',
      '/js/libs.js',
      '/js/restaurant_info.js',
      '/pages/404.html',
      '/pages/offline.html'
    ];
 
    var dynamicCacheName = 'pages-cache-v4';
 
    self.addEventListener('install', event => {
      event.waitUntil(
        caches.open(dynamicCacheName)
        .then(cache => {
          return cache.addAll(cacheFiles);
        })
      );
    });

    self.addEventListener('activate', event => {
      console.log('Service worker activating...');
   
      var cacheWhitelist = [dynamicCacheName];
   
      event.waitUntil(
        caches.keys().then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName => {
                console.log(cacheName)
              if (cacheWhitelist.indexOf(cacheName) === -1) {
                return caches.delete(cacheName);
              }
            })
          );
        })
      );
    });
 
    self.addEventListener('fetch', event =>{
      event.respondWith(
        caches.match(event.request).then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request).then(response => {
            return caches.open(dynamicCacheName).then(cache => {
                cache.put(event.request.url, response.clone());
              return response;
            });
          });
        }).catch(error => {
          console.log('Error, ', error);
          return caches.match('/pages/offline.html');
        })
      );
    });
 
 
 })();
 