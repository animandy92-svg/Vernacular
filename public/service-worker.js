const CACHE = 'vernacular-development'
const CORE = ['/', '/manifest.webmanifest', '/icon.svg']
const MEDIA_CACHE = 'vernacular-listening-v1'
const LESSON_MEDIA = []

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((key) => key.startsWith('vernacular-') && key !== CACHE && key !== MEDIA_CACHE).map((key) => caches.delete(key)))
    const media = await caches.open(MEDIA_CACHE)
    for (const request of await media.keys()) {
      if (!LESSON_MEDIA.includes(new URL(request.url).pathname)) await media.delete(request)
    }
    await self.clients.claim()
  })())
})

// Browsers and Android seek using byte ranges. Cache Storage keeps whole files,
// so construct the requested range when a lesson has been saved for offline use.
async function mediaResponse(request, cached) {
  const range = request.headers.get('range')
  if (!range) return cached
  const blob = await cached.blob()
  const match = /^bytes=(\d*)-(\d*)$/.exec(range)
  const invalid = () => new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${blob.size}` } })
  if (!match || (!match[1] && !match[2])) return invalid()
  const start = match[1] ? Number(match[1]) : Math.max(0, blob.size - Number(match[2]))
  const end = match[1] && match[2] ? Math.min(Number(match[2]), blob.size - 1) : blob.size - 1
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= blob.size) return invalid()
  const headers = new Headers(cached.headers)
  headers.delete('Content-Encoding')
  headers.set('Content-Type', blob.type || 'video/mp4')
  headers.set('Content-Range', `bytes ${start}-${end}/${blob.size}`)
  headers.set('Content-Length', String(end - start + 1))
  headers.set('Accept-Ranges', 'bytes')
  return new Response(blob.slice(start, end + 1), { status: 206, headers })
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  const navigation = request.mode === 'navigate'
  const media = LESSON_MEDIA.includes(url.pathname)
  // Keep the app install small. Lessons are bundled in Android and saved on
  // demand on the web, so a failed large download cannot break shell updates.
  if (!navigation && !CORE.includes(url.pathname) && !media) return
  event.respondWith((async () => {
    const cache = await caches.open(media ? MEDIA_CACHE : CACHE)
    const cached = await cache.match(navigation ? '/' : url.pathname)
    if (cached) return media ? mediaResponse(request, cached) : cached
    try { return await fetch(request) }
    catch { return Response.error() }
  })())
})
