import { afterEach, describe, expect, it, vi } from 'vitest'
import { completeSession, EMPTY_PROGRESS, loadState } from './progress'
import { dueWords, isRecallCorrect, learningCounts, memoryFor, memoryStage } from './learning'
import { COURSE_WORDS, lessonsFor, lessonUnlocked, lessonWords, nextLesson } from '../data/course'
import type { GameResult, LanguageCode, Progress } from '../types'

const date = (day: number) => new Date(2026, 0, day, 12)
const result = (correct = true, review = false): GameResult => ({ score: correct ? 1 : 0, total: 1, perfect: correct, wordIds: ['twi-akwaaba'], recall: [{ wordId: 'twi-akwaaba', correct }], review })
const introduced = () => completeSession(EMPTY_PROGRESS, result(), false, date(1))
afterEach(() => vi.unstubAllGlobals())

describe('memory that reflects delayed recall', () => {
  it('introduces puzzle words without calling them remembered', () => {
    const progress = completeSession(EMPTY_PROGRESS, { score: 1, total: 1, perfect: true, wordIds: ['twi-akwaaba'] }, false, date(1))
    expect(memoryStage(progress.memory?.['twi-akwaaba'])).toBe('introduced')
    expect(progress.memory?.['twi-akwaaba'].dueOn).toBe('2026-01-02')
    expect(dueWords(COURSE_WORDS, progress, '2026-01-01')).toEqual([])
  })

  it('keeps immediate lesson success as practice, including repeated lessons', () => {
    let progress = introduced()
    for (let i = 0; i < 5; i++) progress = completeSession(progress, result(), false, date(1))
    expect(memoryStage(progress.memory?.['twi-akwaaba'])).toBe('practising')
    expect(progress.memory?.['twi-akwaaba'].successfulReviews).toBe(0)
    expect(progress.memory?.['twi-akwaaba'].dueOn).toBe('2026-01-02')
  })

  it('requires three due reviews on separate days to remember a word', () => {
    let progress = introduced()
    progress = completeSession(progress, result(true, true), false, date(2))
    expect(progress.memory?.['twi-akwaaba'].successfulReviews).toBe(1)
    expect(progress.memory?.['twi-akwaaba'].dueOn).toBe('2026-01-05')
    progress = completeSession(progress, result(true, true), false, date(2))
    expect(progress.memory?.['twi-akwaaba'].successfulReviews).toBe(1)
    progress = completeSession(progress, result(true, true), false, date(5))
    expect(progress.memory?.['twi-akwaaba'].dueOn).toBe('2026-01-12')
    progress = completeSession(progress, result(true, true), false, date(12))
    expect(memoryStage(progress.memory?.['twi-akwaaba'])).toBe('remembered')
    expect(progress.memory?.['twi-akwaaba'].reviewCount).toBe(3)
    expect(learningCounts(COURSE_WORDS, progress).remembered).toBe(1)
  })

  it('does not postpone due dates or promote early practice', () => {
    const progress = completeSession(introduced(), result(true, true), false, date(2))
    const early = completeSession(progress, result(true, true), false, date(3))
    expect(early.memory?.['twi-akwaaba'].dueOn).toBe('2026-01-05')
    expect(early.memory?.['twi-akwaaba'].successfulReviews).toBe(1)
    const lesson = completeSession(progress, result(), false, date(5))
    expect(lesson.memory?.['twi-akwaaba'].successfulReviews).toBe(1)
    expect(lesson.memory?.['twi-akwaaba'].dueOn).toBe('2026-01-05')
  })

  it('brings misses back tomorrow and does not erase a miss with a same-session retry', () => {
    let progress = completeSession(introduced(), result(true, true), false, date(2))
    const retry = { ...result(true, true), recall: [{ wordId: 'twi-akwaaba', correct: false }, { wordId: 'twi-akwaaba', correct: true }] }
    progress = completeSession(progress, retry, false, date(5))
    expect(progress.memory?.['twi-akwaaba'].successfulReviews).toBe(0)
    expect(progress.memory?.['twi-akwaaba'].dueOn).toBe('2026-01-06')
  })

  it('keeps queues separated by language and sorted by oldest due date', () => {
    const progress: Progress = { ...introduced(), masteredWords: ['twi-akwaaba', 'fante-akwaaba', 'kasem-dinle'], lastPlayed: '2025-12-30' }
    const due = dueWords(COURSE_WORDS.filter((word) => word.language === 'twi'), progress, '2026-01-02')
    expect(due.map((entry) => entry.id)).toEqual(['twi-akwaaba'])
    expect(dueWords(COURSE_WORDS, progress, '2026-01-02').map((entry) => entry.id)).toEqual(['fante-akwaaba', 'kasem-dinle', 'twi-akwaaba'])
  })

  it('migrates existing saves without inventing mastery or resetting rewards', () => {
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({ profile: { name: 'Ama', language: 'fante', dailyGoal: 5, level: 'beginner' }, progress: { ...EMPTY_PROGRESS, memory: undefined, xp: 700, stars: 12, streak: 4, sessions: 20, masteredWords: ['fante-akwaaba'], lastPlayed: '2026-01-01' } }) })
    const saved = loadState()
    expect(saved.progress.xp).toBe(700)
    expect(saved.progress.stars).toBe(12)
    expect(saved.progress.sessions).toBe(20)
    expect(saved.progress.masteredWords).toEqual(['fante-akwaaba'])
    expect(memoryStage(memoryFor(saved.progress)['fante-akwaaba'])).toBe('introduced')
    expect(saved.progress.memory?.['fante-akwaaba'].dueOn).toBe('2026-01-01')
  })

  it('keeps calendar intervals correct across month and year boundaries', () => {
    const progress = completeSession(EMPTY_PROGRESS, result(), false, new Date(2026, 11, 31, 23, 59))
    expect(progress.memory?.['twi-akwaaba'].dueOn).toBe('2027-01-01')
  })

  it('accepts harmless punctuation and spacing without merging distinct language letters', () => {
    expect(isRecallCorrect('  WO ho te sɛn! ', 'Wo ho te sɛn?')).toBe(true)
    expect(isRecallCorrect('ɔdɔ', 'odo')).toBe(false)
    expect(isRecallCorrect('dɩnle', 'dinle')).toBe(false)
    expect(isRecallCorrect('jiŋa', 'jinga')).toBe(false)
  })
})

