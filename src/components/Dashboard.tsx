import { ArrowRight, BookOpen, Check, Flame, Grid3X3, Headphones, Image, LockKeyhole, MessageSquareText, Quote, Search, Shuffle, Sparkles, Star, Trophy, Volume2, Zap } from 'lucide-react'
import { getLanguage } from '../data/content'
import { ACTIVITY_UNLOCKS, dateKey, ENVIRONMENTS, isModeUnlocked, levelFromXp } from '../lib/progress'
import type { EnvironmentId, GameMode, Profile, Progress, Screen, WordEntry } from '../types'
import { Companion } from './Companion'
import { LanguageBadge } from './Shell'

interface Props {
  profile: Profile
  progress: Progress
  environment: EnvironmentId
  words: WordEntry[]
  onNavigate: (screen: Screen) => void
  onGame: (mode: GameMode) => void
  onEnvironment: (environment: EnvironmentId) => void
}

const MODES = [
  { id: 'unscramble' as const, title: 'Unscramble', description: 'Rearrange letters to reveal the word', icon: Shuffle, tone: 'coral', time: '3 min' },
  { id: 'picture' as const, title: 'Picture Quiz', description: 'Name what you see in the picture', icon: Image, tone: 'sky', time: '3 min' },
  { id: 'match' as const, title: 'Word Match', description: 'Connect indigenous words and meanings', icon: Zap, tone: 'gold', time: '4 min' },
  { id: 'listening' as const, title: 'Listening Challenge', description: 'Hear a word and choose its meaning', icon: Headphones, tone: 'purple', time: '4 min' },
  { id: 'search' as const, title: 'Word Search', description: 'Find hidden words in a lively letter grid', icon: Search, tone: 'green', time: '5 min' },
  { id: 'phrase' as const, title: 'Phrase Builder', description: 'Put useful phrases in speaking order', icon: MessageSquareText, tone: 'sky', time: '4 min' },
  { id: 'crossword' as const, title: 'Crossword', description: 'Solve crossing words from English clues', icon: Grid3X3, tone: 'purple', time: '6 min' },
  { id: 'proverb' as const, title: 'Proverb Challenge', description: 'Discover the lesson inside each saying', icon: Quote, tone: 'green', time: '4 min' },
]

export function speakWord(entry: WordEntry) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(entry.word)
  utterance.lang = entry.language === 'kasem' ? 'xsm-GH' : 'ak-GH'
  utterance.rate = 0.72
  window.speechSynthesis.speak(utterance)
}

export function Dashboard({ profile, progress, environment, words, onNavigate, onGame, onEnvironment }: Props) {
  const language = getLanguage(profile.language)
  const level = levelFromXp(progress.xp)
  const dayNumber = Math.floor(Date.now() / 86_400_000)
  const wordOfDay = words[dayNumber % Math.max(words.length, 1)]
  const dailyDone = progress.dailyCompleted === dateKey()
  const learnerName = profile.localName || profile.name
  const nextEnvironment = ENVIRONMENTS.find((environment) => progress.xp < environment.xp)
  const activeEnvironment = ENVIRONMENTS.find((item) => item.id === environment) ?? ENVIRONMENTS[0]

  return (
    <div className="dashboard page-enter">
      <section className="welcome-row">
        <div>
          <span className="eyebrow">{language.greeting}</span>
          <h1>Ready for another word, {learnerName}?</h1>
          <p>Small steps, spoken often. Keep your {language.name} journey moving.</p>
        </div>
        <LanguageBadge profile={profile} />
      </section>

      <section className={`hero-card hero-card--${activeEnvironment.id}`}>
        <div className="hero-pattern" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="hero-copy">
          <span className="eyebrow eyebrow--gold">EXPLORING · {activeEnvironment.name.toUpperCase()}</span>
          <h2>{activeEnvironment.name}</h2>
          <p>{activeEnvironment.detail}. Take your companion into the next lesson.</p>
          <button className="button button--cream" onClick={() => onGame('unscramble')}>Keep learning <ArrowRight size={18} /></button>
        </div>
        <div className="hero-companion">
          <div className="hero-companion-speech"><strong>{profile.companion.name}</strong><span>Our next stop: {activeEnvironment.name}. Let’s find a new word!</span></div>
          <Companion character={profile.companion} pose="carry" item="map" size={190} />
          <span className="hero-level-pill">Level {level.level} · {level.currentXp}/{level.targetXp} XP</span>
        </div>
      </section>

      <section className="stat-strip stat-strip--four" aria-label="Learning statistics">
        <div><span className="stat-icon stat-icon--coral"><Flame size={20} /></span><span><strong>{progress.streak}</strong><small>day streak</small></span></div>
        <div><span className="stat-icon stat-icon--gold"><Sparkles size={20} /></span><span><strong>{progress.xp}</strong><small>total XP</small></span></div>
        <div><span className="stat-icon stat-icon--gold"><Star size={20} /></span><span><strong>{progress.stars}</strong><small>stars earned</small></span></div>
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

      <section className="section-block journey-section">
        <div className="section-heading"><div><span className="eyebrow">YOUR WORLD</span><h2>Adventure map</h2></div><span>{nextEnvironment ? `${nextEnvironment.xp - progress.xp} XP to ${nextEnvironment.name}` : 'All places unlocked'}</span></div>
        <div className="environment-path">
          {ENVIRONMENTS.map((place, index) => {
            const unlocked = progress.xp >= place.xp
            return <button type="button" disabled={!unlocked} onClick={() => onEnvironment(place.id)} aria-pressed={environment === place.id} className={`environment-card environment-card--${place.id} ${unlocked ? 'unlocked' : 'locked'} ${environment === place.id ? 'active' : ''}`} key={place.id}><span className="environment-number">{index + 1}</span><span className="environment-icon">{unlocked ? place.icon : <LockKeyhole size={22} />}</span><span className="environment-copy"><strong>{place.name}</strong><small>{unlocked ? environment === place.id ? 'Exploring now · tap another place to travel' : place.detail : `Unlock at ${place.xp} XP`}</small></span>{environment === place.id && <Check size={18} />}</button>
          })}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><span className="eyebrow">QUICK PLAY</span><h2>Choose a puzzle</h2></div><button onClick={() => onNavigate('play')}>See all <ArrowRight size={16} /></button></div>
        <div className="mode-grid">
          {MODES.slice(0, 4).map((mode) => {
            const Icon = mode.icon
            const unlocked = isModeUnlocked(mode.id, progress)
            return (
              <button className={`mode-card mode-card--${mode.tone} ${unlocked ? '' : 'mode-card--locked'}`} disabled={!unlocked} key={mode.id} onClick={() => onGame(mode.id)}>
                <span className="mode-icon">{unlocked ? <Icon size={25} /> : <LockKeyhole size={23} />}</span>
                <span className="mode-time">{unlocked ? mode.time : `${ACTIVITY_UNLOCKS[mode.id]} puzzle${ACTIVITY_UNLOCKS[mode.id] === 1 ? '' : 's'}`}</span>
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
        Vocabulary and pronunciation guides are sourced learning aids awaiting native-speaker review before educational release.
      </aside>
    </div>
  )
}

export { MODES }
