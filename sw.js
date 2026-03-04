// sw.js — Spurthi Youth Fest 2026
// Upload this file to your GitHub repo at: /Spurthi-youth-fest-2026/sw.js

const FIREBASE_URL = 'https://spurthi-youthfest-2026-default-rtdb.asia-southeast1.firebasedatabase.app';
const FCM_WORKER   = 'https://fcm-push.harshgujjar.workers.dev';

function swLog(step, detail) {
    fetch(FIREBASE_URL + '/sw_debug.json', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, detail: detail || '', ts: Date.now() })
    }).catch(() => {});
}

self.addEventListener('install', e => {
    swLog('install', 'SW installed');
    e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', e => {
    swLog('activate', 'SW activated');
    e.waitUntil(self.clients.claim());
    startScheduleChecker();
});

// ── Push handler ─────────────────────────────────────────
self.addEventListener('push', function(event) {
    swLog('push_received', event.data ? event.data.text() : 'NO DATA');
    let data = { title: 'Spurthi 2026', body: 'New notification' };
    try {
        if (event.data) {
            const text = event.data.text();
            try { data = JSON.parse(text); } catch(e) { data.body = text; }
        }
    } catch(e) { swLog('push_parse_error', e.message); }
    const title = data.title || 'Spurthi 2026';
    const body  = data.body  || '';
    const notifUrl = data.url || 'https://harshgujjar.github.io/Spurthi-youth-fest-2026/';
    const options = {
        body, icon: '/Spurthi-youth-fest-2026/davan_logo_2026.gif',
        badge: '/Spurthi-youth-fest-2026/davan_logo_2026.gif',
        vibrate: [300, 100, 300, 100, 300],
        requireInteraction: true,
        tag: 'spurthi-' + (data.tag || 'msg'),
        renotify: true,
        data: { url: notifUrl, convId: data.convId || '' }
    };
    event.waitUntil(
        self.registration.showNotification(title, options)
            .then(() => swLog('push_shown_ok', title))
            .catch(err => swLog('push_show_error', err.message))
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    const data   = event.notification.data || {};
    const convId = data.convId || '';
    const base   = data.url || 'https://harshgujjar.github.io/Spurthi-youth-fest-2026/';
    const url    = convId ? (base.split('?')[0] + '?openChat=' + convId) : base;
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
            for (const c of list) {
                if (c.url.includes('Spurthi')) {
                    if ('focus' in c) { c.focus(); c.postMessage({ type: 'OPEN_CHAT_CONV', convId }); return; }
                }
            }
            if (clients.openWindow) return clients.openWindow(url);
        })
    );
});

// ══════════════════════════════════════════════════════════
// AUTO-ANNOUNCE SCHEDULE — runs inside SW (no page needed)
// Fires every 60s, checks Firebase slots, sends FCM at match.
// Fired-keys stored in Firebase so no double-fire across reloads.
// Slots repeat daily — same time every day automatically.
// ══════════════════════════════════════════════════════════

function getToday() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

