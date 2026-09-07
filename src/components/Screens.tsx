import { ArrowRight, Award, BookOpen, Check, Flame, Globe2, LockKeyhole, Search, Settings2, ShieldCheck, Shuffle, Sparkles, Trophy, Volume2, Zap } from 'lucide-react'
import { LANGUAGES, getLanguage } from '../data/content'
import type { LeaderboardEntry } from '../lib/firebase'
import { levelFromXp } from '../lib/progress'
import type { GameMode, LanguageCode, Profile, Progress, WordEntry } from '../types'
import { MODES, speakWord } from './Dashboard'
import { PageIntro } from './Shell'

export function PlayScreen({ profile, words, onGame }: { profile: Profile; words: WordEntry[]; onGame: (mode: GameMode) => void }) {
  const categories = [...new Set(words.map((entry) => entry.category))]
  return (
    <div className="page-enter">
      <PageIntro eyebrow={`${getLanguage(profile.language).name.toUpperCase()} LEARNING PATH`} title="Pick a way to play." description="Each short game strengthens a different part of your vocabulary." />
      <div className="mode-list">
        {MODES.map((mode, index) => {
          const Icon = mode.icon
          return (
            <button className={`mode-row mode-row--${mode.tone}`} key={mode.id} onClick={() => onGame(mode.id)}>
              <span className="mode-index">0{index + 1}</span>
              <span className="mode-icon"><Icon size={28} /></span>
              <span className="mode-row-copy"><strong>{mode.title}</strong><small>{mode.description}</small></span>
              <span className="mode-meta">{mode.time}</span>
              <span className="round-arrow"><ArrowRight size={18} /></span>
            </button>
          )
        })}
      </div>
      <section className="section-block path-section">
        <div className="section-heading"><div><span className="eyebrow">YOUR PACK</span><h2>Everyday essentials</h2></div><span>{words.length} words</span></div>
        <div className="category-chips">{categories.map((category) => <span key={category}>{category}</span>)}</div>
        <div className="path-progress"><span style={{ width: `${Math.min(100, (words.length ? 1 : 0) * 18)}%` }} /></div>
        <p>Complete puzzles to reveal more categories and cultural stories.</p>
      </section>
    </div>
  )
}

export function ProgressScreen({ profile, progress, words, onEdit }: { profile: Profile; progress: Progress; words: WordEntry[]; onEdit: () => void }) {
  const level = levelFromXp(progress.xp)
  const learned = words.filter((entry) => progress.masteredWords.includes(entry.id))
  const badges = [
    { label: 'First step', detail: 'Complete a puzzle', icon: Sparkles, unlocked: progress.sessions >= 1 },
    { label: 'Perfect round', detail: 'No mistakes', icon: Award, unlocked: progress.perfectRounds >= 1 },
    { label: 'Word collector', detail: 'Learn 10 words', icon: BookOpen, unlocked: progress.masteredWords.length >= 10 },
    { label: 'Seven suns', detail: 'Reach a 7-day streak', icon: Flame, unlocked: progress.streak >= 7 },
  ]

  return (
    <div className="page-enter">
      <PageIntro eyebrow="YOUR JOURNEY" title={`${profile.name}’s progress`} description="Every puzzle leaves a mark. Here is how your learning is growing." />
      <section className="progress-hero">
        <div className="progress-level"><small>LEVEL</small><strong>{level.level}</strong></div>
        <div><span className="eyebrow">{getLanguage(profile.language).name.toUpperCase()} EXPLORER</span><h2>{level.currentXp} XP toward level {level.level + 1}</h2><div className="path-progress"><span style={{ width: `${(level.currentXp / level.targetXp) * 100}%` }} /></div><p>{level.targetXp - level.currentXp} XP to your next level</p></div>
      </section>
      <div className="profile-stat-grid">
        <div><Flame /><strong>{progress.streak}</strong><span>Day streak</span></div>
        <div><Zap /><strong>{progress.xp}</strong><span>Total XP</span></div>
        <div><BookOpen /><strong>{progress.masteredWords.length}</strong><span>Words learned</span></div>
        <div><Trophy /><strong>{progress.sessions}</strong><span>Puzzles finished</span></div>
      </div>

      <section className="section-block">
        <div className="section-heading"><div><span className="eyebrow">MILESTONES</span><h2>Your badges</h2></div></div>
        <div className="badge-grid">
          {badges.map((badge) => {
            const Icon = badge.unlocked ? badge.icon : LockKeyhole
            return <div className={badge.unlocked ? 'badge-card unlocked' : 'badge-card'} key={badge.label}><span><Icon size={25} /></span><strong>{badge.label}</strong><small>{badge.detail}</small></div>
          })}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><span className="eyebrow">VOCABULARY</span><h2>Words you’ve met</h2></div><span>{learned.length}/{words.length}</span></div>
        {learned.length ? (
          <div className="learned-list">{learned.slice(-8).reverse().map((entry) => <div key={entry.id}><span><strong>{entry.word}</strong><small>{entry.translation}</small></span><button onClick={() => speakWord(entry)} aria-label={`Hear ${entry.word}`}><Volume2 size={19} /></button></div>)}</div>
        ) : <div className="empty-state"><BookOpen size={28} /><strong>Your first word is waiting.</strong><p>Finish any puzzle and it will appear here.</p></div>}
      </section>

      <button className="text-action" onClick={onEdit}><Settings2 size={18} /> Edit learning setup</button>
    </div>
  )
}

