import { useState } from 'react'
import { Volume2 } from 'lucide-react'
import type { WordEntry } from '../types'

export function Pronunciation({ entry, compact = false }: { entry: WordEntry; compact?: boolean }) {
  const [message, setMessage] = useState('')
  const guide = entry.phonetic ? ' Follow the written guide.' : ''
  const play = () => {
    if (!('speechSynthesis' in window)) { setMessage(`Audio is unavailable on this device.${guide}`); return }
    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(entry.word)
      const language = entry.language === 'kasem' ? 'xsm' : 'ak'
      const voice = window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().split('-')[0] === language)
      utterance.lang = language + '-GH'
      if (voice) utterance.voice = voice
      utterance.rate = 0.72
      utterance.onerror = (event) => { if (event.error !== 'interrupted' && event.error !== 'canceled') setMessage(`Audio is unavailable on this device.${guide}`) }
      setMessage(voice ? 'Playing device pronunciation.' : `Your device voice may approximate this language.${guide}`)
      window.speechSynthesis.speak(utterance)
    } catch { setMessage(`Audio is unavailable on this device.${guide}`) }
  }
  return <div className={`pronunciation ${compact ? 'pronunciation--compact' : ''}`}>
    <button className={compact ? 'audio-button' : 'listen-prompt'} onClick={play} aria-label={`Hear ${entry.word}`}><Volume2 size={20} />{!compact && 'Hear the word'}</button>
    {message && <small className="audio-status" role="status">{message}</small>}
  </div>
}
