import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatListeningTime, readListeningPosition, saveListeningPosition, TWI_LISTENING_LESSONS } from './listening'

afterEach(() => vi.unstubAllGlobals())

describe('supplied Twi lessons', () => {
  it('bundles all three recordings with matching hashes and thumbnails', () => {
    expect(TWI_LISTENING_LESSONS.map((lesson) => lesson.phraseRange)).toEqual(['1-100', '101-200', '201-300'])
    for (const lesson of TWI_LISTENING_LESSONS) {
      const bytes = readFileSync(new URL(`../../public${lesson.video}`, import.meta.url))
      expect(bytes.length).toBe(lesson.bytes)
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(lesson.sha256)
      expect(readFileSync(new URL(`../../public${lesson.poster}`, import.meta.url)).length).toBeGreaterThan(1000)
      expect(lesson.durationSeconds).toBeGreaterThan(1400)
    }
  })

  it('resumes each lesson independently without changing course progress', () => {
    const storage = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) })
    expect(saveListeningPosition('first', 123)).toBe(true)
    expect(saveListeningPosition('second', 456)).toBe(true)
    expect(readListeningPosition('first')).toBe(123)
    expect(readListeningPosition('second')).toBe(456)
    expect(storage.size).toBe(1)
    saveListeningPosition('first', 0)
    expect(readListeningPosition('first')).toBe(0)
    expect(readListeningPosition('second')).toBe(456)
  })

  it('handles damaged or unavailable storage and invalid positions', () => {
    vi.stubGlobal('localStorage', { getItem: () => '{broken', setItem: () => { throw new Error('full') } })
    expect(readListeningPosition('first')).toBe(0)
    expect(saveListeningPosition('first', 2)).toBe(false)
    vi.stubGlobal('localStorage', { getItem: () => '{"first":-1}', setItem: vi.fn() })
    expect(readListeningPosition('first')).toBe(0)
    expect(formatListeningTime(1647.92)).toBe('27:27')
  })
})