export function LibraryScreen({ active, onSwitch }: { active: LanguageCode; onSwitch: (language: LanguageCode) => void }) {
  return (
    <div className="page-enter">
      <PageIntro eyebrow="LANGUAGE LIBRARY" title="A home for every voice." description="Switch between installed language packs. More paths can be added as reviewed content becomes available." />
      <div className="library-grid">
        {LANGUAGES.map((language) => (
          <article className={`library-card ${active === language.code ? 'active' : ''}`} key={language.code}>
            <div className="library-art" style={{ '--language-color': language.color } as React.CSSProperties}><Globe2 size={35} /><span>{language.greeting}</span></div>
            <div className="library-copy"><span className="eyebrow">{language.nativeName}</span><h2>{language.name}</h2><p>{language.description}</p><small>{language.region}</small></div>
            <button className={active === language.code ? 'button button--soft' : 'button button--dark'} onClick={() => onSwitch(language.code)}>{active === language.code ? <><Check size={18} /> Active pack</> : <>Switch to {language.name} <ArrowRight size={18} /></>}</button>
          </article>
        ))}
        <article className="library-card library-card--soon"><div className="library-art"><Sparkles size={32} /><span>Coming next</span></div><div className="library-copy"><span className="eyebrow">GROWING WITH CARE</span><h2>Ewe, Ga & more</h2><p>New packs will arrive after spelling, dialect and audio review with language experts.</p></div><span className="soon-pill"><ShieldCheck size={16} /> Review first</span></article>
      </div>
    </div>
  )
}

const FALLBACK_LEADERS: LeaderboardEntry[] = [
  { id: 'ama', name: 'Ama K.', xp: 2480, language: 'Twi' },
  { id: 'kwesi', name: 'Kwesi A.', xp: 2160, language: 'Fante' },
  { id: 'adwoa', name: 'Adwoa N.', xp: 1940, language: 'Twi' },
  { id: 'kofi', name: 'Kofi M.', xp: 1710, language: 'Twi' },
  { id: 'esi', name: 'Esi B.', xp: 1530, language: 'Fante' },
]

export function LeaderboardScreen({ profile, progress, entries }: { profile: Profile; progress: Progress; entries: LeaderboardEntry[] }) {
  const board = (entries.length ? entries : FALLBACK_LEADERS).map((entry, index) => ({ ...entry, rank: index + 1 }))
  const userRank = board.filter((entry) => entry.xp > progress.xp).length + 1
  return (
    <div className="page-enter">
      <PageIntro eyebrow="COMMUNITY" title="Learn together. Rise together." description="A friendly snapshot of this week’s most active learners." />
      <section className="leaderboard-card">
        <div className="leaderboard-title"><span><Trophy size={23} /></span><div><strong>Weekly explorers</strong><small>Demo community standings</small></div></div>
        <div className="leader-list">
          {board.map((entry) => <div className={entry.rank! <= 3 ? 'leader-row top' : 'leader-row'} key={entry.id}><span className="rank">{entry.rank! <= 3 ? ['①', '②', '③'][entry.rank! - 1] : entry.rank}</span><span className="leader-avatar">{entry.name.slice(0, 1)}</span><span className="leader-name"><strong>{entry.name}</strong><small>{entry.language}</small></span><strong>{entry.xp.toLocaleString()} XP</strong></div>)}
        </div>
      </section>
      <section className="your-rank"><span className="rank">{userRank}</span><span className="leader-avatar">{profile.name.slice(0, 1).toUpperCase()}</span><span><strong>You</strong><small>{getLanguage(profile.language).name}</small></span><strong>{progress.xp.toLocaleString()} XP</strong></section>
      <p className="privacy-copy"><ShieldCheck size={16} /> Your local progress is private. Cloud rankings are read-only in this MVP.</p>
    </div>
  )
}

export const gameIcon = (mode: GameMode) => mode === 'unscramble' ? Shuffle : mode === 'match' ? Zap : Search
