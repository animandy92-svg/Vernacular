export type LanguageCode = 'twi' | 'fante'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type GameMode = 'unscramble' | 'match' | 'search' | 'daily'
export type Screen = 'home' | 'play' | 'progress' | 'library' | 'leaderboard'

export interface Language {
  code: LanguageCode
  name: string
  nativeName: string
  region: string
  greeting: string
  color: string
  description: string
}

export interface WordEntry {
  id: string
  language: LanguageCode
  word: string
  translation: string
  category: string
  difficulty: Difficulty
  phonetic: string
  example: string
  reviewStatus: 'needs-review' | 'reviewed'
  visibility: 'public'
}

export interface Profile {
  name: string
  language: LanguageCode
  level: Difficulty
  dailyGoal: number
}

export interface Progress {
  xp: number
  streak: number
  lastPlayed: string | null
  sessions: number
  masteredWords: string[]
  dailyCompleted: string | null
  perfectRounds: number
}

export interface StoredState {
  profile: Profile | null
  progress: Progress
}

export interface GameResult {
  score: number
  total: number
  wordIds: string[]
  perfect: boolean
}
