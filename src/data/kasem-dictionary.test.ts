import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import dictionary from './kasem-dictionary.json'
import { FALLBACK_WORDS, getWords } from './content'
import { distinctQuizWords, letterPuzzleWords, normalizeWord } from '../lib/game'

describe('Kasem dictionary import', () => {
  it('preserves all source rows, Unicode, source IDs and original progress IDs', () => {
    expect(dictionary.rows).toHaveLength(339)
    const words = getWords('kasem')
    expect(words).toHaveLength(372)
    expect(words.find((entry) => entry.id === 'kasem-dinle')?.word).toBe('dɩnle')
    for (const row of dictionary.rows) {
      const entry = words.find((word) => word.sourceEntryId === row.values[16])
      expect(entry).toMatchObject({
        word: row.values[1], translation: row.values[2], sourceRow: row.sourceRow,
        dialect: row.values[4] ?? '', example: row.values[8] ?? '',
        exampleTranslation: row.values[9] ?? '', reviewStatus: 'needs-review',
      })
      expect(entry?.phonetic).not.toBe('Audio not available yet')
    }
    expect(new Set(FALLBACK_WORDS.map((word) => word.id)).size).toBe(FALLBACK_WORDS.length)
  })

  it('keeps tone markers and alternate spellings intact while generating unambiguous games', () => {
    const words = getWords('kasem')
    expect(words.some((word) => word.word === 'zwɛ¹' && word.translation === 'ear')).toBe(true)
    expect(words.some((word) => word.word === 'zwɛ²' && word.translation === 'burn / set fire to')).toBe(true)
    const choices = distinctQuizWords(words)
    expect(new Set(choices.map((word) => normalizeWord(word.word))).size).toBe(choices.length)
    expect(new Set(choices.map((word) => normalizeWord(word.translation))).size).toBe(choices.length)
    for (const entry of letterPuzzleWords(words, 8)) expect(entry.word.normalize('NFC')).toMatch(/^\p{L}+$/u)
  })

  it('seeds only imported Kasem entries and the language count without touching leaderboard data', () => {
    const result = execFileSync(process.execPath, ['--experimental-strip-types', 'scripts/seed-firestore.cjs', '--language=kasem', '--import-only', '--content-only', '--dry-run'], { encoding: 'utf8' })
    expect(JSON.parse(result)).toMatchObject({ words: 339, leaderboard: 0, languages: [{ id: 'kasem', wordCount: 372 }] })
  })
})
