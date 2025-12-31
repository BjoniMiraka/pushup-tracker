const CACHE_NAME = 'pushup-tracker-v2-simplified';
const urlsToCache = [
  './pages/index.html',
  './styles/main.css',
  './scripts/app.js',
  './scripts/db.js',
  './scripts/notifications.js',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js',
  'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.wasm'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.log('Cache install error:', err);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(err => {
          console.log('Fetch error:', err);
          // Could return a custom offline page here
        });
      })
  );
});

// Background sync for notifications
self.addEventListener('sync', event => {
  if (event.tag === 'check-pushups') {
    event.waitUntil(checkDailyGoal());
  }
});

async function checkDailyGoal() {
  // This would check if the user has met their daily goal
  // and send a notification if needed
  console.log('Background sync: checking daily goal');
}

// Push notification event
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Time to do your pushups!',
    icon: './icons/icon-192.svg',
    badge: './icons/icon-192.svg',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'log',
        title: 'Log Pushups',
        icon: './icons/icon-192.svg'
      },
      {
        action: 'close',
        title: 'Close',
        icon: './icons/icon-192.svg'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Pushup Tracker', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'log') {
    event.waitUntil(
      clients.openWindow('./pages/index.html')
    );
  } else {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        for (let client of clientList) {
          if (client.url.includes('index.html') && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('./pages/index.html');
        }
      })
    );
  }
});

