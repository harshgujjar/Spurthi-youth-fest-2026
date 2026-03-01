// sw.js — Spurthi Youth Fest 2026
self.addEventListener('push', function(event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch(e) {
    data = { title: 'Spurthi 2026', body: event.data ? event.data.text() : 'New notification' };
  }

  const title = data.title || data.notification?.title || 'Spurthi 2026';
  const body  = data.body  || data.notification?.body  || 'New notification';

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: '/Spurthi-youth-fest-2026/davan-logo.png',
      badge: '/Spurthi-youth-fest-2026/davan-logo.png',
      vibrate: [200, 100, 200]
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('https://harshgujjar.github.io/Spurthi-youth-fest-2026/')
  );
});
