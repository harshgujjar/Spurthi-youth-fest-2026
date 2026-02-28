// sw.js — Spurthi Youthfest 2026
// ⚠️ Upload this file to GitHub ROOT alongside index.html
// Served at: https://harshgujjar.github.io/Spurthi-youth-fest-2026/sw.js

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

// ── Receive Push ──────────────────────────────────────────────
self.addEventListener('push', event => {
  let title = 'Spurthi Youthfest 2026';
  let body  = 'You have a new notification!';
  let url   = '/Spurthi-youth-fest-2026/';

  if (event.data) {
    try {
      const d = event.data.json();
      title = (d.notification && d.notification.title) || d.title || title;
      body  = (d.notification && d.notification.body)  || d.body  || body;
      url   = (d.data && d.data.url) || url;
    } catch {
      body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:    '/Spurthi-youth-fest-2026/davan_degree1.png',
      badge:   '/Spurthi-youth-fest-2026/davan_degree1.png',
      vibrate: [200, 100, 200],
      data:    { url }
    })
  );
});

// ── Click notification → open site ───────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes('harshgujjar.github.io') && 'focus' in c) return c.focus();
      }
      return clients.openWindow(event.notification.data?.url || '/Spurthi-youth-fest-2026/');
    })
  );
});
