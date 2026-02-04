const CACHE_NAME = 'handyconnect-v1';
const OFFLINE_URL = '/offline.html';

// Install event: precache app shell and offline fallback
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      
      // Cache the offline fallback page
      await cache.add(new Request(OFFLINE_URL, { cache: 'reload' }));
      
      // Fetch and parse index.html to discover assets
      try {
        const indexResponse = await fetch('/', { cache: 'reload' });
        const indexHtml = await indexResponse.text();
        
        // Cache index.html
        await cache.put('/', new Response(indexHtml, {
          headers: indexResponse.headers
        }));
        
        // Extract and cache script and link resources
        const scriptMatches = indexHtml.matchAll(/<script[^>]+src=["']([^"']+)["']/g);
        const linkMatches = indexHtml.matchAll(/<link[^>]+href=["']([^"']+)["']/g);
        
        const resourcesToCache = [];
        
        for (const match of scriptMatches) {
          resourcesToCache.push(match[1]);
        }
        
        for (const match of linkMatches) {
          const href = match[1];
          // Cache stylesheets and icons
          if (href.endsWith('.css') || href.includes('icon') || href.includes('manifest')) {
            resourcesToCache.push(href);
          }
        }
        
        // Cache discovered resources
        await Promise.allSettled(
          resourcesToCache.map(url => 
            cache.add(new Request(url, { cache: 'reload' }))
              .catch(err => console.warn(`Failed to cache ${url}:`, err))
          )
        );
      } catch (error) {
        console.error('Failed to precache app shell:', error);
      }
      
      // Activate immediately
      self.skipWaiting();
    })()
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
      
      // Take control immediately
      await self.clients.claim();
    })()
  );
});

// Fetch event: serve from cache, fallback to network, handle offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    (async () => {
      try {
        // Try cache first for all requests
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Try network
        const networkResponse = await fetch(event.request);
        
        // Cache successful responses for static assets
        if (networkResponse.ok && 
            (event.request.url.includes('/assets/') || 
             event.request.url.includes('.js') || 
             event.request.url.includes('.css'))) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }
        
        return networkResponse;
      } catch (error) {
        // Network failed, we're offline
        
        // For navigation requests, serve cached index.html (SPA fallback)
        if (event.request.mode === 'navigate') {
          const cachedIndex = await caches.match('/');
          if (cachedIndex) {
            return cachedIndex;
          }
          
          // If index.html is not cached, serve offline page
          const offlinePage = await caches.match(OFFLINE_URL);
          if (offlinePage) {
            return offlinePage;
          }
        }
        
        // For other requests, try to serve offline page
        const offlinePage = await caches.match(OFFLINE_URL);
        if (offlinePage) {
          return offlinePage;
        }
        
        // Last resort: return a basic offline response
        return new Response('Offline - Please check your connection', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      }
    })()
  );
});
