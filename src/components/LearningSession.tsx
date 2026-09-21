import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Check, Lightbulb, X } from 'lucide-react'
import { COURSE_CHAPTERS, type CourseLesson } from '../data/course'
import { distinctQuizWords, shuffle } from '../lib/game'
import { isRecallCorrect } from '../lib/learning'
import type { GameResult, Profile, RecallAttempt, WordEntry } from '../types'
import { Companion } from './Companion'
import { Pronunciation } from './Pronunciation'
import { SpeakingPractice } from './SpeakingPractice'

export interface LearningSessionData {
  key: number
  kind: 'lesson' | 'review'
  entries: WordEntry[]
  lesson?: CourseLesson
}

interface Props {
  session: LearningSessionData
  profile: Profile
  saved: boolean
  onFinish: (result: GameResult) => void
  onExit: () => void
}

export function LearningSession({ session, profile, saved, onFinish, onExit }: Props) {
  const { lesson, entries, kind } = session
  const [phase, setPhase] = useState<'teach' | 'practice' | 'complete'>(kind === 'lesson' ? 'teach' : 'practice')
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState<boolean | null>(null)
  const [attempts, setAttempts] = useState<RecallAttempt[]>([])
  const [confirming, setConfirming] = useState(false)
  const finished = useRef(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const answerRef = useRef<HTMLInputElement>(null)
  const questions = useMemo(() => {
    const list = shuffle(entries).map((entry) => ({ entry, prompt: `How do you say “${entry.translation}”?`, mission: false }))
    if (lesson) list.push({ entry: entries.find((entry) => entry.id === lesson.mission.wordId)!, prompt: lesson.mission.prompt, mission: true })
    return list.map((question) => ({ ...question, options: shuffle(distinctQuizWords([question.entry, ...shuffle(entries)]).slice(0, 4)) }))
  }, [entries, lesson])
  const question = questions[index]
  const entry = phase === 'teach' ? entries[index] : question?.entry
  const title = kind === 'review' ? 'A little memory practice' : lesson!.title
  const close = () => phase === 'complete' ? onExit() : setConfirming(true)

  useEffect(() => {
    const back = (event: Event) => { event.preventDefault(); if (phase === 'complete') onExit(); else setConfirming((open) => !open) }
    window.addEventListener('vernacular-back', back)
    return () => window.removeEventListener('vernacular-back', back)
  }, [phase, onExit])
  useEffect(() => {
    if (!confirming) return
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [confirming])
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    titleRef.current?.focus()
  }, [phase, index])

  const submit = (value: string) => {
    if (feedback !== null || finished.current) return
    const correct = isRecallCorrect(value, entry.word)
    setAnswer(value)
    setFeedback(correct)
    setAttempts((current) => [...current, { wordId: entry.id, correct }])
  }
  const next = () => {
    setAnswer('')
    setFeedback(null)
    if (phase === 'teach') {
      if (index === entries.length - 1) { setPhase('practice'); setIndex(0) } else setIndex(index + 1)
    } else if (index === questions.length - 1) {
      if (finished.current) return
      finished.current = true
      const score = attempts.filter((attempt) => attempt.correct).length
      onFinish({ score, total: questions.length, wordIds: entries.map((word) => word.id), perfect: score === questions.length, recall: attempts, lessonId: lesson?.id, review: kind === 'review' })
      setPhase('complete')
    } else setIndex(index + 1)
  }
  const total = phase === 'teach' ? entries.length : questions.length
  const score = attempts.filter((attempt) => attempt.correct).length
  const specialLetters = [...new Set(entries.flatMap((word) => Array.from(word.word)).filter((letter) => /[ɛɔɩʋəŋ]/i.test(letter)))].sort()

  return <div className={`learning-session game-session game-session--world-${lesson ? COURSE_CHAPTERS[lesson.chapter].environment : 'library'}`}>
    <header className="learning-header"><button className="icon-button" onClick={close} aria-label="Exit lesson"><X size={22} /></button><div><strong>{title}</strong><span>{phase === 'complete' ? 'Practice complete' : phase === 'teach' ? '1 · Learn the expressions' : kind === 'review' ? 'Recall without hints' : '2 · Put them into practice'}</span><div className="course-track" role="progressbar" aria-label="Session progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={phase === 'complete' ? 100 : Math.round(index / total * 100)}><span style={{ width: `${phase === 'complete' ? 100 : index / total * 100}%` }} /></div></div><small>{phase === 'complete' ? <Check size={22} /> : `${index + 1}/${total}`}</small></header>
    <main className="learning-stage">
      {phase === 'complete' ? <div className="lesson-complete">
        <Companion character={profile.companion} pose="celebrate" item="star" size={150} />
        <span className="eyebrow">{kind === 'review' ? 'REVIEW COMPLETE' : 'LESSON COMPLETE'}</span>
        <h1 ref={titleRef} tabIndex={-1}>A little more familiar.</h1>
        <p>{lesson?.goal ?? 'You gave your memory another chance to practise.'}</p>
        <div className="lesson-result"><strong>{score}/{questions.length}<small>correct first time</small></strong><strong>+{score * 12 + (score === questions.length ? 25 : 10)}<small>XP earned</small></strong></div>
        <p>{kind === 'review' ? 'Words you missed return tomorrow. Successful scheduled reviews gradually move further apart.' : 'Your expressions will return for a memory check on a later day. Completing a lesson is practice, not a fluency assessment.'}</p>
        {!saved && <p role="alert" className="lesson-feedback lesson-feedback--retry">Progress could not be saved on this device. Keep the app open and free up storage.</p>}
        <button className="button button--primary" onClick={onExit}>Back to my journey <ArrowRight size={18} /></button>
      </div> : <>
        <span className="eyebrow">{phase === 'teach' ? 'MEET AN EXPRESSION' : question.mission ? 'TRY IT IN CONTEXT' : kind === 'review' ? 'WHAT DO YOU REMEMBER?' : 'YOUR TURN'}</span>
        <h1 ref={titleRef} tabIndex={-1}>{phase === 'teach' ? entry.word : question.prompt}</h1>
        {phase === 'teach' ? <>
          <p className="teaching-meaning">{entry.translation}</p>
          {entry.phonetic && <p className="teaching-phonetic">Written guide: {entry.phonetic}</p>}
          <Pronunciation entry={entry} nativeOnly />
          <SpeakingPractice key={entry.id} />
          <div className="teaching-tip"><Lightbulb size={20} /><p>{lesson!.tip}</p></div>
          <p className="lesson-content-note">Preview expression · awaiting language review.</p>
        </> : <>
          {kind === 'lesson' ? <div className="lesson-choices">{question.options.map((option) => <button disabled={feedback !== null} key={option.id} onClick={() => submit(option.word)} className={feedback !== null && option.id === entry.id ? 'correct' : feedback === false && answer === option.word ? 'incorrect' : ''}>{option.word}{feedback !== null && option.id === entry.id && <Check size={19} />}</button>)}</div> : <form onSubmit={(event) => { event.preventDefault(); if (answer.trim()) submit(answer) }}>
            <label className="field-label" htmlFor="recall-answer">Your answer</label>
            <input ref={answerRef} id="recall-answer" className="text-field" value={answer} disabled={feedback !== null} onChange={(event) => setAnswer(event.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} enterKeyHint="done" placeholder="Type the word or expression" />
            {specialLetters.length > 0 && <div className="recall-letters" aria-label="Language letters">{specialLetters.map((letter) => <button type="button" key={letter} disabled={feedback !== null} onClick={() => { const input = answerRef.current; const start = input?.selectionStart ?? answer.length; const end = input?.selectionEnd ?? start; setAnswer(answer.slice(0, start) + letter + answer.slice(end)); input?.focus(); requestAnimationFrame(() => input?.setSelectionRange(start + 1, start + 1)) }}>{letter}</button>)}</div>}
            {feedback === null && <div className="recall-actions"><button type="submit" className="button button--dark" disabled={!answer.trim()}>Check answer</button><button type="button" className="button button--ghost" onClick={() => submit('')}>I don’t remember</button></div>}
          </form>}
          {feedback !== null && <div className={`lesson-feedback ${feedback ? 'lesson-feedback--correct' : 'lesson-feedback--retry'}`} role="status"><strong>{feedback ? 'That’s it.' : 'Here is the expression to practise.'}</strong><p><b>{entry.word}</b> — {entry.translation}</p>{!feedback && <small>{kind === 'review' ? 'We’ll bring this back tomorrow.' : 'Take a moment to read it before continuing.'}</small>}</div>}
        </>}
        <div className="learning-companion"><Companion character={profile.companion} pose={feedback === true ? 'celebrate' : feedback === false ? 'encourage' : 'point'} item="book" size={80} /><p>{phase === 'teach' ? 'Take your time. We learn it together before we try it.' : feedback === false ? 'Every reminder is another chance to learn.' : 'A small step for today. A little closer to home.'}</p></div>
        {(phase === 'teach' || feedback !== null) && <button className="button button--primary lesson-next" onClick={next}>{phase === 'teach' ? index === entries.length - 1 ? 'Let’s practise' : 'Next expression' : index === questions.length - 1 ? 'Finish practice' : 'Continue'} <ArrowRight size={18} /></button>}
      </>}
    </main>
    <dialog ref={dialog} className="exit-dialog" onCancel={() => setConfirming(false)} aria-labelledby="leave-lesson-title"><h2 id="leave-lesson-title">Leave this practice?</h2><p>This session will start again next time. Earlier completed lessons and reviews are saved.</p><button autoFocus className="button button--primary" onClick={() => setConfirming(false)}>Keep practising</button><button className="button button--ghost" onClick={onExit}>Leave practice</button></dialog>
  </div>
}
