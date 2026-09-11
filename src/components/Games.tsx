import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Delete, Lightbulb, RotateCcw, Sparkles, Trophy, Volume2, X } from 'lucide-react'
import { getPhrases, getProverbs, PROVERBS } from '../data/content'
import { areAdjacent, generateCrossword, generateWordGrid, normalizeWord, samePath, scramble, shuffle, type GridPosition } from '../lib/game'
import type { GameMode, GameResult, WordEntry } from '../types'
import { speakWord } from './Dashboard'

interface GameProps {
  mode: GameMode
  words: WordEntry[]
  onFinish: (result: GameResult) => void
  onExit: () => void
}

type Feedback = 'correct' | 'wrong' | null

function GameHeader({ label, current, total, onExit }: { label: string; current: number; total: number; onExit: () => void }) {
  const progress = total ? Math.round((current / total) * 100) : 0
  return (
    <header className="game-header">
      <button className="icon-button" onClick={onExit} aria-label="Exit puzzle"><X size={22} /></button>
      <div><span>{label}</span><div className="game-progress"><i style={{ width: `${progress}%` }} /></div></div>
      <strong>{current}/{total}</strong>
    </header>
  )
}

function EmptyGame({ onExit }: { onExit: () => void }) {
  return <div className="game-stage empty-game"><Sparkles size={36} /><h1>More words are on the way.</h1><p>This pack does not have enough reviewed entries for this puzzle yet.</p><button className="button button--dark" onClick={onExit}>Go back</button></div>
}

function FeedbackCard({ feedback, success, retry }: { feedback: Feedback; success: string; retry?: string }) {
  if (!feedback) return null
  return (
    <div className={`feedback feedback--${feedback}`} role="status" aria-live="polite">
      <span>{feedback === 'correct' ? <Check /> : <RotateCcw />}</span>
      <div><strong>{feedback === 'correct' ? success : 'Not quite — have another go.'}</strong>{retry && <p>{retry}</p>}</div>
    </div>
  )
}

