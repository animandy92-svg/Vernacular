import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { COURSES, COURSE_WORDS } = await server.ssrLoadModule('/src/data/course.ts')
  const { LANGUAGES } = await server.ssrLoadModule('/src/data/content.ts')
  const lines = ['# Vernacular course review packet', '', 'Generated from the application content. These are draft learning materials, not native-speaker approvals.', '', 'For each language, ask a qualified speaker to check spelling, dialect, translation, context, cultural fit and the written pronunciation guides. Edit incorrect entries at their source. Recheck lesson questions after edits. Never approve an entire pack because one entry has been reviewed.', '', 'Record normal and slow versions only after the text is approved. Keep written permission to distribute the recordings. Individual word clips are not supplied in this build. The separate Twi listening library includes the three user-supplied LearnAkan recordings with on-screen translations.', '']
  const cell = (value) => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ')
  for (const language of LANGUAGES) {
    const lessons = COURSES[language.code]
    const words = COURSE_WORDS.filter((entry) => entry.language === language.code)
    lines.push(`## ${language.name}`, '', `20 lessons · ${words.length} distinct words and phrases`, '', 'Reviewer: __________  Dialect: __________  Review date: __________', '', '### Lesson sequence', '')
    for (const lesson of lessons) lines.push(`- **${lesson.title}:** ${lesson.goal} Scenario check: ${lesson.mission.prompt}`)
    lines.push('', '### Text and recording checklist', '', '| ID | Text | English | Written guide | Source | Status | Reviewer corrections / approval |', '|---|---|---|---|---|---|---|')
    for (const word of words) lines.push(`| ${cell(word.id)} | ${cell(word.word)} | ${cell(word.translation)} | ${cell(word.phonetic)} | ${cell(word.source ?? 'existing-core-pack')}${word.sourceRow ? `, row ${word.sourceRow}` : ''} | ${word.reviewStatus} | |`)
    lines.push('')
  }
  lines.push('## Adding approved recordings', '', 'Place files under `public/audio/<language>/`. Add each approved item to `src/data/native-audio.json`, keyed by the entry ID. The transcript must exactly match the displayed word or expression. The build includes these files in the offline cache and fails if a referenced file is missing.', '', '```json', JSON.stringify({ 'entry-id': { normal: '/audio/twi/entry-id.mp3', slow: '/audio/twi/entry-id-slow.mp3', transcript: 'Exact approved expression', dialect: 'Dialect confirmed by reviewer', speaker: 'Credited speaker', reviewedBy: 'Qualified reviewer', reviewedOn: 'YYYY-MM-DD' } }, null, 2), '```', '', 'The example is a schema illustration; do not use placeholder review details in the application. The optional slow file can be omitted; the player then uses slower playback of the normal recording.', '', 'After corrections and recordings: `npm test` and `npm run build`. Review the actual course on a phone with a speaker before public educational release.', '')
  await mkdir(new URL('../docs/', import.meta.url), { recursive: true })
  await writeFile(new URL('../docs/course-content-review.md', import.meta.url), lines.join('\n'))
  console.log(`Review packet generated: ${COURSE_WORDS.length} expressions across three courses.`)
} finally { await server.close() }
