const CACHE_NAME = 'admin-pwa-cache-v3'; // ¡Incrementamos la versión a v3!
const urlsToCache = [
    // Estáticos de la raíz
    "/",
    "/index.html",
    "/index.css", // Añadido
    "/App.css",   // Añadido, si este también contiene estilos críticos
    "/main.js", // Corregido a .js (asumo que Vite lo renombra a main.js o similar)
    // Iconos
    "/icons/icon192x192.png",
    "/icons/icon512x512.png",
    "/manifest.json", // Es importante cachear el manifiesto
];

// 1. INSTALACIÓN: Almacenar archivos estáticos críticos (App Shell)
self.addEventListener('install', (event) => {
    // CORRECCIÓN: 'waitUntil'
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Service Worker: Archivos estáticos cacheados (v3)');
            return cache.addAll(urlsToCache).catch(error => {
                console.error('Fallo al cachear:', error);
            });
        })
    );
});

// 2. ACTIVACIÓN: Limpiar cachés antiguas para que la nueva versión funcione
self.addEventListener("activate", (event) => {
    // CORRECCIÓN: 'waitUntil' y corrección de la variable 'cacheNames'.
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Eliminando caché antigua', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 3. RECUPERACIÓN (FETCH): Interceptar peticiones para servir desde caché
self.addEventListener('fetch', (event) => {
    // Estrategia: Cache-First (Para la App Shell)
    const requestUrl = new URL(event.request.url);

    // Ignorar peticiones a APIs (que serán manejadas por tu lógica sync.ts)
    if (requestUrl.pathname.startsWith('/api/') || event.request.method !== 'GET') {
        return; 
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            // 1. Devolver de caché si existe.
            if (response) {
                return response;
            }
            
            // 2. Si no, ir a la red y almacenar una copia si es exitoso.
            return fetch(event.request).then((networkResponse) => {
                // Comprobar si recibimos una respuesta válida (código 200) y si es una petición GET
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }
                
                // Clonar la respuesta porque el stream se consume al devolverla.
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;

            }).catch(() => {
                // Fallback si la red falla (e.g., para imágenes o assets no cacheados)
                // Aquí podrías servir una página o imagen de 'offline' si lo deseas.
                console.log('Fallo de red para:', event.request.url);
            });
        })
    );
});