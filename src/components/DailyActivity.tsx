import { Check, Flame, Target } from 'lucide-react'
import { dateKey, weeklyActivity } from '../lib/progress'
import type { Profile, Progress } from '../types'

export function DailyActivity({ profile, progress }: { profile: Profile; progress: Progress }) {
  const count = progress.activity?.[dateKey()] ?? 0
  const goal = Math.max(1, profile.dailyGoal)
  const done = count >= goal
  return (
    <section className={`activity-card ${done ? 'activity-card--done' : ''}`} aria-label="Daily learning goal">
      <div className="activity-heading">
        <span className="activity-icon">{done ? <Check size={22} /> : <Target size={22} />}</span>
        <div><span className="eyebrow">TODAY’S LITTLE STEPS</span><h2>{done ? 'Daily goal complete!' : 'Make a little room for learning.'}</h2></div>
        <strong>{count}<span> / {goal}</span></strong>
      </div>
      <div className="goal-progress" role="progressbar" aria-label="Puzzles completed today" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(count, goal)}><span style={{ width: `${Math.min(100, count / goal * 100)}%` }} /></div>
      <div className="activity-week">{weeklyActivity(progress).map((day) => <div className={`${day.count ? 'complete' : ''} ${day.key === dateKey() ? 'today' : ''}`} key={day.key} aria-label={`${day.label}, ${day.count} puzzles`}><span>{day.count ? <Check size={16} /> : day.key === dateKey() ? <Flame size={16} /> : <i />}</span><small>{day.label}</small></div>)}</div>
      <p>{done ? 'You showed up for your language. Everything else is a bonus.' : `${goal - count} more puzzle${goal - count === 1 ? '' : 's'} to reach today’s goal. You’ve got this.`}</p>
    </section>
  )
}
