import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { COURSE_WORD_MAP } from '../data/course'
import { NATIVE_AUDIO, nativeRecording } from './audio'

describe('native audio release integrity', () => {
  it('does not claim a recording is available when it has not been supplied', () => {
    expect(nativeRecording('missing-entry', 'anything')).toBeUndefined()
  })
  it('requires matching text, speaker review and bundled files for every recording', () => {
    for (const [id, recording] of Object.entries(NATIVE_AUDIO)) {
      const entry = COURSE_WORD_MAP.get(id)
      expect(entry, `Unknown recorded expression ${id}`).toBeDefined()
      expect(nativeRecording(id, entry!.word)).toBe(recording)
      expect(nativeRecording(id, 'changed transcript')).toBeUndefined()
      for (const path of [recording.normal, recording.slow].filter(Boolean)) {
        expect(existsSync(new URL(`../../public${path}`, import.meta.url)), `Missing recording ${path}`).toBe(true)
      }
    }
  })
})