async function swCheckSchedule() {
    try {
        const now   = new Date();
        const nowH  = now.getHours();
        const nowM  = now.getMinutes();
        const today = getToday();

        // Read all slots from Firebase
        const slotsResp = await fetch(FIREBASE_URL + '/quizNotifConfig/slots.json');
        if (!slotsResp.ok) return;
        const slots = await slotsResp.json();
        if (!slots) return;

        for (const key of Object.keys(slots)) {
            const s = slots[key];
            if (!s || !s.auto || !s.time) continue;

            const [slotH, slotM] = s.time.split(':').map(Number);
            const diff = (nowH * 60 + nowM) - (slotH * 60 + slotM);
            if (diff < 0 || diff > 1) continue;  // only fire within 1-min window

            const fireKey = key + '_' + today;

            // Check if already fired today (stored in Firebase — persists across reloads)
            const firedResp = await fetch(FIREBASE_URL + '/sw_fired_slots/' + fireKey + '.json');
            const alreadyFired = firedResp.ok && await firedResp.json() === true;
            if (alreadyFired) continue;

            // Mark fired immediately to prevent race on multiple open tabs
            await fetch(FIREBASE_URL + '/sw_fired_slots/' + fireKey + '.json', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: 'true'
            }).catch(() => {});

            swLog('schedule_fired', 'slot=' + s.time + ' date=' + today);

            // Read notification config for message + autoQuizLive flag
            const cfgResp = await fetch(FIREBASE_URL + '/quizNotifConfig.json');
            const cfg = cfgResp.ok ? (await cfgResp.json() || {}) : {};
            const msg = cfg.quizLiveMsg || '📝 Daily Quiz is LIVE! Play now & win! 🏆';
            const toastId = 'quiz_live_' + today;

            // 1. Write quizAnnouncements/latest → shows live banner on all open pages
            fetch(FIREBASE_URL + '/quizAnnouncements/latest.json', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'live', title: '📝 Daily Quiz is LIVE!', body: msg, publishedAt: Date.now(), date: today })
            }).catch(() => {});

            // 2. Auto-publish quiz if not already published
            const pubResp = await fetch(FIREBASE_URL + '/quizPublished/' + today + '/published.json');
            const alreadyPublished = pubResp.ok && await pubResp.json() === true;
            if (!alreadyPublished) {
                fetch(FIREBASE_URL + '/quizPublished/' + today + '.json', {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ published: true, publishedAt: new Date().toISOString(), publishedBy: 'Auto-Schedule-SW' })
                }).catch(() => {});
            }

            // 3. Write live_notifications/latest → open page tabs show toast instantly
            fetch(FIREBASE_URL + '/live_notifications/latest.json', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: '📝 Daily Quiz is LIVE!', body: msg, sentAt: Date.now(), id: toastId, qnType: 'quiz' })
            }).catch(() => {});

            // 4. FCM push to all subscribed devices (only if Auto-notify on Publish is ON)
            if (cfg.autoQuizLive) {
                const tokensResp = await fetch(FIREBASE_URL + '/fcmTokens.json');
                if (tokensResp.ok) {
                    const tokens = await tokensResp.json();
                    if (tokens) {
                        const subs = Object.values(tokens)
                            .filter(d => d && d.subscription)
                            .map(d => { try { return JSON.parse(d.subscription); } catch(e) { return d.subscription; } });
                        if (subs.length) {
                            fetch(FCM_WORKER, {
                                method: 'POST', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ title: '📝 Daily Quiz is LIVE!', body: msg, subscriptions: subs, url: 'https://harshgujjar.github.io/Spurthi-youth-fest-2026/' })
                            }).catch(() => {});
                        }
                    }
                }
            }

            // 5. Schedule auto-end notification after slot duration
            const durMs = (s.duration || 45) * 60 * 1000;
            setTimeout(() => swFireQuizEnded(today, cfg), durMs);
        }

        // Daily cleanup: remove fired slot keys older than 2 days
        swCleanFiredSlots();

    } catch(err) {
        swLog('schedule_error', err.message || String(err));
    }
}

async function swFireQuizEnded(today, cfg) {
    try {
        const endMsg = '⏰ Quiz has ended! Results coming soon.';
        const endToastId = 'quiz_ended_' + today;
        // Update status to ended
        fetch(FIREBASE_URL + '/quizAnnouncements/latest.json', {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ended', endedAt: Date.now() })
        }).catch(() => {});
        // Toast for open pages
        fetch(FIREBASE_URL + '/live_notifications/latest.json', {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: '⏰ Quiz Ended', body: endMsg, sentAt: Date.now(), id: endToastId, qnType: 'quizended' })
        }).catch(() => {});
        // FCM push if auto-notify on
        if (cfg && cfg.autoQuizLive) {
            const tokensResp = await fetch(FIREBASE_URL + '/fcmTokens.json');
            if (tokensResp.ok) {
                const tokens = await tokensResp.json();
                if (tokens) {
                    const subs = Object.values(tokens).filter(d => d && d.subscription)
                        .map(d => { try { return JSON.parse(d.subscription); } catch(e) { return d.subscription; } });
                    if (subs.length) {
                        fetch(FCM_WORKER, {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ title: '⏰ Quiz Ended', body: endMsg, subscriptions: subs })
                        }).catch(() => {});
                    }
                }
            }
        }
        swLog('quiz_ended_fired', today);
    } catch(err) { swLog('quiz_ended_error', err.message); }
}

async function swCleanFiredSlots() {
    try {
        const resp = await fetch(FIREBASE_URL + '/sw_fired_slots.json');
        if (!resp.ok) return;
        const fired = await resp.json();
        if (!fired) return;
        const d = new Date(); d.setDate(d.getDate() - 2);
        const cutoff = d.toISOString().slice(0,10);
        for (const key of Object.keys(fired)) {
            if (key.slice(-10) < cutoff) {
                fetch(FIREBASE_URL + '/sw_fired_slots/' + key + '.json', { method: 'DELETE' }).catch(() => {});
            }
        }
    } catch(e) {}
}

function startScheduleChecker() {
    // Runs every 60s inside the Service Worker — works even when all tabs are closed.
    // Slots repeat automatically every day (same time daily) until deleted.
    setTimeout(swCheckSchedule, 5000);
    setInterval(swCheckSchedule, 60000);
}
