import { useState } from 'react'
import { BookOpen, Search, X } from 'lucide-react'
import type { Progress, WordEntry } from '../types'
import { Pronunciation } from './Pronunciation'
import { memoryFor, memoryStage } from '../lib/learning'

export function Vocabulary({ words, progress }: { words: WordEntry[]; progress: Progress }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [visibleCount, setVisibleCount] = useState(50)
  const memory = memoryFor(progress)
  const search = query.trim().normalize('NFC').toLocaleLowerCase()
  const visible = words.filter((word) => (filter === 'all' || (filter === 'practised' ? !!memory[word.id] : memoryStage(memory[word.id]) === 'remembered')) && [word.word, word.translation, word.category, word.alternateTerms ?? '', word.dialect ?? ''].some((text) => text.normalize('NFC').toLocaleLowerCase().includes(search)))
  return <section className="section-block vocabulary-section">
    <div className="section-heading"><div><span className="eyebrow">YOUR WORD COLLECTION</span><h2>A word for every day.</h2></div><span>{words.filter((word) => memory[word.id]).length}/{words.length} introduced</span></div>
    <div className="vocabulary-search"><Search size={19} /><input aria-label="Search vocabulary" type="search" placeholder="Search a word, meaning or theme" value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(50) }} />{query && <button aria-label="Clear search" onClick={() => { setQuery(''); setVisibleCount(50) }}><X size={18} /></button>}</div>
    <div className="vocabulary-filters" aria-label="Vocabulary filters">{[{ id: 'all', label: 'All' }, { id: 'practised', label: 'Practised' }, { id: 'remembered', label: 'Remembered' }].map((item) => <button key={item.id} aria-pressed={filter === item.id} onClick={() => { setFilter(item.id); setVisibleCount(50) }}>{item.label}</button>)}<span role="status">{visible.length} entries</span></div>
    {visible.length ? <div className="vocabulary-list">{visible.slice(0, visibleCount).map((word) => <article key={word.id}>
      <div className="vocabulary-word"><div><strong>{word.word}</strong><span>{word.translation}</span></div><Pronunciation entry={word} compact /></div>
      <p>{word.phonetic && <>{word.phonetic} · </>}<span>{word.category}</span>{memory[word.id] && <span className="memory-status"> · {memoryStage(memory[word.id])}</span>}</p>
      {word.dialect && <p className="dictionary-dialect">{word.dialect}{word.partOfSpeech && ` · ${word.partOfSpeech}`}</p>}
      {word.example && <details><summary>Example</summary><p>{word.example}</p>{word.exampleTranslation && <p>{word.exampleTranslation}</p>}</details>}
      {(word.alternateTerms || word.usageNote || word.culturalNote || word.sourceAttribution) && <details><summary>Word notes & source</summary>
        {word.alternateTerms && <p>Also written: {word.alternateTerms}</p>}
        {word.usageNote && <p>{word.usageNote}</p>}
        {word.culturalNote && <p>{word.culturalNote}</p>}
        {word.sourceAttribution && <p>Source: {word.sourceAttribution}</p>}
      </details>}
    </article>)}</div> : <div className="empty-state"><BookOpen size={28} /><strong>{search ? 'No words found.' : filter === 'remembered' ? 'Memory grows over time.' : 'Your collection starts with practice.'}</strong><p>{search ? 'Try a different spelling, English meaning or theme.' : filter === 'remembered' ? 'Complete three successful scheduled reviews on separate days to remember an expression.' : 'Words and phrases you practise will appear here.'}</p>{search && <button className="button button--ghost" onClick={() => setQuery('')}>Clear search</button>}</div>}
    {visible.length > visibleCount && <button className="button button--ghost vocabulary-more" onClick={() => setVisibleCount((count) => count + 50)}>Show more ({Math.min(visibleCount, visible.length)} of {visible.length})</button>}
  </section>
}
