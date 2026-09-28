/* global self, caches, fetch, URL, Response */

const CACHE_NAME = 'sabisafe-shell-v8'
const SHELL_URLS = [
  '/',
  '/manifest.webmanifest',
  '/icons/sabisafe.svg',
  '/icons/sabisafe-192.png',
  '/icons/sabisafe-512.png',
  '/icons/sabisafe-maskable-512.png',
  '/icons/sabisafe-180.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME)
    const response = await fetch('/')
    const markup = await response.clone().text()
    const assets = [...markup.matchAll(/(?:src|href)="([^"#]+)"/g)]
      .map((match) => match[1])
      .filter((path) => path?.startsWith('/'))
    await cache.put('/', response)
    await cache.addAll([...new Set([...SHELL_URLS.slice(1), ...assets])])
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((key) => key.startsWith('sabisafe-') && key !== CACHE_NAME).map((key) => caches.delete(key)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request)
        const cache = await caches.open(CACHE_NAME)
        await cache.put('/', response.clone())
        return response
      } catch {
        return (await caches.match('/')) || Response.error()
      }
    })())
    return
  }

  event.respondWith((async () => {
    const cached = await caches.match(request)
    if (cached) return cached
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      await cache.put(request, response.clone())
    }
    return response
  })())
})
