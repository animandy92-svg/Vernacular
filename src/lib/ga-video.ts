import phrases from '../data/ga-video-phrases.json'
import type { WordEntry } from '../types'

export interface GaVideoPhrase {
  id: string
  word: string
  translation: string
  category: string
  attribution: string
  audio: string
  sourceVideo: string
  startSeconds: number
  endSeconds: number
  bytes: number
  sha256: string
}

export const GA_VIDEO_PHRASES: WordEntry[] = (phrases as GaVideoPhrase[]).map((phrase) => ({
  id: phrase.id,
  language: 'ga',
  word: phrase.word,
  translation: phrase.translation,
  category: phrase.category,
  difficulty: 'beginner',
  phonetic: '',
  example: '',
  reviewStatus: 'needs-review',
  visibility: 'public',
  source: 'ga-video',
  sourceAttribution: phrase.attribution,
}))

const recordings = new Map((phrases as GaVideoPhrase[]).map((phrase) => [phrase.id, phrase]))

export function gaVideoRecording(id: string, transcript: string) {
  const recording = recordings.get(id)
  return recording?.word === transcript && /^\/audio\/ga\/[a-z0-9-]+\.m4a$/.test(recording.audio)
    ? recording
    : undefined
}