function UnscrambleGame({ words, daily, onFinish, onExit }: Omit<GameProps, 'mode'> & { daily: boolean }) {
  const total = daily ? 3 : 5
  const rounds = useMemo(() => shuffle(words.filter((entry) => Array.from(entry.word).length <= 10)).slice(0, total), [words, total])
  const [round, setRound] = useState(0)
  const [selected, setSelected] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [mastered, setMastered] = useState<string[]>([])
  const [feedback, setFeedback] = useState<Feedback>(null)
  const entry = rounds[round]
  const letters = useMemo(() => entry ? scramble(entry.word) : [], [entry])
  const answer = selected.map((index) => letters[index]).join('')

  if (!entry) return <EmptyGame onExit={onExit} />

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
    } else setFeedback('wrong')
  }

  const next = () => {
    if (round === rounds.length - 1) {
      onFinish({ score, total: rounds.length, wordIds: mastered, perfect: score === rounds.length })
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
        <FeedbackCard feedback={feedback} success="Beautiful — that’s it!" retry={feedback === 'correct' ? entry.example : `Hint: it begins with “${Array.from(entry.word)[0]}”.`} />
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

  if (!pairs.length) return <EmptyGame onExit={onExit} />
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

  if (!puzzle.placements.length) return <EmptyGame onExit={onExit} />
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

const PICTURES: Record<string, { emoji: string; scene: string }> = {
  water: { emoji: '💧', scene: 'A cool drop of water' }, food: { emoji: '🍲', scene: 'A warm shared meal' },
  'soup or stew': { emoji: '🥘', scene: 'A bowl of soup or stew' }, home: { emoji: '🏠', scene: 'A welcoming home' },
  child: { emoji: '🧒🏿', scene: 'A young child' }, mother: { emoji: '👩🏿', scene: 'A mother' }, father: { emoji: '👨🏿', scene: 'A father' },
  sun: { emoji: '☀️', scene: 'The bright sun' }, 'moon or month': { emoji: '🌙', scene: 'The moon at night' }, moon: { emoji: '🌙', scene: 'The moon at night' },
  book: { emoji: '📖', scene: 'An open book' }, school: { emoji: '🏫', scene: 'A school building' }, friend: { emoji: '🫶🏿', scene: 'Friends together' },
  love: { emoji: '❤️', scene: 'A symbol of love' }, morning: { emoji: '🌅', scene: 'A new morning' }, night: { emoji: '🌌', scene: 'The night sky' },
  head: { emoji: '🙂', scene: 'A person’s head' }, hand: { emoji: '✋🏿', scene: 'An open hand' }, leg: { emoji: '🦵🏿', scene: 'A leg' },
  stomach: { emoji: '🫃🏿', scene: 'The stomach' }, eye: { emoji: '👁️', scene: 'An eye' }, bird: { emoji: '🐦', scene: 'A small bird' }, tree: { emoji: '🌳', scene: 'A leafy tree' },
  knife: { emoji: '🔪', scene: 'A kitchen knife' }, rain: { emoji: '🌧️', scene: 'Falling rain' }, market: { emoji: '🧺', scene: 'A busy market basket' },
  'road or way': { emoji: '🛤️', scene: 'A road leading onward' }, one: { emoji: '1️⃣', scene: 'The number one' }, two: { emoji: '2️⃣', scene: 'The number two' }, three: { emoji: '3️⃣', scene: 'The number three' },
}

function ChoiceRound({ words, kind, onFinish, onExit }: Omit<GameProps, 'mode'> & { kind: 'picture' | 'listening' }) {
  const eligible = useMemo(() => kind === 'picture' ? words.filter((entry) => PICTURES[entry.translation]) : words, [kind, words])
  const rounds = useMemo(() => shuffle(eligible).slice(0, 5), [eligible])
  const [round, setRound] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [score, setScore] = useState(0)
  const [mastered, setMastered] = useState<string[]>([])
  const entry = rounds[round]
  const options = useMemo(() => entry ? shuffle([entry, ...shuffle(words.filter((item) => item.id !== entry.id)).slice(0, 3)]) : [], [entry, words])

  if (!entry || options.length < 2) return <EmptyGame onExit={onExit} />
  const choose = (option: WordEntry) => {
    if (feedback === 'correct') return
    setSelected(option.id)
    if (option.id === entry.id) {
      setFeedback('correct')
      setScore((current) => current + 1)
      setMastered((current) => [...current, entry.id])
    } else setFeedback('wrong')
  }
  const next = () => {
    if (round === rounds.length - 1) {
      onFinish({ score, total: rounds.length, wordIds: mastered, perfect: score === rounds.length })
      return
    }
    setRound((current) => current + 1)
    setSelected(null)
    setFeedback(null)
  }

  const picture = PICTURES[entry.translation]
  return (
    <div className="game-shell page-enter">
      <GameHeader label={kind === 'picture' ? 'Picture quiz' : 'Listening challenge'} current={round + 1} total={rounds.length} onExit={onExit} />
      <main className="game-stage choice-stage">
        <span className="eyebrow">{kind === 'picture' ? 'SEE IT · NAME IT' : 'LISTEN · CHOOSE · LEARN'}</span>
        <h1>{kind === 'picture' ? 'What word matches this picture?' : 'Which meaning did you hear?'}</h1>
        {kind === 'picture' ? (
          <div className="picture-prompt" role="img" aria-label={picture.scene}><span>{picture.emoji}</span><small>{picture.scene}</small></div>
        ) : (
          <button className="sound-prompt" onClick={() => speakWord(entry)} aria-label="Play pronunciation"><span><Volume2 size={38} /></span><strong>Tap to hear</strong><small>{entry.phonetic}</small></button>
        )}
        <div className="choice-grid">{options.map((option) => <button className={`${selected === option.id ? 'selected' : ''} ${feedback === 'correct' && option.id === entry.id ? 'correct' : ''}`} key={option.id} onClick={() => choose(option)}>{kind === 'picture' ? option.word : option.translation}</button>)}</div>
        <FeedbackCard feedback={feedback} success={`${entry.word} means ${entry.translation}.`} retry={feedback === 'wrong' ? 'Listen or look once more, then choose again.' : entry.example} />
      </main>
      {feedback === 'correct' && <footer className="game-footer"><button className="button button--primary" onClick={next}>{round === rounds.length - 1 ? 'See results' : 'Next challenge'} <ArrowRight size={18} /></button></footer>}
    </div>
  )
}

function ProverbGame({ words, onFinish, onExit }: Omit<GameProps, 'mode'>) {
  const language = words[0]?.language ?? 'twi'
  const rounds = useMemo(() => shuffle(getProverbs(language)).slice(0, 3), [language])
  const [round, setRound] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [score, setScore] = useState(0)
  const entry = rounds[round]
  const decoys = ['Move quickly before another person takes the opportunity.', 'Keep knowledge secret so that it remains powerful.', 'Strength matters more than patience or good judgment.', ...PROVERBS.map((item) => item.meaning)]
  const options = useMemo(() => entry ? shuffle([entry.meaning, ...shuffle(decoys.filter((item) => item !== entry.meaning)).slice(0, 2)]) : [], [entry])

  if (!entry) return <EmptyGame onExit={onExit} />
  const choose = (meaning: string) => {
    if (feedback === 'correct') return
    setSelected(meaning)
    if (meaning === entry.meaning) { setFeedback('correct'); setScore((current) => current + 1) } else setFeedback('wrong')
  }
  const next = () => {
    if (round === rounds.length - 1) { onFinish({ score, total: rounds.length, wordIds: [], perfect: score === rounds.length }); return }
    setRound((current) => current + 1); setSelected(null); setFeedback(null)
  }
  return (
    <div className="game-shell page-enter">
      <GameHeader label="Proverb challenge" current={round + 1} total={rounds.length} onExit={onExit} />
      <main className="game-stage proverb-stage">
        <span className="eyebrow">WISDOM IN A FEW WORDS</span><div className="proverb-mark">“</div><h1>{entry.text}</h1><p>{entry.literal}</p><h2>What does this proverb teach?</h2>
        <div className="meaning-list">{options.map((option) => <button className={`${selected === option ? 'selected' : ''} ${feedback === 'correct' && option === entry.meaning ? 'correct' : ''}`} onClick={() => choose(option)} key={option}>{option}</button>)}</div>
        <FeedbackCard feedback={feedback} success="You found the wisdom inside it." retry={feedback === 'wrong' ? 'Think about the lesson behind the image.' : entry.meaning} />
      </main>
      {feedback === 'correct' && <footer className="game-footer"><button className="button button--primary" onClick={next}>{round === rounds.length - 1 ? 'See results' : 'Next proverb'} <ArrowRight size={18} /></button></footer>}
    </div>
  )
}

const cleanPhrase = (value: string) => value.normalize('NFC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

function PhraseGame({ words, onFinish, onExit }: Omit<GameProps, 'mode'>) {
  const language = words[0]?.language ?? 'twi'
  const rounds = useMemo(() => shuffle(getPhrases(language)).slice(0, 4), [language])
  const [round, setRound] = useState(0)
  const [selected, setSelected] = useState<number[]>([])
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [score, setScore] = useState(0)
  const entry = rounds[round]
  const tokens = useMemo(() => entry ? shuffle(entry.phrase.split(/\s+/)) : [], [entry])
  const answer = selected.map((index) => tokens[index]).join(' ')

  if (!entry) return <EmptyGame onExit={onExit} />
  const submit = () => {
    if (cleanPhrase(answer) === cleanPhrase(entry.phrase)) { setFeedback('correct'); setScore((current) => current + 1) } else setFeedback('wrong')
  }
  const next = () => {
    if (round === rounds.length - 1) { onFinish({ score, total: rounds.length, wordIds: [], perfect: score === rounds.length }); return }
    setRound((current) => current + 1); setSelected([]); setFeedback(null)
  }
  return (
    <div className="game-shell page-enter">
      <GameHeader label="Phrase builder" current={round + 1} total={rounds.length} onExit={onExit} />
      <main className="game-stage phrase-stage">
        <span className="eyebrow">BUILD A USEFUL PHRASE</span><h1>{entry.translation}</h1><p>Tap each word in the order you would say it.</p>
        <div className={`phrase-answer ${feedback ? `answer-slots--${feedback}` : ''}`}>{answer || <span>Build your phrase here…</span>}</div>
        <div className="phrase-bank">{tokens.map((token, index) => <button className={selected.includes(index) ? 'used' : ''} key={`${token}-${index}`} onClick={() => { if (!selected.includes(index) && feedback !== 'correct') { setSelected((current) => [...current, index]); setFeedback(null) } }}>{token}</button>)}</div>
        <button className="clear-answer" disabled={!selected.length || feedback === 'correct'} onClick={() => { setSelected([]); setFeedback(null) }}><Delete size={17} /> Start again</button>
        <FeedbackCard feedback={feedback} success="That phrase flows beautifully." retry={feedback === 'correct' ? entry.phrase : 'Try a different word order.'} />
      </main>
      <footer className="game-footer">{feedback === 'correct' ? <button className="button button--primary" onClick={next}>{round === rounds.length - 1 ? 'See results' : 'Next phrase'} <ArrowRight size={18} /></button> : <button className="button button--dark" disabled={selected.length !== tokens.length} onClick={submit}>Check phrase</button>}</footer>
    </div>
  )
}

function CrosswordGame({ words, onFinish, onExit }: Omit<GameProps, 'mode'>) {
  const puzzle = useMemo(() => generateCrossword(shuffle(words)), [words])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<string | null>(() => puzzle.cells.keys().next().value ?? null)
  const [wrongCells, setWrongCells] = useState<Set<string>>(new Set())
  const [feedback, setFeedback] = useState<Feedback>(null)
  const entries = [...puzzle.cells.entries()]
  const rows = entries.map(([key]) => Number(key.split('-')[0]))
  const cols = entries.map(([key]) => Number(key.split('-')[1]))
  const minRow = Math.min(...rows), maxRow = Math.max(...rows), minCol = Math.min(...cols), maxCol = Math.max(...cols)
  const alphabet = [...new Set([...puzzle.cells.values()])].sort()
  const startNumbers = new Map(puzzle.placements.map((item) => [cellKey(item.cells[0]), item.number]))

  if (!puzzle.placements.length) return <EmptyGame onExit={onExit} />
  const enterLetter = (letter: string) => {
    if (!selected) return
    setAnswers((current) => ({ ...current, [selected]: letter }))
    setWrongCells((current) => { const next = new Set(current); next.delete(selected); return next })
    setFeedback(null)
    const placement = puzzle.placements.find((item) => item.cells.some((cell) => cellKey(cell) === selected))
    const index = placement?.cells.findIndex((cell) => cellKey(cell) === selected) ?? -1
    if (placement && index >= 0 && index < placement.cells.length - 1) setSelected(cellKey(placement.cells[index + 1]))
  }
  const check = () => {
    const wrong = new Set(entries.filter(([key, letter]) => answers[key] !== letter).map(([key]) => key))
    setWrongCells(wrong)
    if (wrong.size) { setFeedback('wrong'); return }
    setFeedback('correct')
    window.setTimeout(() => onFinish({ score: puzzle.placements.length, total: puzzle.placements.length, wordIds: puzzle.placements.map((item) => item.word.id), perfect: true }), 550)
  }

  return (
    <div className="game-shell page-enter">
      <GameHeader label="Crossword" current={Object.keys(answers).length} total={puzzle.cells.size} onExit={onExit} />
      <main className="game-stage crossword-stage">
        <span className="eyebrow">CROSS WORDS · GROW VOCABULARY</span><h1>Solve every crossing clue.</h1>
        <div className="crossword-layout"><div>
          <div className="crossword-board" style={{ '--cross-cols': maxCol - minCol + 1 } as React.CSSProperties}>
            {Array.from({ length: (maxRow - minRow + 1) * (maxCol - minCol + 1) }, (_, index) => {
              const width = maxCol - minCol + 1, row = minRow + Math.floor(index / width), col = minCol + (index % width), key = `${row}-${col}`, letter = puzzle.cells.get(key)
              if (!letter) return <span className="crossword-block" key={key} />
              return <button className={`${selected === key ? 'selected' : ''} ${wrongCells.has(key) ? 'wrong' : ''}`} key={key} onClick={() => setSelected(key)}>{startNumbers.has(key) && <small>{startNumbers.get(key)}</small>}{answers[key] ?? ''}</button>
            })}
          </div>
          <div className="crossword-keyboard">{alphabet.map((letter) => <button key={letter} onClick={() => enterLetter(letter)}>{letter}</button>)}<button aria-label="Erase selected letter" onClick={() => selected && setAnswers((current) => { const next = { ...current }; delete next[selected]; return next })}><Delete size={18} /></button></div>
        </div><div className="crossword-clues"><h2>Clues</h2>{puzzle.placements.map((item) => <button key={`${item.word.id}-${item.direction}`} onClick={() => setSelected(cellKey(item.cells[0]))}><span>{item.number}</span><div><strong>{item.word.translation}</strong><small>{item.direction} · {item.cells.length} letters</small></div></button>)}</div></div>
        <FeedbackCard feedback={feedback} success="Every crossing is complete!" retry={feedback === 'wrong' ? `${wrongCells.size} squares still need another look.` : undefined} />
      </main>
      <footer className="game-footer"><button className="button button--dark" onClick={check}>Check crossword <Check size={18} /></button></footer>
    </div>
  )
}

export function GamePlay({ mode, words, onFinish, onExit }: GameProps) {
  if (mode === 'match') return <MatchGame words={words} onFinish={onFinish} onExit={onExit} />
  if (mode === 'search') return <SearchGame words={words} onFinish={onFinish} onExit={onExit} />
  if (mode === 'crossword') return <CrosswordGame words={words} onFinish={onFinish} onExit={onExit} />
  if (mode === 'picture') return <ChoiceRound kind="picture" words={words} onFinish={onFinish} onExit={onExit} />
  if (mode === 'listening') return <ChoiceRound kind="listening" words={words} onFinish={onFinish} onExit={onExit} />
  if (mode === 'proverb') return <ProverbGame words={words} onFinish={onFinish} onExit={onExit} />
  if (mode === 'phrase') return <PhraseGame words={words} onFinish={onFinish} onExit={onExit} />
  return <UnscrambleGame words={words} daily={mode === 'daily'} onFinish={onFinish} onExit={onExit} />
}

export function ResultScreen({ result, mode, onDone, onReplay }: { result: GameResult; mode: GameMode; onDone: () => void; onReplay: () => void }) {
  const earnedXp = result.score * 12 + (result.perfect ? 25 : 10)
  const percent = Math.round((result.score / Math.max(result.total, 1)) * 100)
  return (
    <div className="results-screen page-enter">
      <div className="result-burst" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
      <span className="result-icon">{result.perfect ? <Trophy size={40} /> : <Sparkles size={40} />}</span><span className="eyebrow">PUZZLE COMPLETE</span>
      <h1>{result.perfect ? 'A perfect round!' : percent >= 60 ? 'You’re finding your rhythm.' : 'Every try teaches something.'}</h1>
      <p>{mode === 'daily' ? 'Today’s challenge is complete and your streak is safe.' : 'That practice is now part of your learning journey.'}</p>
      <div className="result-score"><span><strong>{result.score}/{result.total}</strong><small>correct</small></span><span><strong>+{earnedXp}</strong><small>XP earned</small></span><span><strong>{result.wordIds.length}</strong><small>words learned</small></span></div>
      <div className="result-actions"><button className="button button--primary" onClick={onDone}>Back home <ArrowRight size={18} /></button><button className="button button--ghost" onClick={onReplay}><RotateCcw size={18} /> Play again</button></div>
      <button className="result-exit" onClick={onDone}><ArrowLeft size={16} /> Leave results</button><div className="result-tip"><Lightbulb size={16} /> Short, frequent practice builds stronger recall.</div>
    </div>
  )
}
