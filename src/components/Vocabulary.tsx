import { useState } from 'react'
import { BookOpen, Search, X } from 'lucide-react'
import type { WordEntry } from '../types'
import { Pronunciation } from './Pronunciation'

export function Vocabulary({ words, learnedIds }: { words: WordEntry[]; learnedIds: string[] }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [visibleCount, setVisibleCount] = useState(50)
  const learned = new Set(learnedIds)
  const search = query.trim().normalize('NFC').toLocaleLowerCase()
  const visible = words.filter((word) => (filter !== 'learned' || learned.has(word.id)) && [word.word, word.translation, word.category].some((text) => text.normalize('NFC').toLocaleLowerCase().includes(search)))
  return <section className="section-block vocabulary-section">
    <div className="section-heading"><div><span className="eyebrow">YOUR WORD COLLECTION</span><h2>A word for every day.</h2></div><span>{words.filter((word) => learned.has(word.id)).length}/{words.length} learned</span></div>
    <div className="vocabulary-search"><Search size={19} /><input aria-label="Search vocabulary" type="search" placeholder="Search a word, meaning or theme" value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(50) }} />{query && <button aria-label="Clear search" onClick={() => { setQuery(''); setVisibleCount(50) }}><X size={18} /></button>}</div>
    <div className="vocabulary-filters" aria-label="Vocabulary filters">{[{ id: 'all', label: 'All words' }, { id: 'learned', label: 'Learned' }].map((item) => <button key={item.id} aria-pressed={filter === item.id} onClick={() => { setFilter(item.id); setVisibleCount(50) }}>{item.label}</button>)}<span role="status">{visible.length} {visible.length === 1 ? 'word' : 'words'}</span></div>
    {visible.length ? <div className="vocabulary-list">{visible.slice(0, visibleCount).map((word) => <article key={word.id}>
      <div className="vocabulary-word"><div><strong>{word.word}</strong><span>{word.translation}</span></div><Pronunciation entry={word} compact /></div>
      <p>{word.phonetic && <>{word.phonetic} · </>}<span>{word.category}</span>{learned.has(word.id) && <span> · Learned ✓</span>}</p>
      {word.example && <details><summary>Example</summary><p>{word.example}</p></details>}
    </article>)}</div> : <div className="empty-state"><BookOpen size={28} /><strong>{search ? 'No words found.' : 'Your collection starts with a puzzle.'}</strong><p>{search ? 'Try a different spelling, English meaning or theme.' : 'Words you practice will appear here.'}</p>{search && <button className="button button--ghost" onClick={() => setQuery('')}>Clear search</button>}</div>}
    {visible.length > visibleCount && <button className="button button--ghost vocabulary-more" onClick={() => setVisibleCount((count) => count + 50)}>Show more ({Math.min(visibleCount, visible.length)} of {visible.length})</button>}
  </section>
}
