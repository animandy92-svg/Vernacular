import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Flame, Sparkles } from 'lucide-react'
import { LANGUAGES } from '../data/content'
import { DEFAULT_COMPANION } from '../lib/progress'
import type { CompanionAvatar, Difficulty, LanguageCode, Profile } from '../types'
import { Companion } from './Companion'

interface Props {
  onComplete: (profile: Profile) => void
  initialProfile?: Profile | null
  onCancel?: () => void
}

const LEVELS: { id: Difficulty; label: string; description: string }[] = [
  { id: 'beginner', label: 'Just starting', description: 'Greetings, numbers and everyday words' },
  { id: 'intermediate', label: 'I know a little', description: 'Common sentences, actions and places' },
  { id: 'advanced', label: 'Ready for more', description: 'Expressions, proverbs and conversation' },
]

const AVATARS: { id: CompanionAvatar; label: string; detail: string }[] = [
  { id: 'ama', label: 'Ama', detail: 'Bright & curious' },
  { id: 'kofi', label: 'Kofi', detail: 'Calm & clever' },
  { id: 'esi', label: 'Esi', detail: 'Bold & playful' },
  { id: 'kojo', label: 'Kojo', detail: 'Warm & adventurous' },
]

export function Onboarding({ onComplete, initialProfile, onCancel }: Props) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState(initialProfile?.name ?? '')
  const [localName, setLocalName] = useState(initialProfile?.localName ?? '')
  const [language, setLanguage] = useState<LanguageCode>(initialProfile?.language ?? 'twi')
  const [level, setLevel] = useState<Difficulty>(initialProfile?.level ?? 'beginner')
  const [dailyGoal, setDailyGoal] = useState(initialProfile?.dailyGoal ?? 5)
  const [companion, setCompanion] = useState(initialProfile?.companion ?? DEFAULT_COMPANION)

  useEffect(() => {
    const back = (event: Event) => {
      if (step > 0) { event.preventDefault(); setStep((current) => current - 1); window.scrollTo({ top: 0, behavior: 'instant' }) }
      else if (onCancel) { event.preventDefault(); onCancel() }
    }
    window.addEventListener('vernacular-back', back)
    return () => window.removeEventListener('vernacular-back', back)
  }, [step, onCancel])

  const canContinue = step === 0 ? name.trim().length > 1 : step === 2 ? companion.name.trim().length > 1 : true
  const learnerName = localName.trim() || name.trim()
  const greeting = language === 'kasem' ? 'Dɩnle' : 'Akwaaba'
  const chooseAvatar = (avatar: CompanionAvatar, suggestedName: string) => setCompanion((current) => ({
    ...current,
    avatar,
    name: AVATARS.some((item) => item.label === current.name) || current.name === 'Kora' ? suggestedName : current.name,
  }))

  const next = () => {
    if (!canContinue) return
    window.scrollTo({ top: 0, behavior: 'instant' })
    if (step < 3) setStep((current) => current + 1)
    else onComplete({ name: name.trim(), localName: localName.trim(), language, level, dailyGoal, companion: { ...companion, name: companion.name.trim() } })
  }

  return (
    <main className="onboarding-shell onboarding-shell--companion">
      <section className="onboarding-art" aria-label="Vernacular introduction">
        <div className="brand-lockup brand-lockup--light"><span className="brand-mark">V</span><span>VERNACULAR</span></div>
        <div className="onboarding-character-stage">
          <div className="art-copy"><span className="eyebrow eyebrow--gold">LEARN WITH A FRIEND</span><h1>Your language is a world worth exploring.</h1><p>Build a companion who walks, talks, points and celebrates through every lesson with you.</p></div>
          <Companion character={companion} pose={step === 2 ? 'talk' : step === 3 ? 'celebrate' : 'walk'} item={step === 3 ? 'star' : 'none'} size={230} />
        </div>
        <div className="art-footnote"><Sparkles size={17} /> Your guide grows as you learn</div>
      </section>

      <section className="onboarding-panel">
        <div className="onboarding-mobile-brand"><span className="brand-mark">V</span><span>VERNACULAR</span></div>
        {onCancel && <button className="text-action setup-cancel" onClick={onCancel}><ArrowLeft size={18} /> Cancel editing</button>}
        <div className="step-dots" aria-label={`Step ${step + 1} of 4`}>{[0, 1, 2, 3].map((item) => <span className={item <= step ? 'active' : ''} key={item} />)}</div>

        {step === 0 && (
          <div className="onboarding-step">
            <span className="eyebrow">WELCOME</span><h2>What should we call you?</h2><p>Your companion will use this name throughout your journey.</p>
            <label className="field-label" htmlFor="learner-name">Your name</label>
            <input autoComplete="given-name" enterKeyHint="next" id="learner-name" className="text-field" value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && canContinue && next()} placeholder="e.g. Amanda" maxLength={30} />
          </div>
        )}

        {step === 1 && (
          <div className="onboarding-step">
            <span className="eyebrow">YOUR ROOTS</span><h2>What is your local name?</h2><p>Share the name that feels like home. It is optional, and always stays on this device.</p>
            <label className="field-label" htmlFor="local-name">Local or heritage name <small>optional</small></label>
            <input enterKeyHint="next" id="local-name" className="text-field" value={localName} onChange={(event) => setLocalName(event.target.value)} placeholder="e.g. Adwoa" maxLength={30} />
            <span className="field-label field-label--compact">Language to explore</span>
            <div className="language-pill-row">
              {LANGUAGES.map((item) => <button aria-pressed={language === item.code} className={language === item.code ? 'selected' : ''} key={item.code} onClick={() => setLanguage(item.code)}><span style={{ backgroundColor: item.color }}>{item.name.slice(0, 2)}</span><strong>{item.name}</strong>{language === item.code && <Check size={16} />}</button>)}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-step companion-builder-step">
            <span className="eyebrow">CREATE YOUR COMPANION</span><h2>Build your learning buddy.</h2><p>They will carry clues, point things out and cheer beside you.</p>
            <div className="companion-builder">
              <div className="companion-preview"><Companion character={companion} pose="idle" item="none" size={190} interactive /><span className="companion-play-hint">Tap to play · drag to move</span></div>
              <div className="companion-controls">
                <label className="field-label" htmlFor="companion-name">Companion name</label>
                <input id="companion-name" className="text-field text-field--small" value={companion.name} onChange={(event) => setCompanion((current) => ({ ...current, name: event.target.value }))} maxLength={18} />
                <span className="field-label field-label--compact">Choose a look</span>
                <div className="avatar-choice-grid">{AVATARS.map((avatar) => <button aria-pressed={companion.avatar === avatar.id} className={companion.avatar === avatar.id ? 'selected' : ''} key={avatar.id} onClick={() => chooseAvatar(avatar.id, avatar.label)}><Companion character={{ avatar: avatar.id, name: avatar.label }} pose={companion.avatar === avatar.id ? 'wave' : 'idle'} size={58} animated={companion.avatar === avatar.id} /><span><strong>{avatar.label}</strong><small>{avatar.detail}</small></span>{companion.avatar === avatar.id && <Check size={16} />}</button>)}</div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-step meet-step">
            <span className="eyebrow">MEET YOUR GUIDE</span>
            <div className="meet-companion"><Companion character={companion} pose="wave" item="star" size={190} /><div className="companion-speech"><strong>{greeting}, {learnerName}!</strong><p>I’m {companion.name}. I’ll explore, practice and celebrate every new word with you.</p></div></div>
            <span className="field-label">Choose your pace</span>
            <div className="level-grid level-grid--compact">{LEVELS.map((item) => <button aria-pressed={level === item.id} className={`level-choice ${level === item.id ? 'selected' : ''}`} key={item.id} onClick={() => setLevel(item.id)}><strong>{item.label}</strong><small>{item.description}</small></button>)}</div>
            <div className="goal-picker"><div><span className="goal-icon"><Flame size={20} /></span><span><strong>Daily goal</strong><small>puzzles per day</small></span></div><div className="segmented-control">{[3, 5, 10].map((goal) => <button aria-pressed={dailyGoal === goal} className={dailyGoal === goal ? 'selected' : ''} key={goal} onClick={() => setDailyGoal(goal)}>{goal}</button>)}</div></div>
          </div>
        )}

        <div className="onboarding-actions">
          {step > 0 && <button className="button button--ghost" onClick={() => { setStep((current) => current - 1); window.scrollTo({ top: 0, behavior: 'instant' }) }}><ArrowLeft size={18} /> Back</button>}
          <button className="button button--primary" disabled={!canContinue} onClick={next}>{step === 3 ? <>{initialProfile ? 'Save changes' : 'Start exploring'} <Sparkles size={18} /></> : <>Continue <ArrowRight size={18} /></>}</button>
        </div>
      </section>
    </main>
  )
}
