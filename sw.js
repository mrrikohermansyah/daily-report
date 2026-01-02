const CACHE_NAME = "daily-report-v4";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./login.html",
  "./style.css",
  "./app.js",
  "./logo.png",
  "./manifest.json",
  "./version.html",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js",
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js",
  "https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js",
  "https://cdn.jsdelivr.net/npm/sweetalert2@11",
  "https://cdn.jsdelivr.net/npm/exceljs/dist/exceljs.min.js",
  "https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js",
];

// Install event: Cache assets
self.addEventListener("install", (event) => {
  self.skipWaiting(); // Force waiting service worker to become active
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate event: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control of all clients immediately
});

// Fetch event: Network First for mutable files, Cache First for static assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // List of files that change frequently (Development Mode)
  // These will try to fetch from network first, then fallback to cache
  const MUTABLE_FILES = [
    "version.html",
    "index.html",
    "login.html",
    "style.css",
    "app.js",
    "/",
  ];

  const isMutable = MUTABLE_FILES.some(
    (file) =>
      url.pathname.endsWith(file.replace("./", "")) ||
      (file === "/" && url.pathname.endsWith("/"))
  );

  if (isMutable) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If network fetch succeeds, update the cache
          if (response.status === 200) {
            const clonedResponse = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails (offline), return from cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache First for everything else (images, fonts, libs)
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});
