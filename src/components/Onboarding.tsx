import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Flame, Sparkles } from 'lucide-react'
import { LANGUAGES } from '../data/content'
import type { Difficulty, LanguageCode, Profile } from '../types'

interface Props {
  onComplete: (profile: Profile) => void
}

const LEVELS: { id: Difficulty; label: string; description: string }[] = [
  { id: 'beginner', label: 'Just starting', description: 'Greetings, numbers and everyday words' },
  { id: 'intermediate', label: 'I know a little', description: 'Common sentences, actions and places' },
  { id: 'advanced', label: 'Ready for more', description: 'Expressions, proverbs and conversation' },
]

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [language, setLanguage] = useState<LanguageCode>('twi')
  const [level, setLevel] = useState<Difficulty>('beginner')
  const [dailyGoal, setDailyGoal] = useState(5)

  const canContinue = step !== 0 || name.trim().length > 1

  const next = () => {
    if (step < 2) setStep((current) => current + 1)
    else onComplete({ name: name.trim(), language, level, dailyGoal })
  }

  return (
    <main className="onboarding-shell">
      <section className="onboarding-art" aria-label="Vernacular introduction">
        <div className="brand-lockup brand-lockup--light">
          <span className="brand-mark">V</span>
          <span>VERNACULAR</span>
        </div>
        <div className="art-copy">
          <span className="eyebrow eyebrow--gold">LEARN THROUGH PLAY</span>
          <h1>Your language is a world worth exploring.</h1>
          <p>Build vocabulary, hear every word and keep culture close — one puzzle at a time.</p>
        </div>
        <div className="word-tiles" aria-hidden="true">
          {'AKWAABA'.split('').map((letter, index) => (
            <span key={`${letter}-${index}`} style={{ '--delay': `${index * 80}ms` } as React.CSSProperties}>
              {letter}
            </span>
          ))}
        </div>
        <div className="art-footnote"><Sparkles size={17} /> Made for curious minds everywhere</div>
      </section>

      <section className="onboarding-panel">
        <div className="onboarding-mobile-brand">
          <span className="brand-mark">V</span>
          <span>VERNACULAR</span>
        </div>
        <div className="step-dots" aria-label={`Step ${step + 1} of 3`}>
          {[0, 1, 2].map((item) => <span className={item <= step ? 'active' : ''} key={item} />)}
        </div>

        {step === 0 && (
          <div className="onboarding-step">
            <span className="eyebrow">WELCOME</span>
            <h2>What should we call you?</h2>
            <p>This name stays on your device and makes your learning space feel like yours.</p>
            <label className="field-label" htmlFor="learner-name">Your name</label>
            <input
              autoFocus
              id="learner-name"
              className="text-field"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && canContinue && next()}
              placeholder="e.g. Ama"
              maxLength={30}
            />
          </div>
        )}

        {step === 1 && (
          <div className="onboarding-step">
            <span className="eyebrow">CHOOSE YOUR PATH</span>
            <h2>Which language calls you?</h2>
            <p>You can switch languages any time from your library.</p>
            <div className="choice-stack">
              {LANGUAGES.map((item) => (
                <button
                  className={`language-choice ${language === item.code ? 'selected' : ''}`}
                  key={item.code}
                  onClick={() => setLanguage(item.code)}
                >
                  <span className="language-monogram" style={{ backgroundColor: item.color }}>{item.name.slice(0, 2)}</span>
                  <span><strong>{item.name}</strong><small>{item.region}</small></span>
                  {language === item.code && <Check size={20} />}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-step">
            <span className="eyebrow">MAKE IT YOURS</span>
            <h2>Set your starting pace.</h2>
            <p>Little and often wins. You can change these choices later.</p>
            <span className="field-label">Your level</span>
            <div className="level-grid">
              {LEVELS.map((item) => (
                <button className={`level-choice ${level === item.id ? 'selected' : ''}`} key={item.id} onClick={() => setLevel(item.id)}>
                  <strong>{item.label}</strong><small>{item.description}</small>
                </button>
              ))}
            </div>
            <div className="goal-picker">
              <div><span className="goal-icon"><Flame size={20} /></span><span><strong>Daily goal</strong><small>puzzles per day</small></span></div>
              <div className="segmented-control">
                {[3, 5, 10].map((goal) => (
                  <button className={dailyGoal === goal ? 'selected' : ''} key={goal} onClick={() => setDailyGoal(goal)}>{goal}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="onboarding-actions">
          {step > 0 && <button className="button button--ghost" onClick={() => setStep((current) => current - 1)}><ArrowLeft size={18} /> Back</button>}
          <button className="button button--primary" disabled={!canContinue} onClick={next}>
            {step === 2 ? 'Start learning' : 'Continue'} <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </main>
  )
}
