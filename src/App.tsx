import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { Dashboard } from './components/Dashboard'
import { Onboarding } from './components/Onboarding'
import { LeaderboardScreen, LibraryScreen, PlayScreen, ProgressScreen } from './components/Screens'
import { AppHeader, AppNav } from './components/Shell'
import { CourseScreen } from './components/Course'
import type { LearningSessionData } from './components/LearningSession'
import { COURSE_WORDS, lessonsFor, lessonUnlocked, lessonWords, type CourseLesson } from './data/course'
import { dueWords } from './lib/learning'
import { FALLBACK_WORDS, getWords } from './data/content'
import { wordsForLevel } from './lib/game'
import { TWI_VIDEO_PHRASES } from './lib/twi-video'
import type { LeaderboardEntry } from './lib/firebase'
import { completeSession, currentStreak, dateKey, loadState, saveState } from './lib/progress'
import type { EnvironmentId, GameMode, GameResult, LanguageCode, Profile, Screen, StoredState, WordEntry } from './types'

const GamePlay = lazy(() => import('./components/Games').then((module) => ({ default: module.GamePlay })))
const ResultScreen = lazy(() => import('./components/Games').then((module) => ({ default: module.ResultScreen })))
const LearningSession = lazy(() => import('./components/LearningSession').then((module) => ({ default: module.LearningSession })))

