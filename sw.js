const CACHE_NAME = 'snake-changer-sgs-v2';
const ASSETS_TO_CACHE = [
  './index.html',
  './manifest.json',
  './offline.html',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Firebase / Google Auth কে Cache করবে না - এটা তোর Best Logic
  if (url.origin.includes('firebase') || 
      url.origin.includes('googleapis') || 
      url.origin.includes('gstatic') || 
      url.origin.includes('firestore') ||
      url.origin.includes('start.io')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      
      return fetch(event.request).then((response) => {
        // শুধু index.html আর manifest কে dynamic cache করবে
        if(event.request.url.includes('index.html') || event.request.url.includes('manifest.json')){
           let clone = response.clone();
           caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Net Fail হলে offline.html দেখাবে
        return caches.match('./offline.html');
      });
    })
  );
});