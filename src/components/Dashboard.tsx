import { ArrowRight, BookOpen, Check, Flame, Headphones, Search, Shuffle, Sparkles, Trophy, Volume2, Zap } from 'lucide-react'
import { getLanguage } from '../data/content'
import { dateKey, levelFromXp } from '../lib/progress'
import type { GameMode, Profile, Progress, Screen, WordEntry } from '../types'
import { LanguageBadge } from './Shell'

interface Props {
  profile: Profile
  progress: Progress
  words: WordEntry[]
  onNavigate: (screen: Screen) => void
  onGame: (mode: GameMode) => void
}

const MODES = [
  { id: 'unscramble' as const, title: 'Unscramble', description: 'Put every letter in its place', icon: Shuffle, tone: 'coral', time: '3 min' },
  { id: 'match' as const, title: 'Word match', description: 'Connect words and meanings', icon: Zap, tone: 'gold', time: '4 min' },
  { id: 'search' as const, title: 'Word search', description: 'Find words hiding in the grid', icon: Search, tone: 'green', time: '5 min' },
]

export function speakWord(entry: WordEntry) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(entry.word)
  utterance.lang = 'ak-GH'
  utterance.rate = 0.72
  window.speechSynthesis.speak(utterance)
}

export function Dashboard({ profile, progress, words, onNavigate, onGame }: Props) {
  const language = getLanguage(profile.language)
  const level = levelFromXp(progress.xp)
  const dayNumber = Math.floor(Date.now() / 86_400_000)
  const wordOfDay = words[dayNumber % Math.max(words.length, 1)]
  const dailyDone = progress.dailyCompleted === dateKey()

  return (
    <div className="dashboard page-enter">
      <section className="welcome-row">
        <div>
          <span className="eyebrow">{language.greeting}</span>
          <h1>Ready for another word, {profile.name}?</h1>
          <p>Small steps, spoken often. Keep your {language.name} journey moving.</p>
        </div>
        <LanguageBadge profile={profile} />
      </section>

      <section className="hero-card">
        <div className="hero-pattern" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="hero-copy">
          <span className="eyebrow eyebrow--gold">CONTINUE YOUR PATH</span>
          <h2>Everyday essentials</h2>
          <p>Greetings, family and the words you reach for most.</p>
          <button className="button button--cream" onClick={() => onGame('unscramble')}>Keep learning <ArrowRight size={18} /></button>
        </div>
        <div className="level-orbit">
          <div className="level-ring" style={{ '--progress': `${Math.round((level.currentXp / level.targetXp) * 360)}deg` } as React.CSSProperties}>
            <span><small>LEVEL</small>{level.level}</span>
          </div>
          <p>{level.currentXp} / {level.targetXp} XP</p>
        </div>
      </section>

      <section className="stat-strip" aria-label="Learning statistics">
        <div><span className="stat-icon stat-icon--coral"><Flame size={20} /></span><span><strong>{progress.streak}</strong><small>day streak</small></span></div>
        <div><span className="stat-icon stat-icon--gold"><Sparkles size={20} /></span><span><strong>{progress.xp}</strong><small>total XP</small></span></div>
        <div><span className="stat-icon stat-icon--green"><BookOpen size={20} /></span><span><strong>{progress.masteredWords.length}</strong><small>words learned</small></span></div>
      </section>

      <section className={`daily-card ${dailyDone ? 'daily-card--done' : ''}`}>
        <div className="daily-icon">{dailyDone ? <Check size={27} /> : <Trophy size={27} />}</div>
        <div>
          <span className="eyebrow">DAILY CHALLENGE</span>
          <h2>{dailyDone ? 'Challenge complete' : 'Three words. One fresh win.'}</h2>
          <p>{dailyDone ? 'Come back tomorrow for a new challenge.' : 'Finish today’s quick round to protect your streak.'}</p>
        </div>
        <button className="button button--dark" disabled={dailyDone} onClick={() => onGame('daily')}>
          {dailyDone ? 'Done today' : 'Play now'} {!dailyDone && <ArrowRight size={18} />}
        </button>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><span className="eyebrow">QUICK PLAY</span><h2>Choose a puzzle</h2></div><button onClick={() => onNavigate('play')}>See all <ArrowRight size={16} /></button></div>
        <div className="mode-grid">
          {MODES.map((mode) => {
            const Icon = mode.icon
            return (
              <button className={`mode-card mode-card--${mode.tone}`} key={mode.id} onClick={() => onGame(mode.id)}>
                <span className="mode-icon"><Icon size={25} /></span>
                <span className="mode-time">{mode.time}</span>
                <strong>{mode.title}</strong>
                <small>{mode.description}</small>
                <span className="round-arrow"><ArrowRight size={17} /></span>
              </button>
            )
          })}
        </div>
      </section>

      {wordOfDay && (
        <section className="word-card">
          <div className="word-card-label"><Headphones size={18} /><span>WORD OF THE DAY</span></div>
          <div className="word-main">
            <div><h2>{wordOfDay.word}</h2><p>{wordOfDay.phonetic}</p></div>
            <button className="audio-button" onClick={() => speakWord(wordOfDay)} aria-label={`Hear ${wordOfDay.word}`}><Volume2 size={22} /></button>
          </div>
          <strong>{wordOfDay.translation}</strong>
          <blockquote>“{wordOfDay.example}”</blockquote>
        </section>
      )}

      <aside className="review-note">
        <span>CONTENT NOTE</span>
        The launch vocabulary is a demonstration pack awaiting native-speaker review before educational release.
      </aside>
    </div>
  )
}

export { MODES }
