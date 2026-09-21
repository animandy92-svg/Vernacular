import type { GameResult, Progress, WordEntry, WordMemory } from '../types'
import { dateKey, daysAfter } from './calendar'

export const REVIEW_INTERVALS = [1, 3, 7, 14, 30]

export function introducedMemory(day: string): WordMemory {
  return { introducedOn: day, dueOn: daysAfter(day, 1), lastPracticedOn: null, lastReviewedOn: null, successfulReviews: 0, reviewCount: 0, practiceCount: 0 }
}

// The old masteredWords field is an exposure history, not evidence of recall.
// Preserve it for older installs; migrate those words into an untested review queue.
export function memoryFor(progress: Progress): Record<string, WordMemory> {
  const memory = { ...progress.memory }
  for (const id of progress.masteredWords) {
    if (!memory[id]) memory[id] = { ...introducedMemory(progress.lastPlayed ?? '1970-01-01'), dueOn: progress.lastPlayed ?? '1970-01-01' }
  }
  return memory
}

export function memoryStage(memory?: WordMemory) {
  if (!memory) return 'new'
  if (memory.successfulReviews >= 3) return 'remembered'
  return memory.practiceCount ? 'practising' : 'introduced'
}

export function recordLearning(progress: Progress, result: GameResult, now = new Date()) {
  const today = dateKey(now)
  const memory = memoryFor(progress)
  const attempts = new Map<string, boolean>()
  // A later correct answer in the same session must not erase a mistake.
  for (const attempt of result.recall ?? []) attempts.set(attempt.wordId, (attempts.get(attempt.wordId) ?? true) && attempt.correct)
  for (const id of new Set([...result.wordIds, ...attempts.keys()])) {
    const previous = memory[id] ?? introducedMemory(today)
    const next = { ...previous, lastPracticedOn: today }
    if (attempts.has(id)) {
      next.practiceCount += 1
      const correct = attempts.get(id)!
      const eligible = result.review === true && previous.introducedOn < today && previous.dueOn <= today && previous.lastReviewedOn !== today
      if (!correct) {
        next.successfulReviews = 0
        next.dueOn = daysAfter(today, 1)
      }
      if (eligible) {
        next.reviewCount += 1
        next.lastReviewedOn = today
        if (correct) {
          next.successfulReviews += 1
          next.dueOn = daysAfter(today, REVIEW_INTERVALS[Math.min(next.successfulReviews, REVIEW_INTERVALS.length - 1)])
        }
      }
    }
    memory[id] = next
  }
  return memory
}

export function dueWords(words: WordEntry[], progress: Progress, today = dateKey()) {
  const memory = memoryFor(progress)
  return words.filter((entry) => memory[entry.id]?.dueOn <= today)
    .sort((a, b) => memory[a.id].dueOn.localeCompare(memory[b.id].dueOn) || a.id.localeCompare(b.id))
}

export function learningCounts(words: WordEntry[], progress: Progress) {
  const memory = memoryFor(progress)
  const counts = { introduced: 0, practising: 0, remembered: 0 }
  for (const entry of words) {
    const stage = memoryStage(memory[entry.id])
    if (stage !== 'new') counts[stage] += 1
  }
  return counts
}

// Preserve ɛ and ɔ: they are distinct letters, not cosmetic accents.
export const normalizeRecall = (answer: string) => answer.normalize('NFC').toLocaleLowerCase().replace(/[.,!?;:…“”"']/g, '').trim().replace(/\s+/g, ' ')

export function isRecallCorrect(answer: string, expected: string) {
  return normalizeRecall(answer) === normalizeRecall(expected)
}
