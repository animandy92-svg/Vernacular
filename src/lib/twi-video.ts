import phrases from '../data/twi-video-phrases.json'
import type { WordEntry } from '../types'

export interface TwiVideoPhrase {
  number: number
  word: string
  translation: string
  audio: string
  sourceVideo: string
  startSeconds: number
  endSeconds: number
  bytes: number
  sha256: string
}

export const TWI_VIDEO_PHRASES: WordEntry[] = (phrases as TwiVideoPhrase[]).map((phrase) => ({
  id: `twi-learnakan-${String(phrase.number).padStart(3, '0')}`,
  language: 'twi',
  word: phrase.word,
  translation: phrase.translation,
  category: 'LearnAkan video phrases',
  difficulty: 'beginner',
  phonetic: '',
  example: '',
  reviewStatus: 'needs-review',
  visibility: 'public',
  source: 'learnakan-video',
  sourceAttribution: 'LearnAkan',
}))

const recordings = new Map((phrases as TwiVideoPhrase[]).map((phrase) =>
  [`twi-learnakan-${String(phrase.number).padStart(3, '0')}`, phrase]))

export function twiVideoRecording(id: string, transcript: string) {
  const recording = recordings.get(id)
  return recording?.word === transcript && /^\/audio\/twi\/learnakan-\d{3}\.m4a$/.test(recording.audio)
    ? recording
    : undefined
}
