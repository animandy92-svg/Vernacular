import type { GameResult, Profile, Progress, StoredState } from '../types'

const STORAGE_KEY = 'vernacular-state-v1'

export const EMPTY_PROGRESS: Progress = {
  xp: 0,
  streak: 0,
  lastPlayed: null,
  sessions: 0,
  masteredWords: [],
  dailyCompleted: null,
  perfectRounds: 0,
}

export const dateKey = (date = new Date()) => date.toISOString().slice(0, 10)

export function loadState(): StoredState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return { profile: null, progress: EMPTY_PROGRESS }
    const value = JSON.parse(stored) as Partial<StoredState>
    return {
      profile: value.profile ?? null,
      progress: { ...EMPTY_PROGRESS, ...(value.progress ?? {}) },
    }
  } catch {
    return { profile: null, progress: EMPTY_PROGRESS }
  }
}

export function saveState(state: StoredState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function completeSession(progress: Progress, result: GameResult, daily = false, now = new Date()): Progress {
  const today = dateKey(now)
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  let streak = progress.streak
  if (progress.lastPlayed !== today) {
    streak = progress.lastPlayed === dateKey(yesterday) ? progress.streak + 1 : 1
  }

  const earnedXp = result.score * 12 + (result.perfect ? 25 : 10)
  return {
    ...progress,
    xp: progress.xp + earnedXp,
    streak,
    lastPlayed: today,
    sessions: progress.sessions + 1,
    masteredWords: [...new Set([...progress.masteredWords, ...result.wordIds])],
    dailyCompleted: daily ? today : progress.dailyCompleted,
    perfectRounds: progress.perfectRounds + (result.perfect ? 1 : 0),
  }
}

export function xpForLevel(level: number) {
  return Math.max(100, level * 180)
}

export function levelFromXp(xp: number) {
  let level = 1
  let remaining = xp
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level)
    level += 1
  }
  return { level, currentXp: remaining, targetXp: xpForLevel(level) }
}

export function profileInitials(profile: Profile | null) {
  if (!profile?.name.trim()) return 'V'
  return profile.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}
