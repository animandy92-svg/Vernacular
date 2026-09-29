import { ArrowRight, BookOpen, Check, Clock3, LockKeyhole, RotateCcw, Sparkles } from 'lucide-react'
import { COURSE_CHAPTERS, courseWords, lessonsFor, lessonUnlocked, nextLesson, type CourseLesson } from '../data/course'
import { getLanguage } from '../data/content'
import { ListeningLibrary } from './ListeningLibrary'
import { dueWords, learningCounts, memoryFor } from '../lib/learning'
import type { Profile, Progress, WordEntry } from '../types'

interface Props {
  profile: Profile
  progress: Progress
  words: WordEntry[]
  today: string
  onLesson: (lesson: CourseLesson) => void
  onReview: () => void
}

export function ReviewCard({ progress, words, today, onReview }: Pick<Props, 'progress' | 'words' | 'today' | 'onReview'>) {
  const due = dueWords(words, progress, today)
  const memory = memoryFor(progress)
  const nextDue = words.map((word) => memory[word.id]?.dueOn).filter((day): day is string => !!day && day > today).sort()[0]
  return <section className="review-queue" aria-label="Memory review">
    <span className="course-icon"><RotateCcw size={23} /></span>
    <div><span className="eyebrow">MAKE IT STICK</span><h2>{due.length ? `${due.length} ready to revisit` : 'A little time helps memory'}</h2><p>{due.length ? 'Try recalling the words and phrases you have already practised.' : nextDue ? `Your next review is ${new Date(`${nextDue}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}. You can keep learning today.` : 'Finish a lesson or puzzle. Your words will return for a check on a later day.'}</p></div>
    {due.length > 0 && <button className="button button--dark" onClick={onReview}>Review {Math.min(due.length, 10)} <ArrowRight size={17} /></button>}
  </section>
}

export function LearningSummary({ progress, words }: Pick<Props, 'progress' | 'words'>) {
  const counts = learningCounts(words, progress)
  return <section className="learning-summary" aria-label="Word and phrase memory">
    <div><strong>{counts.introduced}</strong><span>Introduced</span></div>
    <div><strong>{counts.practising}</strong><span>Practising</span></div>
    <div><strong>{counts.remembered}</strong><span>Remembered</span></div>
    <p>“Remembered” means three successful scheduled reviews on separate days. Puzzles and lesson checks count as practice.</p>
  </section>
}

export function CourseScreen({ profile, progress, words, today, onLesson, onReview, onPuzzles }: Props & { onPuzzles: () => void }) {
  const lessons = lessonsFor(profile.language)
  const current = nextLesson(progress, profile.language)
  const completed = lessons.filter((lesson) => !!progress.lessons?.[lesson.id]).length
  return <div className="page-enter course-page">
    <div className="page-intro"><span className="eyebrow">{getLanguage(profile.language).name.toUpperCase()} FOUNDATIONS</span><h1>A little closer to home.</h1><p>Learn useful words and expressions. Practise them in context. Come back to remember.</p></div>
    <section className="course-overview">
      <span className="course-icon"><BookOpen size={28} /></span><div><h2>{completed === lessons.length ? 'Your foundation is taking shape' : 'Your guided journey'}</h2><p>{completed} of {lessons.length} lessons · {courseWords(profile.language).length} words & phrases · 4 chapters</p>
      <div className="course-track" role="progressbar" aria-label="Lessons completed" aria-valuemin={0} aria-valuemax={lessons.length} aria-valuenow={completed}><span style={{ width: `${completed / lessons.length * 100}%` }} /></div></div>
      {current && <button className="button button--primary" onClick={() => onLesson(current)}>{completed ? 'Continue learning' : 'Start your first lesson'} <ArrowRight size={18} /></button>}
    </section>
    <p className="course-preview-note">Preview course · Guided cards support text practice while language review and individual word recordings are in progress.</p>
    <ReviewCard progress={progress} words={words} today={today} onReview={onReview} />
    {profile.language === 'twi' && <ListeningLibrary />}
    {COURSE_CHAPTERS.map((chapter, chapterIndex) => {
      const chapterLessons = lessons.filter((lesson) => lesson.chapter === chapterIndex)
      const chapterDone = chapterLessons.filter((lesson) => !!progress.lessons?.[lesson.id]).length
      return <section className={`course-chapter course-chapter--${chapter.environment}`} key={chapter.title}>
      <div className="chapter-heading"><span>0{chapterIndex + 1}</span><div className="chapter-heading-copy"><span className="eyebrow">{chapterIndex === 2 && profile.language !== 'twi' ? 'FOOD, NUMBERS & EVERYDAY WORDS' : chapter.description}</span><h2>{chapter.title}</h2><div className="chapter-progress"><span>{chapterDone} of {chapterLessons.length} lessons</span><div className="course-track" role="progressbar" aria-label={`${chapter.title} progress`} aria-valuemin={0} aria-valuemax={chapterLessons.length} aria-valuenow={chapterDone}><span style={{ width: `${chapterDone / chapterLessons.length * 100}%` }} /></div></div></div></div>
      <ol className="course-lessons">{chapterLessons.map((lesson) => {
        const done = !!progress.lessons?.[lesson.id]
        const unlocked = lessonUnlocked(lesson, progress, profile.language)
        const isNext = current?.id === lesson.id
        return <li key={lesson.id}><button disabled={!unlocked} className={`course-lesson ${isNext ? 'course-lesson--next' : ''} ${done ? 'course-lesson--done' : ''}`} onClick={() => onLesson(lesson)} aria-label={`${lesson.title}${done ? ', completed, practise again' : !unlocked ? ', locked' : ''}`}>
          <span className="lesson-number">{done ? <Check size={21} /> : !unlocked ? <LockKeyhole size={19} /> : lesson.checkpoint ? <Sparkles size={21} /> : lessons.indexOf(lesson) + 1}</span>
          <span className="lesson-copy"><strong>{lesson.title}</strong><small>{lesson.goal}</small><em>{done ? 'Completed · practise again' : !unlocked ? 'Complete the previous lesson' : <><Clock3 size={12} /> 3–5 min · {lesson.checkpoint ? 'Checkpoint' : 'Learn & practise'}</>}</em></span>
          {unlocked && <ArrowRight size={19} />}
        </button></li>
      })}</ol>
    </section>
    })}
    <section className="course-puzzles"><BookOpen size={22} /><div><h2>In the mood for a puzzle?</h2><p>Your word games are still here whenever you want extra practice.</p></div><button className="button button--ghost" onClick={onPuzzles}>Browse puzzles <ArrowRight size={17} /></button></section>
  </div>
}
