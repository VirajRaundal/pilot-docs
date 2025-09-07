const CACHE_NAME = 'pilot-management-v1'
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/_next/static/chunks/pages/_app.js',
  '/_next/static/chunks/pages/index.js',
  '/_next/static/css/app.css',
]

const API_CACHE_NAME = 'pilot-api-v1'
const API_ROUTES = [
  '/api/auth',
  '/api/documents',
  '/api/roles'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => 
              cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME
            )
            .map((cacheName) => caches.delete(cacheName))
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE_NAME)
        .then((cache) => cache.match('/'))
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          return fetch(request).catch(() => 
            caches.match('/offline')
          )
        })
    )
    return
  }

  // Handle API requests with network-first strategy
  if (request.url.includes('/api/') || request.url.includes('supabase.co')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful GET requests
          if (response.status === 200 && request.method === 'GET') {
            const responseClone = response.clone()
            caches.open(API_CACHE_NAME)
              .then((cache) => cache.put(request, responseClone))
          }
          return response
        })
        .catch(() => {
          // Fallback to cache for GET requests
          if (request.method === 'GET') {
            return caches.match(request)
          }
          // Return offline response for other methods
          return new Response(
            JSON.stringify({ error: 'Network unavailable' }),
            { 
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        })
    )
    return
  }

  // Handle static assets with cache-first strategy
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        return fetch(request).then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(request, responseClone))
          }
          return response
        })
      })
  )
})

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Retry failed document uploads or status updates
      retryFailedRequests()
    )
  }
})

async function retryFailedRequests() {
  const cache = await caches.open('failed-requests')
  const requests = await cache.keys()
  
  for (const request of requests) {
    try {
      const response = await fetch(request)
      if (response.ok) {
        await cache.delete(request)
      }
    } catch (error) {
      console.log('Retry failed:', error)
    }
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: data.url,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/view-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/dismiss-icon.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'view' && event.notification.data) {
    event.waitUntil(
      clients.openWindow(event.notification.data)
    )
  }
})