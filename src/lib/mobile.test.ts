import { afterEach, describe, expect, it, vi } from 'vitest'
import { completeSession, currentStreak, dateKey, EMPTY_PROGRESS, loadState, saveState, weeklyActivity } from './progress'
import { seededRandom, shuffle, wordsForLevel } from './game'
import { FALLBACK_WORDS } from '../data/content'

const result = { score: 3, total: 3, wordIds: ['twi-fie'], perfect: true }
afterEach(() => vi.unstubAllGlobals())

describe('daily learning continuity', () => {
  it('uses the local calendar around midnight', () => {
    expect(dateKey(new Date(2026, 8, 14, 0, 15))).toBe('2026-09-14')
    expect(dateKey(new Date(2026, 8, 14, 23, 55))).toBe('2026-09-14')
  })

  it('counts same-day puzzles once each without inflating the streak', () => {
    const now = new Date(2026, 8, 14, 12)
    const first = completeSession(EMPTY_PROGRESS, result, true, now)
    const second = completeSession(first, result, false, now)
    expect(second.activity?.['2026-09-14']).toBe(2)
    expect(second.streak).toBe(1)
    expect(second.sessions).toBe(2)
    expect(second.masteredWords).toEqual(['twi-fie'])
    expect(second.dailyCompleted).toBe('2026-09-14')
  })

  it('rolls over the goal and retains yesterday’s streak', () => {
    const first = completeSession(EMPTY_PROGRESS, result, false, new Date(2026, 8, 13, 23, 59))
    const now = new Date(2026, 8, 14, 0, 1)
    expect(currentStreak(first, now)).toBe(1)
    expect(weeklyActivity(first, now).at(-1)?.count).toBe(0)
    const next = completeSession(first, result, false, now)
    expect(next.streak).toBe(2)
    expect(next.activity?.['2026-09-14']).toBe(1)
  })

  it('shows an expired streak correctly and restarts after a gap', () => {
    const old = { ...EMPTY_PROGRESS, lastPlayed: '2026-09-11', streak: 7 }
    const now = new Date(2026, 8, 14, 12)
    expect(currentStreak(old, now)).toBe(0)
    const restarted = completeSession(old, result, false, now)
    expect(restarted.streak).toBe(1)
    expect(restarted.bestStreak).toBe(7)
  })

  it('keeps only the recent activity window while retaining lifetime progress', () => {
    const old = { ...EMPTY_PROGRESS, xp: 120, activity: { '2026-08-01': 3, '2026-09-13': 2 } }
    const next = completeSession(old, result, false, new Date(2026, 8, 14, 12))
    expect(next.activity).toEqual({ '2026-09-13': 2, '2026-09-14': 1 })
    expect(next.xp).toBe(181)
  })

  it('keeps old device profiles and reports storage failures without crashing', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => JSON.stringify({ profile: { name: 'Ama', language: 'twi', level: 'beginner', dailyGoal: 3 }, progress: { sessions: 9, xp: 700 } }),
      setItem: () => { throw new Error('Storage quota exceeded') },
    })
    const state = loadState()
    expect(state.progress.sessions).toBe(9)
    expect(state.progress.activity).toEqual({})
    expect(saveState(state)).toBe(false)
  })
})

describe('lesson selection', () => {
  it('keeps daily word ordering stable for the same seed', () => {
    const words = FALLBACK_WORDS.filter((word) => word.language === 'twi')
    const first = shuffle(words, seededRandom('2026-09-14-twi')).slice(0, 3)
    expect(shuffle(words, seededRandom('2026-09-14-twi')).slice(0, 3)).toEqual(first)
    expect(shuffle(words, seededRandom('2026-09-15-twi')).slice(0, 3)).not.toEqual(first)
    expect(words).toEqual(FALLBACK_WORDS.filter((word) => word.language === 'twi'))
  })

  it('respects difficulty while keeping small packs playable', () => {
    const words = FALLBACK_WORDS.filter((word) => word.language === 'twi')
    expect(wordsForLevel(words, 'beginner').every((word) => word.difficulty === 'beginner')).toBe(true)
    expect(wordsForLevel(words, 'advanced')).toEqual(words)
    expect(wordsForLevel(words.slice(0, 2), 'beginner')).toHaveLength(2)
  })
})
