import { describe, expect, it } from 'vitest'
import { FALLBACK_WORDS } from '../data/content'
import { areAdjacent, generateWordGrid, normalizeWord, scramble, samePath } from './game'
import { completeSession, levelFromXp } from './progress'

describe('game helpers', () => {
  it('scrambles without changing the available letters', () => {
    const mixed = scramble('akwaaba', () => 0.2)
    expect([...mixed].sort()).toEqual(Array.from(normalizeWord('akwaaba')).sort())
    expect(mixed.join('')).not.toBe(normalizeWord('akwaaba'))
  })

  it('places requested words into a bounded grid', () => {
    const result = generateWordGrid(FALLBACK_WORDS.slice(0, 3), 8, () => 0.37)
    expect(result.grid).toHaveLength(8)
    expect(result.grid.every((row) => row.length === 8)).toBe(true)
    expect(result.placements.length).toBeGreaterThan(0)
    result.placements.forEach((placement) => {
      expect(placement.cells.every((cell) => cell.row < 8 && cell.col < 8)).toBe(true)
    })
  })

  it('recognizes adjacent cells and reversible paths', () => {
    const path = [{ row: 0, col: 0 }, { row: 1, col: 1 }]
    expect(areAdjacent(path[0], path[1])).toBe(true)
    expect(samePath(path, [...path].reverse())).toBe(false)
  })
})

describe('progress helpers', () => {
  it('awards XP and begins a streak after a completed session', () => {
    const next = completeSession(
      { xp: 0, streak: 0, lastPlayed: null, sessions: 0, masteredWords: [], dailyCompleted: null, perfectRounds: 0 },
      { score: 3, total: 3, wordIds: ['twi-fie'], perfect: true },
      true,
      new Date('2026-09-06T12:00:00Z'),
    )
    expect(next.xp).toBe(61)
    expect(next.streak).toBe(1)
    expect(next.dailyCompleted).toBe('2026-09-06')
  })

  it('calculates level progress', () => {
    expect(levelFromXp(0).level).toBe(1)
    expect(levelFromXp(180).level).toBe(2)
  })
})