export default function App() {
  const [state, setState] = useState<StoredState>(() => loadState())
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [screen, setScreen] = useState<Screen>('home')
  const [gameMode, setGameMode] = useState<GameMode | null>(null)
  const [gameResult, setGameResult] = useState<GameResult | null>(null)
  const [learningSession, setLearningSession] = useState<LearningSessionData | null>(null)
  const sessionKey = useRef(0)
  const [words, setWords] = useState<WordEntry[]>(() => getWords(state.profile?.language ?? 'twi'))
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([])
  const [gameWords, setGameWords] = useState<WordEntry[]>([])
  const [online, setOnline] = useState(navigator.onLine)
  const [saved, setSaved] = useState(true)
  const [today, setToday] = useState(dateKey)
  const finished = useRef(false)

  useEffect(() => { setSaved(saveState(state)) }, [state])

  useEffect(() => {
    const refresh = () => { setOnline(navigator.onLine); setToday(dateKey()) }
    window.addEventListener('online', refresh)
    window.addEventListener('offline', refresh)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    const timer = window.setInterval(refresh, 60_000)
    return () => {
      window.removeEventListener('online', refresh)
      window.removeEventListener('offline', refresh)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    window.speechSynthesis?.cancel()
  }, [screen, gameMode, gameResult, editingProfile, learningSession])

  useEffect(() => {
    const language = state.profile?.language ?? 'twi'
    setWords(getWords(language))
    let active = true
    import('./lib/firebase').then(({ fetchWords }) => fetchWords(language)).then((remote) => {
      if (active && remote?.length) {
        const merged = new Map(getWords(language).map((entry) => [entry.id, entry]))
        remote.forEach((entry) => merged.set(entry.id, entry))
        setWords([...merged.values()])
      }
    }).catch(() => { /* The bundled language pack remains available. */ })
    return () => { active = false }
  }, [state.profile?.language])

  useEffect(() => {
    if (screen !== 'leaderboard') return
    let active = true
    import('./lib/firebase').then(({ fetchLeaderboard }) => fetchLeaderboard()).then((entries) => { if (active) setLeaders(entries) }).catch(() => {})
    return () => { active = false }
  }, [screen])

  useEffect(() => {
    const back = (event: Event) => {
      if (!state.profile || editingProfile || learningSession || (gameMode && !gameResult)) return
      if (gameResult) { event.preventDefault(); setGameMode(null); setGameResult(null) }
      else if (screen !== 'home') { event.preventDefault(); setScreen('home') }
    }
    window.addEventListener('vernacular-back', back)
    return () => window.removeEventListener('vernacular-back', back)
  }, [state.profile, editingProfile, gameMode, gameResult, screen, learningSession])

  const saveProfile = (profile: Profile) => {
    const isNewLearner = !state.profile
    setState((current) => ({ ...current, profile }))
    setEditingProfile(null)
    setScreen('home')
    if (isNewLearner) {
      const lesson = lessonsFor(profile.language)[0]
      finished.current = false
      setLearningSession({ key: ++sessionKey.current, kind: 'lesson', entries: lessonWords(lesson), lesson })
    }
  }

  const editProfile = () => {
    setEditingProfile(state.profile)
  }

  const switchLanguage = (language: LanguageCode) => {
    setState((current) => current.profile ? { ...current, profile: { ...current.profile, language } } : current)
    setScreen('home')
  }

  const switchEnvironment = (environment: EnvironmentId) => {
    setState((current) => ({ ...current, environment }))
  }

  const finishGame = (result: GameResult) => {
    if (finished.current) return
    finished.current = true
    setState((current) => ({ ...current, progress: completeSession(current.progress, result, gameMode === 'daily') }))
    setGameResult(result)
  }

  const leaveGame = () => {
    setGameMode(null)
    setGameResult(null)
  }

  const startGame = (mode: GameMode) => {
    const language = state.profile!.language
    const available = words.filter((entry) => entry.language === language)
    setGameWords(mode === 'listening' && language === 'twi' && TWI_VIDEO_PHRASES.length
      ? TWI_VIDEO_PHRASES
      : wordsForLevel(available.length ? available : getWords(language, FALLBACK_WORDS), state.profile!.level))
    finished.current = false
    setGameMode(mode)
  }

  const language = state.profile?.language ?? 'twi'
  const learningWords = [...new Map([...words.filter((entry) => entry.language === language), ...COURSE_WORDS.filter((entry) => entry.language === language)].map((entry) => [entry.id, entry])).values()]
  const startLesson = (lesson: CourseLesson) => {
    if (!lessonUnlocked(lesson, state.progress, language)) return
    finished.current = false
    setLearningSession({ key: ++sessionKey.current, kind: 'lesson', entries: lessonWords(lesson), lesson })
  }
  const startReview = () => {
    const entries = dueWords(learningWords, state.progress).slice(0, 10)
    if (!entries.length) return
    finished.current = false
    setLearningSession({ key: ++sessionKey.current, kind: 'review', entries })
  }
  const finishLearning = (result: GameResult) => {
    if (finished.current) return
    finished.current = true
    setState((current) => ({ ...current, progress: completeSession(current.progress, result) }))
  }
  const leaveLearning = () => { setLearningSession(null); setScreen('course') }

  const progress = { ...state.progress, streak: currentStreak(state.progress) }

  if (!state.profile || editingProfile) return <Onboarding initialProfile={editingProfile} onComplete={saveProfile} onCancel={editingProfile ? () => setEditingProfile(null) : undefined} />

  if (learningSession) return <Suspense fallback={<div className="loading-screen" role="status">Preparing your practice…</div>}><LearningSession key={learningSession.key} session={learningSession} profile={state.profile} saved={saved} onFinish={finishLearning} onExit={leaveLearning} /></Suspense>

  if (gameMode && gameResult) {
    return <Suspense fallback={<div className="loading-screen" role="status">Getting your results…</div>}><ResultScreen result={gameResult} mode={gameMode} profile={state.profile} progress={progress} onDone={leaveGame} onReplay={() => { finished.current = false; setGameResult(null) }} /></Suspense>
  }

  if (gameMode) {
    return <Suspense fallback={<div className="loading-screen" role="status">Getting your puzzle ready…</div>}><GamePlay mode={gameMode} profile={state.profile} environment={state.environment} words={gameWords} onFinish={finishGame} onExit={leaveGame} /></Suspense>
  }

  const content = (() => {
    if (screen === 'course') return <CourseScreen profile={state.profile} progress={progress} words={learningWords} today={today} onLesson={startLesson} onReview={startReview} onPuzzles={() => setScreen('play')} />
    if (screen === 'play') return <PlayScreen profile={state.profile} progress={progress} words={words} onGame={startGame} />
    if (screen === 'progress') return <ProgressScreen profile={state.profile} progress={progress} words={learningWords} onEdit={editProfile} />
    if (screen === 'library') return <LibraryScreen active={state.profile.language} onSwitch={switchLanguage} />
    if (screen === 'leaderboard') return <LeaderboardScreen profile={state.profile} progress={progress} entries={leaders} />
    return <Dashboard profile={state.profile} progress={progress} today={today} environment={state.environment} words={learningWords} onNavigate={setScreen} onGame={startGame} onEnvironment={switchEnvironment} onLesson={startLesson} onReview={startReview} />
  })()

  return (
    <div className="app-shell">
      <AppHeader profile={state.profile} progress={progress} onNavigate={setScreen} />
      {!online && <div className="connection-banner" role="status"><WifiOff size={16} /> You’re offline. Your language packs are ready to play.</div>}
      {!saved && <div className="connection-banner connection-banner--warning" role="alert">Progress could not be saved on this device. Keep the app open and free up storage.</div>}
      <div className="app-body">
        <AppNav active={screen} onNavigate={setScreen} />
        <main className="app-content">{content}</main>
      </div>
    </div>
  )
}
