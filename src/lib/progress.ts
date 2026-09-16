import type { CompanionStyle, EnvironmentId, GameMode, GameResult, Profile, Progress, StoredState } from '../types'

const STORAGE_KEY = 'vernacular-state-v1'

export const DEFAULT_COMPANION: CompanionStyle = {
  name: 'Ama',
  avatar: 'ama',
}

export const EMPTY_PROGRESS: Progress = {
  xp: 0,
  stars: 0,
  streak: 0,
  lastPlayed: null,
  sessions: 0,
  masteredWords: [],
  dailyCompleted: null,
  perfectRounds: 0,
  activity: {},
}

export const dateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export function currentStreak(progress: Progress, now = new Date()) {
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  return progress.lastPlayed === dateKey(now) || progress.lastPlayed === dateKey(yesterday) ? progress.streak : 0
}

export function weeklyActivity(progress: Progress, now = new Date()) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now)
    date.setDate(date.getDate() - 6 + index)
    const key = dateKey(date)
    return { key, label: date.toLocaleDateString(undefined, { weekday: 'short' }), count: progress.activity?.[key] ?? 0 }
  })
}

export function loadState(): StoredState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return { profile: null, progress: EMPTY_PROGRESS, environment: 'courtyard' }
    const value = JSON.parse(stored) as Partial<StoredState>
    const storedProfile = value.profile as Partial<Profile> | null | undefined
    const profile = storedProfile?.name ? {
      ...storedProfile,
      localName: storedProfile.localName ?? '',
      companion: { ...DEFAULT_COMPANION, ...(storedProfile.companion ?? {}) },
    } as Profile : null
    return {
      profile,
      progress: { ...EMPTY_PROGRESS, ...(value.progress ?? {}), bestStreak: Math.max(value.progress?.bestStreak ?? 0, value.progress?.streak ?? 0) },
      environment: ENVIRONMENTS.some((item) => item.id === value.environment) ? value.environment as EnvironmentId : 'courtyard',
    }
  } catch {
    return { profile: null, progress: EMPTY_PROGRESS, environment: 'courtyard' }
  }
}

export function saveState(state: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
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
  const ratio = result.score / Math.max(result.total, 1)
  const earnedStars = result.perfect ? 3 : ratio >= 0.6 ? 2 : 1
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - 27)
  const activity = Object.fromEntries(Object.entries(progress.activity ?? {}).filter(([day]) => day >= dateKey(cutoff)))
  activity[today] = (activity[today] ?? 0) + 1
  return {
    ...progress,
    xp: progress.xp + earnedXp,
    stars: progress.stars + earnedStars,
    streak,
    bestStreak: Math.max(progress.bestStreak ?? progress.streak, streak),
    lastPlayed: today,
    sessions: progress.sessions + 1,
    masteredWords: [...new Set([...progress.masteredWords, ...result.wordIds])],
    dailyCompleted: daily ? today : progress.dailyCompleted,
    perfectRounds: progress.perfectRounds + (result.perfect ? 1 : 0),
    activity,
  }
}

export const ACTIVITY_UNLOCKS: Record<GameMode, number> = {
  daily: 0,
  unscramble: 0,
  picture: 0,
  match: 0,
  listening: 1,
  search: 1,
  phrase: 3,
  crossword: 5,
  proverb: 5,
}

export const isModeUnlocked = (mode: GameMode, progress: Progress) => progress.sessions >= ACTIVITY_UNLOCKS[mode]

export const ENVIRONMENTS = [
  { id: 'courtyard', name: 'Welcome Courtyard', detail: 'Greetings & first words', xp: 0, icon: '☀️' },
  { id: 'market', name: 'Market Day', detail: 'Food, numbers & people', xp: 120, icon: '🧺' },
  { id: 'grove', name: 'Story Grove', detail: 'Phrases, nature & proverbs', xp: 350, icon: '🌳' },
  { id: 'library', name: 'Moonlit Library', detail: 'Advanced words & stories', xp: 700, icon: '🌙' },
] as const

export function earnedStars(result: GameResult) {
  if (result.perfect) return 3
  return result.score / Math.max(result.total, 1) >= 0.6 ? 2 : 1
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
