const FIREBASE_URL = 'https://spurthi-youthfest-2026-default-rtdb.asia-southeast1.firebasedatabase.app';

self.addEventListener('push', function(event) {
    event.waitUntil(
        fetch(FIREBASE_URL + '/live_notifications/latest.json')
            .then(r => r.json())
            .then(data => {
                const title = (data && data.title) ? data.title : 'Spurthi 2026';
                const body  = (data && data.body)  ? data.body  : 'You have a new notification';
                return self.registration.showNotification(title, {
                    body: body,
                    icon: '/Spurthi-youth-fest-2026/davan-logo.png',
                    badge: '/Spurthi-youth-fest-2026/davan-logo.png',
                    vibrate: [200, 100, 200],
                    data: { url: 'https://harshgujjar.github.io/Spurthi-youth-fest-2026/' }
                });
            })
            .catch(() => self.registration.showNotification('Spurthi 2026', { body: 'New notification' }))
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(clients.openWindow('https://harshgujjar.github.io/Spurthi-youth-fest-2026/'));
});
