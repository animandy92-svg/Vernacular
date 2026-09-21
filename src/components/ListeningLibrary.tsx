import { Capacitor } from '@capacitor/core'
import { useEffect, useRef, useState } from 'react'
import { Check, Download, Headphones, RotateCcw } from 'lucide-react'
import { formatListeningTime, LISTENING_CACHE, readListeningPosition, saveListeningPosition, TWI_LISTENING_LESSONS } from '../lib/listening'

type Lesson = typeof TWI_LISTENING_LESSONS[number]

function ListeningPlayer({ lesson }: { lesson: Lesson }) {
  const video = useRef<HTMLVideoElement>(null)
  const [speed, setSpeed] = useState(1)
  const [position, setPosition] = useState(() => readListeningPosition(lesson.id))
  const [message, setMessage] = useState('')
  const [offline, setOffline] = useState(Capacitor.isNativePlatform())
  const [downloading, setDownloading] = useState(false)
  const lastSaved = useRef(0)
  const download = useRef<AbortController | null>(null)

  useEffect(() => {
    let active = true
    if (!Capacitor.isNativePlatform() && 'caches' in window) {
      caches.open(LISTENING_CACHE).then((cache) => cache.match(lesson.video)).then((entry) => {
        if (active) setOffline(!!entry)
      }).catch(() => {})
    }
    const player = video.current
    const persist = () => {
      if (!player || player.readyState === 0) return
      if (!saveListeningPosition(lesson.id, player.ended ? 0 : player.currentTime)) setMessage('Your place could not be saved on this device.')
    }
    const hide = () => { if (document.hidden) { player?.pause(); persist() } }
    document.addEventListener('visibilitychange', hide)
    window.addEventListener('pagehide', persist)
    return () => {
      active = false
      download.current?.abort()
      player?.pause()
      persist()
      document.removeEventListener('visibilitychange', hide)
      window.removeEventListener('pagehide', persist)
    }
  }, [lesson.id, lesson.video])

  const saveOffline = async () => {
    if (!('caches' in window) || !navigator.serviceWorker?.controller) {
      setMessage('Offline saving needs the installed web app. Reload this page once, then try again.')
      return
    }
    const controller = new AbortController()
    download.current = controller
    setDownloading(true)
    setMessage('Saving this lesson for offline listening…')
    try {
      const response = await fetch(lesson.video, { signal: controller.signal, cache: 'no-store' })
      if (!response.ok || response.status !== 200 || !response.headers.get('content-type')?.includes('video/')) throw new Error('Media unavailable')
      const cache = await caches.open(LISTENING_CACHE)
      await cache.put(lesson.video, response)
      if (controller.signal.aborted) return
      setOffline(true)
      setMessage('Lesson saved. You can play it without an internet connection.')
    } catch {
      if (!controller.signal.aborted) setMessage('Could not save the lesson. Check your connection and available storage, then try again.')
    } finally {
      if (!controller.signal.aborted) setDownloading(false)
    }
  }

  return <div className="listening-player">
    <video ref={video} controls playsInline preload="metadata" poster={lesson.poster} src={lesson.video}
      aria-label={`${lesson.title}, Twi phrases ${lesson.phraseRange}, with on-screen English translations`}
      onLoadedMetadata={() => {
        const player = video.current!
        const saved = readListeningPosition(lesson.id)
        if (saved > 0 && saved < player.duration - 2) player.currentTime = saved
        player.playbackRate = speed
      }}
      onTimeUpdate={() => {
        const time = video.current?.currentTime ?? 0
        setPosition(time)
        if (Math.abs(time - lastSaved.current) >= 5) {
          lastSaved.current = time
          if (!saveListeningPosition(lesson.id, time)) setMessage('Your place could not be saved on this device.')
        }
      }}
      onPause={() => { if (video.current?.readyState) saveListeningPosition(lesson.id, video.current.currentTime) }}
      onEnded={() => { saveListeningPosition(lesson.id, 0); setPosition(0) }}
      onError={() => setMessage('This lesson could not be loaded. Connect to the internet or save it offline before travelling.')}
    />
    <div className="listening-controls">
      <button className="button button--ghost" onClick={() => { if (video.current) video.current.currentTime = Math.max(0, video.current.currentTime - 10) }}><RotateCcw size={17} /> Back 10s</button>
      <label>Speed <select aria-label="Listening playback speed" value={speed} onChange={(event) => {
        const value = Number(event.target.value)
        setSpeed(value)
        if (video.current) video.current.playbackRate = value
      }}><option value={0.75}>0.75× slower</option><option value={1}>1× normal</option><option value={1.25}>1.25× faster</option></select></label>
      <button className="button button--ghost" onClick={() => {
        if (video.current) video.current.currentTime = 0
        setPosition(0)
        saveListeningPosition(lesson.id, 0)
      }}>Start over</button>
    </div>
    <p className="listening-help">Listen, pause and repeat. Read the Twi spelling and English meaning on screen. Your place is saved at {formatListeningTime(position)}.</p>
    <div className="listening-offline">
      {offline ? <span><Check size={17} /> Available offline{Capacitor.isNativePlatform() ? ' in this app' : ' on this device'}</span> : <button className="button button--soft" disabled={downloading} onClick={() => void saveOffline()}><Download size={17} />{downloading ? 'Saving…' : `Save offline · ${Math.ceil(lesson.bytes / 1_000_000)} MB`}</button>}
    </div>
    {message && <p className="audio-status" role="status">{message}</p>}
  </div>
}

export function ListeningLibrary() {
  const [selected, setSelected] = useState<string | null>(null)
  return <section className="listening-library" aria-label="Twi listening lessons">
    <div className="section-heading"><div><span className="eyebrow">LISTEN & REPEAT</span><h2>Twi, spoken in everyday life.</h2></div><Headphones size={27} /></div>
    <p>Three lessons covering phrases 1–300, with spoken Twi and the original on-screen English translations.</p>
    <div className="listening-lessons">{TWI_LISTENING_LESSONS.map((lesson) => {
      const open = selected === lesson.id
      return <article className={`listening-lesson ${open ? 'listening-lesson--open' : ''}`} key={lesson.id}>
        <button className="listening-lesson-heading" aria-expanded={open} aria-controls={`player-${lesson.id}`} onClick={() => setSelected(open ? null : lesson.id)}>
          <span className="course-icon"><Headphones size={23} /></span>
          <span><strong>{lesson.title}</strong><small>Phrases {lesson.phraseRange} · {formatListeningTime(lesson.durationSeconds)}</small></span>
          <span className="listening-open-label">{open ? 'Close' : 'Listen'}</span>
        </button>
        <div id={`player-${lesson.id}`}>{open && <ListeningPlayer key={lesson.id} lesson={lesson} />}</div>
      </article>
    })}</div>
    <p className="listening-credit">Lessons by <a href="https://learnakan.com" target="_blank" rel="noreferrer">LearnAkan</a>. Audio and translations stay together in the original lesson sequence.</p>
  </section>
}
