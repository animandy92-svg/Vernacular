import manifest from '../data/native-audio.json'

export interface NativeRecording {
  normal: string
  slow?: string
  transcript: string
  dialect: string
  speaker: string
  reviewedBy: string
  reviewedOn: string
}

export const NATIVE_AUDIO = manifest as Record<string, NativeRecording>

export function nativeRecording(id: string, transcript: string) {
  const recording = NATIVE_AUDIO[id]
  if (!recording || recording.transcript !== transcript || !recording.reviewedBy || !recording.reviewedOn || !recording.speaker || !recording.dialect) return undefined
  if (![recording.normal, recording.slow].filter(Boolean).every((path) => /^\/audio\/[a-zA-Z0-9_/-]+\.(mp3|ogg|wav|m4a)$/.test(path!))) return undefined
  return recording
}
