import { BarChart3, BookOpen, Flame, Home, Languages, Trophy } from 'lucide-react'
import { getLanguage } from '../data/content'
import { profileInitials } from '../lib/progress'
import type { Profile, Progress, Screen } from '../types'

interface HeaderProps {
  profile: Profile
  progress: Progress
  onNavigate: (screen: Screen) => void
}

export function AppHeader({ profile, progress, onNavigate }: HeaderProps) {
  return (
    <header className="app-header">
      <button className="brand-lockup" onClick={() => onNavigate('home')} aria-label="Go home">
        <span className="brand-mark">V</span>
        <span>VERNACULAR</span>
      </button>
      <div className="header-actions">
        <button className="streak-pill" onClick={() => onNavigate('progress')}><Flame size={17} /> {progress.streak}<span> day streak</span></button>
        <button className="avatar" onClick={() => onNavigate('progress')} aria-label="Open profile">{profileInitials(profile)}</button>
      </div>
    </header>
  )
}

interface NavProps {
  active: Screen
  onNavigate: (screen: Screen) => void
}

const ITEMS: { id: Screen; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'play', label: 'Play', icon: BookOpen },
  { id: 'progress', label: 'Progress', icon: BarChart3 },
  { id: 'library', label: 'Languages', icon: Languages },
  { id: 'leaderboard', label: 'Leaders', icon: Trophy },
]

export function AppNav({ active, onNavigate }: NavProps) {
  return (
    <nav className="app-nav" aria-label="Main navigation">
      {ITEMS.map((item) => {
        const Icon = item.icon
        return (
          <button className={active === item.id ? 'active' : ''} key={item.id} onClick={() => onNavigate(item.id)}>
            <Icon size={21} strokeWidth={active === item.id ? 2.5 : 2} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="page-intro">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  )
}

export function LanguageBadge({ profile }: { profile: Profile }) {
  const language = getLanguage(profile.language)
  return <span className="language-badge" style={{ '--language-color': language.color } as React.CSSProperties}>{language.name}</span>
}
