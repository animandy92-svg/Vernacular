import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import phrases from '../data/twi-video-phrases.json'
import source from '../data/twi-video-phrases.source.json'
import { TWI_VIDEO_PHRASES, twiVideoRecording, type TwiVideoPhrase } from './twi-video'

describe('LearnAkan Twi game clips', () => {
  it('contains one ordered clip for each supplied phrase', () => {
    const recordings = phrases as TwiVideoPhrase[]
    expect(recordings.map((item) => item.number)).toEqual(Array.from({ length: 300 }, (_, index) => index + 1))
    expect(recordings.map(({ number, word, translation, sourceVideo, startSeconds, endSeconds }) =>
      ({ number, word, translation, sourceVideo, startSeconds, endSeconds }))).toEqual(source)
    expect(TWI_VIDEO_PHRASES).toHaveLength(300)
    expect(new Set(recordings.map((item) => item.audio)).size).toBe(300)
    for (const item of recordings) {
      expect(item.word.trim()).not.toBe('')
      expect(item.translation.trim()).not.toBe('')
      expect(item.endSeconds).toBeGreaterThan(item.startSeconds)
      expect(item.endSeconds - item.startSeconds).toBeLessThanOrEqual(20)
    }
  })

  it('links each phrase to its matching bundled audio file', () => {
    for (const [index, item] of (phrases as TwiVideoPhrase[]).entries()) {
      const bytes = readFileSync(new URL(`../../public${item.audio}`, import.meta.url))
      expect(bytes.length, item.audio).toBe(item.bytes)
      expect(createHash('sha256').update(bytes).digest('hex'), item.audio).toBe(item.sha256)
      const entry = TWI_VIDEO_PHRASES[index]
      expect(twiVideoRecording(entry.id, entry.word)).toBe(item)
      expect(twiVideoRecording(entry.id, `${entry.word} changed`)).toBeUndefined()
    }
  })
})
