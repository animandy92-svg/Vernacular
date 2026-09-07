import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Delete, RotateCcw, Search, Sparkles, Trophy, Volume2, X } from 'lucide-react'
import { areAdjacent, generateWordGrid, normalizeWord, samePath, scramble, shuffle, type GridPosition } from '../lib/game'
import type { GameMode, GameResult, WordEntry } from '../types'
import { speakWord } from './Dashboard'

interface GameProps {
  mode: GameMode
  words: WordEntry[]
  onFinish: (result: GameResult) => void
  onExit: () => void
}

function GameHeader({ label, current, total, onExit }: { label: string; current: number; total: number; onExit: () => void }) {
  return (
    <header className="game-header">
      <button className="icon-button" onClick={onExit} aria-label="Exit puzzle"><X size={22} /></button>
      <div><span>{label}</span><div className="game-progress"><i style={{ width: `${Math.round((current / total) * 100)}%` }} /></div></div>
      <strong>{current}/{total}</strong>
    </header>
  )
}

function UnscrambleGame({ words, daily, onFinish, onExit }: Omit<GameProps, 'mode'> & { daily: boolean }) {
  const total = daily ? 3 : 5
  const rounds = useMemo(() => shuffle(words).slice(0, total), [words, total])
  const [round, setRound] = useState(0)
  const [selected, setSelected] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [mastered, setMastered] = useState<string[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const entry = rounds[round]
  const letters = useMemo(() => entry ? scramble(entry.word) : [], [entry])
  const answer = selected.map((index) => letters[index]).join('')

  if (!entry) return <div className="game-stage"><p>No words are available in this pack yet.</p><button className="button button--dark" onClick={onExit}>Go back</button></div>

  const chooseLetter = (index: number) => {
    if (selected.includes(index) || feedback === 'correct') return
    setFeedback(null)
    setSelected((current) => [...current, index])
  }

  const submit = () => {
    if (normalizeWord(answer) === normalizeWord(entry.word)) {
      setScore((current) => current + 1)
      setMastered((current) => [...current, entry.id])
      setFeedback('correct')
    } else {
      setFeedback('wrong')
    }
  }

  const next = () => {
    const nextScore = score
    const nextWords = mastered
    if (round === rounds.length - 1) {
      onFinish({ score: nextScore, total: rounds.length, wordIds: nextWords, perfect: nextScore === rounds.length })
      return
    }
    setRound((current) => current + 1)
    setSelected([])
    setFeedback(null)
  }

  return (
    <div className="game-shell page-enter">
      <GameHeader label={daily ? 'Daily challenge' : 'Unscramble'} current={round + 1} total={rounds.length} onExit={onExit} />
      <main className="game-stage">
        <span className="eyebrow">PUT THE LETTERS IN ORDER</span>
        <h1>{entry.translation}</h1>
        <button className="listen-prompt" onClick={() => speakWord(entry)}><Volume2 size={18} /> Hear the word</button>
        <div className={`answer-slots ${feedback ? `answer-slots--${feedback}` : ''}`} aria-label={`Your answer: ${answer || 'empty'}`}>
          {Array.from(entry.word).map((_, index) => <span key={index}>{answer[index] ?? ''}</span>)}
        </div>
        <div className="letter-bank">
          {letters.map((letter, index) => <button className={selected.includes(index) ? 'used' : ''} onClick={() => chooseLetter(index)} key={`${letter}-${index}`}>{letter}</button>)}
        </div>
        <button className="clear-answer" onClick={() => { setSelected([]); setFeedback(null) }} disabled={!selected.length || feedback === 'correct'}><Delete size={17} /> Clear answer</button>
        {feedback && (
          <div className={`feedback feedback--${feedback}`}>
            <span>{feedback === 'correct' ? <Check /> : <RotateCcw />}</span>
            <div><strong>{feedback === 'correct' ? 'Beautiful — that’s it!' : 'Almost. Rearrange and try again.'}</strong><p>{feedback === 'correct' ? entry.example : `Hint: it begins with “${Array.from(entry.word)[0]}”.`}</p></div>
          </div>
        )}
      </main>
      <footer className="game-footer">
        {feedback === 'correct' ? <button className="button button--primary" onClick={next}>{round === rounds.length - 1 ? 'See results' : 'Next word'} <ArrowRight size={18} /></button> : <button className="button button--dark" onClick={submit} disabled={answer.length !== Array.from(entry.word).length}>Check word</button>}
      </footer>
    </div>
  )
}

function MatchGame({ words, onFinish, onExit }: Omit<GameProps, 'mode'>) {
  const pairs = useMemo(() => shuffle(words).slice(0, 5), [words])
  const translations = useMemo(() => shuffle(pairs), [pairs])
  const [left, setLeft] = useState<string | null>(null)
  const [right, setRight] = useState<string | null>(null)
  const [matched, setMatched] = useState<string[]>([])
  const [mistakes, setMistakes] = useState(0)
  const [wrong, setWrong] = useState(false)

  useEffect(() => {
    if (pairs.length && matched.length === pairs.length) {
      const timer = window.setTimeout(() => onFinish({ score: Math.max(0, pairs.length - mistakes), total: pairs.length, wordIds: matched, perfect: mistakes === 0 }), 550)
      return () => window.clearTimeout(timer)
    }
  }, [matched, mistakes, onFinish, pairs.length])

  const compare = (wordId: string, translationId: string) => {
    if (wordId === translationId) {
      setMatched((current) => [...current, wordId])
      setLeft(null)
      setRight(null)
      setWrong(false)
    } else {
      setMistakes((current) => current + 1)
      setWrong(true)
      window.setTimeout(() => { setLeft(null); setRight(null); setWrong(false) }, 420)
    }
  }

  const chooseLeft = (id: string) => {
    if (matched.includes(id)) return
    setLeft(id)
    setWrong(false)
    if (right) compare(id, right)
  }
  const chooseRight = (id: string) => {
    if (matched.includes(id)) return
    setRight(id)
    setWrong(false)
    if (left) compare(left, id)
  }

  return (
    <div className="game-shell page-enter">
      <GameHeader label="Word match" current={matched.length} total={pairs.length} onExit={onExit} />
      <main className="game-stage match-stage">
        <span className="eyebrow">CONNECT EACH PAIR</span>
        <h1>Which words belong together?</h1>
        <p>Tap a word, then tap its English meaning.</p>
        <div className={`match-board ${wrong ? 'is-wrong' : ''}`}>
          <div>{pairs.map((entry) => <button className={`${left === entry.id ? 'selected' : ''} ${matched.includes(entry.id) ? 'matched' : ''}`} disabled={matched.includes(entry.id)} onClick={() => chooseLeft(entry.id)} key={entry.id}>{entry.word}</button>)}</div>
          <span className="match-line" />
          <div>{translations.map((entry) => <button className={`${right === entry.id ? 'selected' : ''} ${matched.includes(entry.id) ? 'matched' : ''}`} disabled={matched.includes(entry.id)} onClick={() => chooseRight(entry.id)} key={entry.id}>{entry.translation}</button>)}</div>
        </div>
        <div className="match-count"><Check size={17} /> {matched.length} of {pairs.length} pairs found</div>
      </main>
    </div>
  )
}

const cellKey = (cell: GridPosition) => `${cell.row}-${cell.col}`

function SearchGame({ words, onFinish, onExit }: Omit<GameProps, 'mode'>) {
  const candidates = useMemo(() => shuffle(words.filter((entry) => Array.from(entry.word).length <= 8)).slice(0, 4), [words])
  const puzzle = useMemo(() => generateWordGrid(candidates), [candidates])
  const [path, setPath] = useState<GridPosition[]>([])
  const [found, setFound] = useState<string[]>([])

  useEffect(() => {
    if (puzzle.placements.length && found.length === puzzle.placements.length) {
      const timer = window.setTimeout(() => onFinish({ score: found.length, total: puzzle.placements.length, wordIds: found, perfect: true }), 650)
      return () => window.clearTimeout(timer)
    }
  }, [found, onFinish, puzzle.placements.length])

  const chooseCell = (cell: GridPosition) => {
    if (path.some((item) => cellKey(item) === cellKey(cell))) {
      setPath([cell])
      return
    }
    const nextPath = path.length && areAdjacent(path[path.length - 1], cell) ? [...path, cell] : [cell]
    const match = puzzle.placements.find((placement) => !found.includes(placement.word.id) && (samePath(nextPath, placement.cells) || samePath(nextPath, [...placement.cells].reverse())))
    if (match) {
      setFound((current) => [...current, match.word.id])
      setPath([])
    } else if (nextPath.length >= 8) setPath([cell])
    else setPath(nextPath)
  }

  const foundCells = new Set(puzzle.placements.filter((placement) => found.includes(placement.word.id)).flatMap((placement) => placement.cells.map(cellKey)))
  const selectedCells = new Set(path.map(cellKey))

  return (
    <div className="game-shell page-enter">
      <GameHeader label="Word search" current={found.length} total={puzzle.placements.length} onExit={onExit} />
      <main className="game-stage search-stage">
        <span className="eyebrow">FIND THE HIDDEN WORDS</span>
        <h1>Trace a path through the grid.</h1>
        <p>Tap adjacent letters in a straight line. Words may run across, down or diagonally.</p>
        <div className="search-words">{puzzle.placements.map((placement) => <span className={found.includes(placement.word.id) ? 'found' : ''} key={placement.word.id}>{found.includes(placement.word.id) && <Check size={14} />}{placement.word.word}</span>)}</div>
        <div className="letter-grid" style={{ '--grid-size': puzzle.grid.length } as React.CSSProperties}>
          {puzzle.grid.flatMap((row, rowIndex) => row.map((letter, colIndex) => {
            const key = `${rowIndex}-${colIndex}`
            return <button className={`${selectedCells.has(key) ? 'selected' : ''} ${foundCells.has(key) ? 'found' : ''}`} key={key} onClick={() => chooseCell({ row: rowIndex, col: colIndex })}>{letter}</button>
          }))}
        </div>
        <button className="clear-answer" disabled={!path.length} onClick={() => setPath([])}><RotateCcw size={16} /> Clear selection</button>
      </main>
    </div>
  )
}

export function GamePlay({ mode, words, onFinish, onExit }: GameProps) {
  if (mode === 'match') return <MatchGame words={words} onFinish={onFinish} onExit={onExit} />
  if (mode === 'search') return <SearchGame words={words} onFinish={onFinish} onExit={onExit} />
  return <UnscrambleGame words={words} daily={mode === 'daily'} onFinish={onFinish} onExit={onExit} />
}

export function ResultScreen({ result, mode, onDone, onReplay }: { result: GameResult; mode: GameMode; onDone: () => void; onReplay: () => void }) {
  const earnedXp = result.score * 12 + (result.perfect ? 25 : 10)
  const percent = Math.round((result.score / Math.max(result.total, 1)) * 100)
  return (
    <div className="results-screen page-enter">
      <div className="result-burst" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <span className="result-icon">{result.perfect ? <Trophy size={40} /> : <Sparkles size={40} />}</span>
      <span className="eyebrow">PUZZLE COMPLETE</span>
      <h1>{result.perfect ? 'A perfect round!' : percent >= 60 ? 'You’re finding your rhythm.' : 'Every try teaches something.'}</h1>
      <p>{mode === 'daily' ? 'Today’s challenge is complete and your streak is safe.' : 'That practice is now part of your learning journey.'}</p>
      <div className="result-score"><span><strong>{result.score}/{result.total}</strong><small>correct</small></span><span><strong>+{earnedXp}</strong><small>XP earned</small></span><span><strong>{result.wordIds.length}</strong><small>words learned</small></span></div>
      <div className="result-actions"><button className="button button--primary" onClick={onDone}>Back home <ArrowRight size={18} /></button><button className="button button--ghost" onClick={onReplay}><RotateCcw size={18} /> Play again</button></div>
      <button className="result-exit" onClick={onDone}><ArrowLeft size={16} /> Leave results</button>
    </div>
  )
}
