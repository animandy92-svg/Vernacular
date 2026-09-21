import { useEffect, useRef, useState } from 'react'
import { Mic, Square } from 'lucide-react'

/** Optional, short-lived recording. No upload, storage or automatic grading. */
export function SpeakingPractice() {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'recording' | 'ready'>('idle')
  const [message, setMessage] = useState('')
  const [url, setUrl] = useState('')
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const recordingUrl = useRef('')
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const mounted = useRef(true)
  const available = typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

  const stop = () => {
    clearTimeout(timeout.current)
    if (recorder.current?.state === 'recording') recorder.current.stop()
    stream.current?.getTracks().forEach((track) => track.stop())
    stream.current = null
  }
  useEffect(() => {
    mounted.current = true
    const hide = () => { if (document.hidden) stop() }
    document.addEventListener('visibilitychange', hide)
    return () => {
      mounted.current = false
      document.removeEventListener('visibilitychange', hide)
      if (recorder.current) { recorder.current.onstop = null; recorder.current.ondataavailable = null; recorder.current.onerror = null }
      stop()
      if (recordingUrl.current) URL.revokeObjectURL(recordingUrl.current)
    }
  }, [])

  const start = async () => {
    if (!available || status === 'requesting' || status === 'recording') return
    setStatus('requesting')
    setMessage('Waiting for microphone access…')
    try {
      const source = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!mounted.current || document.hidden) {
        source.getTracks().forEach((track) => track.stop())
        if (mounted.current) { setStatus('idle'); setMessage('Return to this page and tap Record when you are ready.') }
        return
      }
      stream.current = source
      const capture = new MediaRecorder(source)
      const chunks: BlobPart[] = []
      recorder.current = capture
      capture.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
      capture.onerror = () => { stop(); if (mounted.current) { setStatus('idle'); setMessage('Recording stopped. You can keep practising without the microphone.') } }
      capture.onstop = () => {
        clearTimeout(timeout.current)
        source.getTracks().forEach((track) => track.stop())
        if (!mounted.current) return
        if (!chunks.length) { setStatus('idle'); setMessage('No audio was captured. Try again when you are ready.'); return }
        if (recordingUrl.current) URL.revokeObjectURL(recordingUrl.current)
        const nextUrl = URL.createObjectURL(new Blob(chunks, { type: capture.mimeType }))
        recordingUrl.current = nextUrl
        setUrl(nextUrl)
        setStatus('ready')
        setMessage('Replay your voice. This is self-practice, without a pronunciation score.')
      }
      capture.start()
      setStatus('recording')
      setMessage('Recording… stops automatically after 15 seconds.')
      timeout.current = setTimeout(stop, 15_000)
    } catch {
      stop()
      if (mounted.current) { setStatus('idle'); setMessage('Microphone access is unavailable. You can continue without recording.') }
    }
  }

  return <details className="speaking-practice"><summary><Mic size={17} /> Say it aloud · optional</summary><p>Try saying this expression, then listen back. Your recording stays in this session and is discarded when you move on.</p>
    {available ? <button className="button button--ghost" disabled={status === 'requesting'} onClick={status === 'recording' ? stop : () => void start()}>{status === 'recording' ? <><Square size={16} /> Stop recording</> : <><Mic size={16} />{status === 'requesting' ? 'Requesting microphone…' : url ? 'Record again' : 'Record my voice'}</>}</button> : <p>Recording is unavailable on this device. You can still practise aloud.</p>}
    {url && status !== 'recording' && <audio controls src={url} aria-label="Your practice recording" />}
    {message && <p role="status">{message}</p>}
  </details>
}
