import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import phrases from '../data/ga-video-phrases.json'
import source from '../data/ga-video-phrases.source.json'
import { GA_VIDEO_PHRASES, gaVideoRecording } from './ga-video'
import { distinctQuizWords } from './game'

describe('Ga video recordings for listening games', () => {
  it('preserves the source text, meaning and timing for every released clip', () => {
    expect(phrases).toHaveLength(source.phrases.length)
    expect(new Set(phrases.map((phrase) => phrase.id)).size).toBe(phrases.length)
    expect(new Set(source.phrases.map((phrase) => phrase.source)).size).toBe(5)
    for (const phrase of phrases) {
      const original = source.phrases.find((item) => item.id === phrase.id)!
      const video = source.sources.find((item) => item.key === original.source)!
      expect(phrase.word).toBe(original.word)
      expect(phrase.translation).toBe(original.translation)
      expect(phrase.startSeconds).toBe(original.startSeconds)
      expect(phrase.endSeconds).toBe(original.endSeconds)
      expect(phrase.sourceVideo).toBe(video.file)
      expect(phrase.attribution).toBe(video.attribution)
      expect(phrase.startSeconds).toBeGreaterThanOrEqual(0)
      expect(phrase.endSeconds).toBeGreaterThan(phrase.startSeconds)
      expect(phrase.endSeconds).toBeLessThan(video.durationSeconds)
      expect(phrase.endSeconds - phrase.startSeconds).toBeLessThanOrEqual(30)
    }
  })

  it('loads the matching bundled audio and rejects changed transcripts', () => {
    expect(gaVideoRecording('missing', 'missing')).toBeUndefined()
    for (const phrase of phrases) {
      const bytes = readFileSync(new URL(`../../public${phrase.audio}`, import.meta.url))
      expect(bytes.length, phrase.audio).toBe(phrase.bytes)
      expect(createHash('sha256').update(bytes).digest('hex'), phrase.audio).toBe(phrase.sha256)
      expect(gaVideoRecording(phrase.id, phrase.word)).toBe(phrase)
      expect(gaVideoRecording(phrase.id, `${phrase.word} changed`)).toBeUndefined()
    }
  })

  it('provides four distinguishable answer choices for every Ga recording', () => {
    for (const entry of GA_VIDEO_PHRASES) {
      expect(entry.language).toBe('ga')
      expect(entry.reviewStatus).toBe('needs-review')
      const options = distinctQuizWords([entry, ...GA_VIDEO_PHRASES]).slice(0, 4)
      expect(options).toHaveLength(4)
      expect(options[0]).toBe(entry)
      expect(new Set(options.map((option) => option.translation.toLocaleLowerCase())).size).toBe(4)
    }
  })
})
