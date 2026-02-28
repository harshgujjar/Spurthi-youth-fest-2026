// sw.js — Spurthi Youth Fest 2026
// Upload this file to your GitHub repo at: /Spurthi-youth-fest-2026/sw.js

self.addEventListener('install', e => {
    console.log('[SW] Installed');
    e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', e => {
    console.log('[SW] Activated');
    e.waitUntil(self.clients.claim());
});

self.addEventListener('push', function(event) {
    console.log('[SW] Push received!', event);
    let data = { title: 'Spurthi 2026', body: 'New notification' };
    try {
        if (event.data) {
            const text = event.data.text();
            try { data = JSON.parse(text); } catch(e) { data.body = text; }
        }
    } catch(e) {}
    const title = data.title || (data.notification && data.notification.title) || 'Spurthi 2026';
    const body  = data.body  || (data.notification && data.notification.body)  || '';
    const options = {
        body: body,
        icon: '/Spurthi-youth-fest-2026/davan_logo_2026.gif',
        badge: '/Spurthi-youth-fest-2026/davan_logo_2026.gif',
        vibrate: [300, 100, 300, 100, 300],
        requireInteraction: false,
        tag: 'spurthi-notif',
        renotify: true,
        data: { url: 'https://harshgujjar.github.io/Spurthi-youth-fest-2026/' }
    };
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    const url = (event.notification.data && event.notification.data.url)
                || 'https://harshgujjar.github.io/Spurthi-youth-fest-2026/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
            for (const c of list) {
                if (c.url.includes('Spurthi') && 'focus' in c) return c.focus();
            }
            if (clients.openWindow) return clients.openWindow(url);
        })
    );
});
