import { useEffect, useRef, useState } from 'react'
import { Volume2 } from 'lucide-react'
import type { WordEntry } from '../types'
import { nativeRecording } from '../lib/audio'

export function Pronunciation({ entry, compact = false, nativeOnly = false }: { entry: WordEntry; compact?: boolean; nativeOnly?: boolean }) {
  const [message, setMessage] = useState('')
  const audio = useRef<HTMLAudioElement | null>(null)
  const recording = nativeRecording(entry.id, entry.word)
  const guide = entry.phonetic ? ' Follow the written guide.' : ''
  useEffect(() => {
    setMessage('')
    return () => { audio.current?.pause(); audio.current = null; window.speechSynthesis?.cancel() }
  }, [entry.id])
  const play = async (slow = false) => {
    audio.current?.pause()
    if (recording) {
      try {
        window.speechSynthesis?.cancel()
        const player = new Audio(slow ? recording.slow ?? recording.normal : recording.normal)
        audio.current = player
        if (slow && !recording.slow) player.playbackRate = 0.75
        player.onerror = () => setMessage('This recording could not be played. You can continue with text.')
        await player.play()
        setMessage(`${recording.dialect} · ${recording.speaker}${slow ? ' · Slow playback' : ''}`)
      } catch { setMessage('This recording could not be played. You can continue with text.') }
      return
    }
    if (nativeOnly) return
    if (!('speechSynthesis' in window)) { setMessage(`Audio is unavailable on this device.${guide}`); return }
    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(entry.word)
      const language = entry.language === 'kasem' ? 'xsm' : 'ak'
      const voice = window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().split('-')[0] === language)
      if (!voice) { setMessage(`No matching language voice is installed. Native recordings are being prepared.${guide}`); return }
      utterance.lang = language + '-GH'
      if (voice) utterance.voice = voice
      utterance.rate = 0.72
      utterance.onerror = (event) => { if (event.error !== 'interrupted' && event.error !== 'canceled') setMessage(`Audio is unavailable on this device.${guide}`) }
      setMessage(`Device pronunciation; not a verified native recording.${guide}`)
      window.speechSynthesis.speak(utterance)
    } catch { setMessage(`Audio is unavailable on this device.${guide}`) }
  }
  return <div className={`pronunciation ${compact ? 'pronunciation--compact' : ''}`}>
    <button disabled={nativeOnly && !recording} className={compact ? 'audio-button' : 'listen-prompt'} onClick={() => void play()} aria-label={`${recording ? 'Hear' : 'Device audio for'} ${entry.word}`}><Volume2 size={20} />{!compact && (recording ? 'Listen' : nativeOnly ? 'Native audio coming soon' : 'Try device audio')}</button>
    {recording && !compact && <button className="listen-prompt" onClick={() => void play(true)}>Listen slowly</button>}
    {nativeOnly && !recording && <small className="audio-status">You can continue with text while recordings are prepared.</small>}
    {message && <small className="audio-status" role="status">{message}</small>}
  </div>
}
