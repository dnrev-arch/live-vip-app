const CACHE_NAME = 'livevip-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/admin',
  '/manifest.json',
  '/icon.svg'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('LiveVIP: Cache opened');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('LiveVIP: Static assets cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('LiveVIP: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('LiveVIP: Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          console.log('LiveVIP: Serving from cache:', event.request.url);
          return response;
        }

        // Otherwise fetch from network
        console.log('LiveVIP: Fetching from network:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the response for future use
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Background sync for heartbeat when online
self.addEventListener('sync', (event) => {
  if (event.tag === 'heartbeat-sync') {
    event.waitUntil(
      // Send queued heartbeats when back online
      sendQueuedHeartbeats()
    );
  }
});

// Push notifications for premium offers
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do LiveVIP',
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver Lives',
        icon: '/icon.svg'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('LiveVIP', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper function to send queued heartbeats
async function sendQueuedHeartbeats() {
  try {
    // In a real app, this would send queued heartbeat data
    console.log('LiveVIP: Sending queued heartbeats');
    
    // Example: Send to API
    // const queuedData = await getQueuedHeartbeats();
    // await fetch('/api/heartbeat/bulk', {
    //   method: 'POST',
    //   body: JSON.stringify(queuedData)
    // });
    
    return Promise.resolve();
  } catch (error) {
    console.error('LiveVIP: Error sending queued heartbeats:', error);
    return Promise.reject(error);
  }
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
