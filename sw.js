// sw.js — Spurthi Youth Fest 2026
// Upload this file to your GitHub repo at: /Spurthi-youth-fest-2026/sw.js

const FIREBASE_URL = 'https://spurthi-youthfest-2026-default-rtdb.asia-southeast1.firebasedatabase.app';

function swLog(step, detail) {
    const entry = { step, detail: detail || '', ts: Date.now() };
    fetch(FIREBASE_URL + '/sw_debug.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
    }).catch(() => {});
}

self.addEventListener('install', e => {
    swLog('install', 'SW installed');
    e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', e => {
    swLog('activate', 'SW activated');
    e.waitUntil(self.clients.claim());
});

self.addEventListener('push', function(event) {
    swLog('push_received', event.data ? event.data.text() : 'NO DATA');
    let data = { title: 'Spurthi 2026', body: 'New notification' };
    try {
        if (event.data) {
            const text = event.data.text();
            try { data = JSON.parse(text); } catch(e) { data.body = text; }
        }
    } catch(e) { swLog('push_parse_error', e.message); }
    const title = data.title || (data.notification && data.notification.title) || 'Spurthi 2026';
    const body  = data.body  || (data.notification && data.notification.body)  || '';
    swLog('push_showing', 'title=' + title + ' body=' + body);
    const options = {
        body: body,
        icon: '/Spurthi-youth-fest-2026/davan_logo_2026.gif',
        badge: '/Spurthi-youth-fest-2026/davan_logo_2026.gif',
        vibrate: [300, 100, 300, 100, 300],
        requireInteraction: true,
        tag: 'spurthi-notif',
        renotify: true,
        data: { url: 'https://harshgujjar.github.io/Spurthi-youth-fest-2026/' }
    };
    event.waitUntil(
        self.registration.showNotification(title, options)
            .then(() => { swLog('push_shown_ok', title); })
            .catch(err => { swLog('push_show_error', err.message); })
    );
});

self.addEventListener('notificationclick', function(event) {
    swLog('notification_clicked', '');
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