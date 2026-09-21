import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'

const source = readFileSync(new URL('../public/service-worker.js', import.meta.url), 'utf8')
function worker(media = false) {
  const handlers: Record<string, (event: any) => void> = {}
  const cache = { addAll: vi.fn().mockResolvedValue(undefined), match: vi.fn().mockResolvedValue(undefined), keys: vi.fn().mockResolvedValue([]), delete: vi.fn().mockResolvedValue(true) }
  const caches = { open: vi.fn().mockResolvedValue(cache), keys: vi.fn().mockResolvedValue(['another-app-v1', 'vernacular-v3', 'vernacular-development']), delete: vi.fn().mockResolvedValue(true) }
  const fetch = vi.fn().mockResolvedValue(new Response('network'))
  const claim = vi.fn().mockResolvedValue(undefined)
  runInNewContext(media ? source.replace('const LESSON_MEDIA = []', 'const LESSON_MEDIA = ["/media/twi/test.mp4"]') : source, { self: { addEventListener: (name: string, handler: any) => { handlers[name] = handler }, location: { origin: 'https://local.test' }, clients: { claim } }, caches, fetch, URL, Response, Headers })
  return { handlers, cache, caches, fetch, claim }
}

describe('offline application shell', () => {
  it('installs the complete core before activation', async () => {
    const { handlers, cache } = worker()
    let finished: Promise<void> | undefined
    handlers.install({ waitUntil: (promise: Promise<void>) => { finished = promise } })
    await finished
    expect(cache.addAll).toHaveBeenCalledWith(['/', '/manifest.webmanifest', '/icon.svg'])
  })

  it('only removes old caches owned by Vernacular', async () => {
    const { handlers, caches, claim } = worker()
    let finished: Promise<void> | undefined
    handlers.activate({ waitUntil: (promise: Promise<void>) => { finished = promise } })
    await finished
    expect(caches.delete).toHaveBeenCalledExactlyOnceWith('vernacular-v3')
    expect(claim).toHaveBeenCalledOnce()
  })

  it('serves a navigation offline from the installed shell', async () => {
    const { handlers, cache, fetch } = worker()
    cache.match.mockResolvedValue(new Response('offline app'))
    let response: Promise<Response> | undefined
    handlers.fetch({ request: { url: 'https://local.test/', method: 'GET', mode: 'navigate' }, respondWith: (value: Promise<Response>) => { response = value } })
    expect(await (await response)!.text()).toBe('offline app')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('leaves cloud data and requests outside the app shell alone', () => {
    const { handlers } = worker()
    const respondWith = vi.fn()
    handlers.fetch({ request: { url: 'https://firestore.googleapis.com/data', method: 'GET' }, respondWith })
    handlers.fetch({ request: { url: 'https://local.test/api/data', method: 'GET' }, respondWith })
    handlers.fetch({ request: { url: 'https://local.test/', method: 'POST' }, respondWith })
    expect(respondWith).not.toHaveBeenCalled()
  })

  it('never returns HTML for a missing offline asset', async () => {
    const { handlers, fetch } = worker()
    fetch.mockRejectedValue(new Error('offline'))
    let response: Promise<Response> | undefined
    handlers.fetch({ request: { url: 'https://local.test/icon.svg', method: 'GET' }, respondWith: (value: Promise<Response>) => { response = value } })
    expect((await response)!.type).toBe('error')
  })
})

describe('offline listening media', () => {
  async function rangeResponse(range?: string) {
    const { handlers, cache, fetch } = worker(true)
    cache.match.mockResolvedValue(new Response('0123456789', { headers: { 'Content-Type': 'video/mp4' } }))
    let response: Promise<Response> | undefined
    handlers.fetch({
      request: { url: 'https://local.test/media/twi/test.mp4', method: 'GET', headers: new Headers(range ? { Range: range } : {}) },
      respondWith: (value: Promise<Response>) => { response = value },
    })
    const result = await response!
    expect(fetch).not.toHaveBeenCalled()
    return result
  }

  it('serves saved media completely or by byte range for seeking', async () => {
    const complete = await rangeResponse()
    expect(complete.status).toBe(200)
    expect(await complete.text()).toBe('0123456789')
    const partial = await rangeResponse('bytes=2-5')
    expect(partial.status).toBe(206)
    expect(partial.headers.get('Content-Range')).toBe('bytes 2-5/10')
    expect(partial.headers.get('Content-Length')).toBe('4')
    expect(await partial.text()).toBe('2345')
    expect(await (await rangeResponse('bytes=7-')).text()).toBe('789')
    expect(await (await rangeResponse('bytes=-3')).text()).toBe('789')
    expect(await (await rangeResponse('bytes=8-99')).text()).toBe('89')
  })

  it('rejects malformed and unsatisfiable ranges without sending the wrong bytes', async () => {
    for (const value of ['bytes=99-', 'bytes=6-2', 'bytes=-0', 'bytes=-', 'bytes=0-1,3-4']) {
      const result = await rangeResponse(value)
      expect(result.status).toBe(416)
      expect(result.headers.get('Content-Range')).toBe('bytes */10')
    }
  })

  it('preserves the listening cache on shell updates and removes obsolete lesson files', async () => {
    const { handlers, cache, caches } = worker(true)
    caches.keys.mockResolvedValue(['vernacular-old', 'vernacular-listening-v1', 'vernacular-development'])
    cache.keys.mockResolvedValue([{ url: 'https://local.test/media/twi/test.mp4' }, { url: 'https://local.test/media/twi/old.mp4' }])
    let finished: Promise<void> | undefined
    handlers.activate({ waitUntil: (promise: Promise<void>) => { finished = promise } })
    await finished
    expect(caches.delete).toHaveBeenCalledExactlyOnceWith('vernacular-old')
    expect(cache.delete).toHaveBeenCalledExactlyOnceWith({ url: 'https://local.test/media/twi/old.mp4' })
  })
})
