const CACHE_NAME = 'daily-report-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './login.html',
  './style.css',
  './app.js',
  './logo.png',
  './manifest.json',
  './version.html'
];

// Install event: Cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event: Network First for version.html, Cache First for others
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Network First for version.html
  if (url.pathname.endsWith('version.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Update cache with new version
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache First for everything else
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});
