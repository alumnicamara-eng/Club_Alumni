const CACHE_NAME = 'alumni-camarafp-v11';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './img/logo.jpeg',
  './css/base.css',
  './css/layout.css',
  './css/components.css',
  './css/screens.css',
  './js/data.js',
  './js/utils.js',
  './js/ui.js',
  './js/auth.js',
  './js/router.js',
  './js/api.js',
  './js/app.js',
  './js/screens/home.js',
  './js/screens/news.js',
  './js/screens/calendar.js',
  './js/screens/talks.js',
  './js/screens/mentors.js',
  './js/screens/community.js',
  './js/screens/directory.js',
  './js/screens/profile.js',
  './js/screens/admin.js'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) {
    e.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }
  e.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});

self.addEventListener('push', e => {
  let data = { title: 'Alumni Cámara FP', body: 'Tienes una notificación nueva.' };
  try { data = e.data ? e.data.json() : data; } catch (err) {}
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: './img/logo.jpeg',
    badge: './img/logo.jpeg',
    data: data.url || './'
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data || './'));
});