describe.each<LanguageCode>(['twi', 'fante', 'kasem'])('%s course progression', (language) => {
  it('has twenty complete lessons in four chapters using only its own content', () => {
    const lessons = lessonsFor(language)
    expect(lessons).toHaveLength(20)
    expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(20)
    expect(lessons.filter((lesson) => lesson.checkpoint)).toHaveLength(4)
    for (let chapter = 0; chapter < 4; chapter++) expect(lessons.filter((lesson) => lesson.chapter === chapter)).toHaveLength(5)
    for (const lesson of lessons) {
      expect(lesson.wordIds.length).toBeGreaterThanOrEqual(3)
      expect(lesson.wordIds).toContain(lesson.mission.wordId)
      expect(lessonWords(lesson).every((entry) => entry.language === language && entry.reviewStatus === 'needs-review')).toBe(true)
    }
  })

  it('unlocks every lesson in order and preserves completion on replay', () => {
    const lessons = lessonsFor(language)
    let progress = { ...EMPTY_PROGRESS }
    expect(lessonUnlocked(lessons[1], progress, language)).toBe(false)
    for (const lesson of lessons) {
      expect(nextLesson(progress, language)?.id).toBe(lesson.id)
      expect(lessonUnlocked(lesson, progress, language)).toBe(true)
      progress = completeSession(progress, { score: 1, total: 3, perfect: false, wordIds: lesson.wordIds, lessonId: lesson.id }, false, date(1))
    }
    expect(nextLesson(progress, language)).toBeUndefined()
    const replay = completeSession(progress, { ...result(), wordIds: lessons[0].wordIds, lessonId: lessons[0].id }, false, date(3))
    expect(replay.lessons?.[lessons[0].id]).toEqual(progress.lessons?.[lessons[0].id])
    const other = language === 'twi' ? 'fante' : 'twi'
    expect(nextLesson(progress, other)?.id).toBe(lessonsFor(other)[0].id)
  })
})
