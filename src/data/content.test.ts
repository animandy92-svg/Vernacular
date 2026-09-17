import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { FALLBACK_WORDS, getWords } from './content'
import workbook from './twi-everyday.json'
import { distinctQuizWords, letterPuzzleWords, normalizeWord } from '../lib/game'

const pair = (word: string, translation: string) => `${normalizeWord(word)}\u0000${normalizeWord(translation)}`

describe('Twi workbook import', () => {
  it('represents every source pair without losing the original packs or progress IDs', () => {
    const twi = getWords('twi')
    const pairs = new Set(twi.map((entry) => pair(entry.word, entry.translation)))
    expect(workbook.rows).toHaveLength(3000)
    expect(twi).toHaveLength(3010)
    expect(pairs.size).toBe(twi.length)
    for (const [, english, spelling] of workbook.rows) expect(pairs.has(pair(String(spelling), String(english)))).toBe(true)
    expect(twi.find((entry) => entry.word === 'akwaaba' && entry.translation === 'welcome')?.id).toBe('twi-akwaaba')
    expect(getWords('fante')).toHaveLength(24)
    expect(getWords('kasem')).toHaveLength(33)
    expect(new Set(FALLBACK_WORDS.map((entry) => entry.id)).size).toBe(FALLBACK_WORDS.length)
  })

  it('retains Unicode, distinct senses and source provenance without inventing guides', () => {
    const twi = getWords('twi')
    expect(twi.filter((entry) => entry.word === 'ɔno').map((entry) => entry.translation)).toEqual(['he', 'she'])
    const imported = twi.filter((entry) => entry.source)
    expect(imported).toHaveLength(2986)
    for (const entry of imported) {
      const source = workbook.rows[entry.sourceRow! - 2]
      expect([entry.translation, entry.word, entry.category]).toEqual(source.slice(1))
      expect(entry.phonetic).toBe('')
      expect(entry.example).toBe('')
      expect(entry.reviewStatus).toBe('needs-review')
    }
  })

  it('keeps long expressions and alternate spellings out of letter puzzles', () => {
    const words = letterPuzzleWords(getWords('twi'), 8)
    expect(words.length).toBeGreaterThan(100)
    for (const entry of words) {
      expect(entry.word).toMatch(/^\p{L}+$/u)
      expect(Array.from(entry.word).length).toBeLessThanOrEqual(8)
    }
    expect(new Set(words.map((entry) => normalizeWord(entry.word))).size).toBe(words.length)
  })

  it('excludes ambiguous duplicate answers while retaining the requested correct answer', () => {
    const sameSpelling = getWords('twi').filter((entry) => entry.word === 'ɔno')
    const sameMeaning = getWords('twi').filter((entry) => entry.translation === 'home')
    const selected = sameSpelling[1]
    const choices = distinctQuizWords([selected, ...sameSpelling, ...sameMeaning])
    expect(choices[0]).toBe(selected)
    expect(choices.filter((entry) => entry.word === 'ɔno')).toHaveLength(1)
    expect(choices.filter((entry) => entry.translation === 'home')).toHaveLength(1)
  })

  it('publishes the same additions without touching existing words or leaderboard data', () => {
    const output = execFileSync(process.execPath, ['--experimental-strip-types', 'scripts/seed-firestore.cjs', '--language=twi', '--import-only', '--content-only', '--dry-run'], { encoding: 'utf8' })
    const plan = JSON.parse(output)
    expect(plan.words).toBe(2986)
    expect(plan.languages).toHaveLength(1)
    expect(plan.languages[0]).toMatchObject({ id: 'twi', wordCount: 3010 })
    expect(plan.leaderboard).toBe(0)
  })
})
