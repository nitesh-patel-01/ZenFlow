const CACHE_NAME = 'zenflow-v3';
const STATIC_ASSETS = ['/', '/manifest.json'];

// In-SW reminder store: { id, title, fireAt, type }
// We use setTimeout to schedule each one. Max timeout ~24.8 days.
const scheduledTimers = new Map(); // id -> timeoutId

function scheduleReminder(reminder) {
  // Clear any existing timer for this id
  if (scheduledTimers.has(reminder.id)) {
    clearTimeout(scheduledTimers.get(reminder.id));
    scheduledTimers.delete(reminder.id);
  }

  const delay = reminder.fireAt - Date.now();
  if (delay < 0) return; // already past

  const label = reminder.type === 'task' ? '⏰ Task Reminder' : '📝 Note Reminder';

  const tid = setTimeout(() => {
    scheduledTimers.delete(reminder.id);
    self.registration.showNotification(label, {
      body: reminder.title,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      tag: reminder.id,
      requireInteraction: true,
      vibrate: [300, 100, 300, 100, 300, 100, 300],
      data: { type: reminder.type, id: reminder.id },
    });
  }, delay);

  scheduledTimers.set(reminder.id, tid);
}

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch (cache-first) ──────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/');
          }
        });
    })
  );
});

// ── Message from page: schedule reminders ────────────────────────────────────
// page.tsx calls syncRemindersToSW() which posts:
// { type: 'SCHEDULE_REMINDERS', reminders: [{ id, title, fireAt, type }] }
self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'SCHEDULE_REMINDERS') return;

  const incoming = event.data.reminders || [];

  // Cancel all timers for IDs not in the new list (e.g. deleted/completed tasks)
  const incomingIds = new Set(incoming.map((r) => r.id));
  for (const [id, tid] of scheduledTimers.entries()) {
    if (!incomingIds.has(id)) {
      clearTimeout(tid);
      scheduledTimers.delete(id);
    }
  }

  // Schedule each incoming reminder
  incoming.forEach(scheduleReminder);
});

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});

// ── Push (server push, future-proof) ─────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'ZenFlow', {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      tag: data.tag || 'zenflow',
      requireInteraction: true,
      vibrate: [300, 100, 300, 100, 300],
    })
  );
});
