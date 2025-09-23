const CACHE_NAME = "devicehelp-v1"
const STATIC_CACHE_NAME = "devicehelp-static-v1"
const DYNAMIC_CACHE_NAME = "devicehelp-dynamic-v1"

// Critical resources to cache immediately
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/focused-phone-fix.webp",
  "/abstract-geometric-shapes.png",
  "/_next/static/css/app/layout.css",
  "/_next/static/chunks/webpack.js",
  "/_next/static/chunks/main.js",
  "/_next/static/chunks/pages/_app.js",
]

// Cache strategies for different resource types
const CACHE_STRATEGIES = {
  images: "cache-first",
  static: "cache-first",
  api: "network-first",
  pages: "stale-while-revalidate",
}

// Install event - cache critical resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_ASSETS)
      }),
      self.skipWaiting(),
    ]),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME && cacheName !== CACHE_NAME) {
              return caches.delete(cacheName)
            }
          }),
        )
      }),
      self.clients.claim(),
    ]),
  )
})

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") return

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith("http")) return

  event.respondWith(handleRequest(request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const pathname = url.pathname

  try {
    // Images - cache first strategy
    if (pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
      return await cacheFirst(request, DYNAMIC_CACHE_NAME)
    }

    // Static assets - cache first strategy
    if (
      pathname.startsWith("/_next/static/") ||
      pathname.startsWith("/static/") ||
      pathname.match(/\.(css|js|woff|woff2|ttf|eot)$/i)
    ) {
      return await cacheFirst(request, STATIC_CACHE_NAME)
    }

    // API routes - network first strategy
    if (pathname.startsWith("/api/")) {
      return await networkFirst(request, DYNAMIC_CACHE_NAME)
    }

    // Pages - stale while revalidate strategy
    return await staleWhileRevalidate(request, DYNAMIC_CACHE_NAME)
  } catch (error) {
    console.error("Service Worker fetch error:", error)
    return fetch(request)
  }
}

// Cache first strategy - good for static assets
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)

  if (cachedResponse) {
    return cachedResponse
  }

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    // Return offline fallback if available
    return new Response("Offline", { status: 503 })
  }
}

// Network first strategy - good for API calls
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    throw error
  }
}

// Stale while revalidate strategy - good for pages
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cachedResponse = await cache.match(request)

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    })
    .catch(() => cachedResponse)

  return cachedResponse || fetchPromise
}

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(handleBackgroundSync())
  }
})

async function handleBackgroundSync() {
  // Handle any queued offline actions
  console.log("Background sync triggered")
}

// Push notifications (if needed in future)
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json()
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/icon-192x192.png",
        badge: "/badge-72x72.png",
      }),
    )
  }
})
