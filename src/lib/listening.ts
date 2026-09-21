import lessons from '../data/twi-lessons.json'

export const TWI_LISTENING_LESSONS = lessons
export const LISTENING_CACHE = 'vernacular-listening-v1'
const POSITION_KEY = 'vernacular-listening-positions-v1'

export function readListeningPosition(id: string): number {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(POSITION_KEY) ?? '{}')[id]
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0
  } catch { return 0 }
}

export function saveListeningPosition(id: string, time: number): boolean {
  try {
    const parsed = JSON.parse(localStorage.getItem(POSITION_KEY) ?? '{}')
    const positions = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    positions[id] = Number.isFinite(time) ? Math.max(0, time) : 0
    localStorage.setItem(POSITION_KEY, JSON.stringify(positions))
    return true
  } catch { return false }
}

export function formatListeningTime(seconds: number) {
  const time = Math.max(0, Math.floor(seconds))
  return `${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`
}
