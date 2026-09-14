import { useEffect, useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { GamePlay, ResultScreen } from './components/Games'
import { Onboarding } from './components/Onboarding'
import { LeaderboardScreen, LibraryScreen, PlayScreen, ProgressScreen } from './components/Screens'
import { AppHeader, AppNav } from './components/Shell'
import { FALLBACK_WORDS, getWords } from './data/content'
import type { LeaderboardEntry } from './lib/firebase'
import { completeSession, loadState, saveState } from './lib/progress'
import type { EnvironmentId, GameMode, GameResult, LanguageCode, Profile, Screen, StoredState, WordEntry } from './types'

export default function App() {
  const [state, setState] = useState<StoredState>(() => loadState())
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [screen, setScreen] = useState<Screen>('home')
  const [gameMode, setGameMode] = useState<GameMode | null>(null)
  const [gameResult, setGameResult] = useState<GameResult | null>(null)
  const [words, setWords] = useState<WordEntry[]>(() => getWords(state.profile?.language ?? 'twi'))
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([])

  useEffect(() => saveState(state), [state])

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
    })
    return () => { active = false }
  }, [state.profile?.language])

  useEffect(() => {
    if (screen !== 'leaderboard') return
    import('./lib/firebase').then(({ fetchLeaderboard }) => fetchLeaderboard()).then(setLeaders)
  }, [screen])

  const saveProfile = (profile: Profile) => {
    setState((current) => ({ ...current, profile }))
    setEditingProfile(null)
    setScreen('home')
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
    setState((current) => ({ ...current, progress: completeSession(current.progress, result, gameMode === 'daily') }))
    setGameResult(result)
  }

  const leaveGame = () => {
    setGameMode(null)
    setGameResult(null)
    setScreen('home')
  }

  if (!state.profile || editingProfile) return <Onboarding initialProfile={editingProfile} onComplete={saveProfile} />

  if (gameMode && gameResult) {
    return <ResultScreen result={gameResult} mode={gameMode} profile={state.profile} progress={state.progress} onDone={leaveGame} onReplay={() => setGameResult(null)} />
  }

  if (gameMode) {
    return <GamePlay mode={gameMode} profile={state.profile} environment={state.environment} words={words.length ? words : getWords(state.profile.language, FALLBACK_WORDS)} onFinish={finishGame} onExit={leaveGame} />
  }

  const content = (() => {
    if (screen === 'play') return <PlayScreen profile={state.profile} progress={state.progress} words={words} onGame={setGameMode} />
    if (screen === 'progress') return <ProgressScreen profile={state.profile} progress={state.progress} words={words} onEdit={editProfile} />
    if (screen === 'library') return <LibraryScreen active={state.profile.language} onSwitch={switchLanguage} />
    if (screen === 'leaderboard') return <LeaderboardScreen profile={state.profile} progress={state.progress} entries={leaders} />
    return <Dashboard profile={state.profile} progress={state.progress} environment={state.environment} words={words} onNavigate={setScreen} onGame={setGameMode} onEnvironment={switchEnvironment} />
  })()

  return (
    <div className="app-shell">
      <AppHeader profile={state.profile} progress={state.progress} onNavigate={setScreen} />
      <div className="app-body">
        <AppNav active={screen} onNavigate={setScreen} />
        <main className="app-content">{content}</main>
      </div>
    </div>
  )
}
