export type LanguageCode = 'twi' | 'fante' | 'kasem'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type GameMode = 'unscramble' | 'match' | 'search' | 'crossword' | 'picture' | 'listening' | 'proverb' | 'phrase' | 'daily'
export type Screen = 'home' | 'course' | 'play' | 'progress' | 'library' | 'leaderboard'
export type EnvironmentId = 'courtyard' | 'market' | 'grove' | 'library'
export type CompanionAvatar = 'ama' | 'kofi' | 'esi' | 'kojo'

export interface CompanionStyle {
  name: string
  avatar: CompanionAvatar
}

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
  source?: string
  sourceRow?: number
  sourceEntryId?: string
  sourceAttribution?: string
  partOfSpeech?: string
  dialect?: string
  alternateTerms?: string
  exampleTranslation?: string
  usageNote?: string
  culturalNote?: string
}

export interface CulturalProverb {
  id: string
  language: LanguageCode | 'akan'
  text: string
  literal: string
  meaning: string
}

export interface PhraseEntry {
  id: string
  language: LanguageCode
  phrase: string
  translation: string
}

export interface Profile {
  name: string
  localName: string
  language: LanguageCode
  level: Difficulty
  dailyGoal: number
  companion: CompanionStyle
}

export interface Progress {
  xp: number
  stars: number
  streak: number
  lastPlayed: string | null
  sessions: number
  masteredWords: string[]
  dailyCompleted: string | null
  perfectRounds: number
  activity?: Record<string, number>
  bestStreak?: number
  memory?: Record<string, WordMemory>
  lessons?: Record<string, LessonCompletion>
}

export interface WordMemory {
  introducedOn: string
  dueOn: string
  lastPracticedOn: string | null
  lastReviewedOn: string | null
  successfulReviews: number
  reviewCount: number
  practiceCount: number
}

export interface LessonCompletion {
  completedOn: string
  score: number
  total: number
}

export interface RecallAttempt {
  wordId: string
  correct: boolean
}

export interface StoredState {
  profile: Profile | null
  progress: Progress
  environment: EnvironmentId
}

export interface GameResult {
  score: number
  total: number
  wordIds: string[]
  perfect: boolean
  recall?: RecallAttempt[]
  lessonId?: string
  review?: boolean
}
