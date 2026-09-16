import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'

const source = readFileSync(new URL('../public/service-worker.js', import.meta.url), 'utf8')
function worker() {
  const handlers: Record<string, (event: any) => void> = {}
  const cache = { addAll: vi.fn().mockResolvedValue(undefined), match: vi.fn().mockResolvedValue(undefined) }
  const caches = { open: vi.fn().mockResolvedValue(cache), keys: vi.fn().mockResolvedValue(['another-app-v1', 'vernacular-v3', 'vernacular-development']), delete: vi.fn().mockResolvedValue(true) }
  const fetch = vi.fn().mockResolvedValue(new Response('network'))
  const claim = vi.fn().mockResolvedValue(undefined)
  runInNewContext(source, { self: { addEventListener: (name: string, handler: any) => { handlers[name] = handler }, location: { origin: 'https://local.test' }, clients: { claim } }, caches, fetch, URL, Response })
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
