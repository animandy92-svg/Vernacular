import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'

const directory = new URL('../dist/', import.meta.url)
const assets = (await readdir(new URL('assets/', directory))).filter((name) => /\.(js|css)$/.test(name)).map((name) => `/assets/${name}`)
const artwork = (await Promise.all(['characters', 'worlds'].map(async (folder) => (await readdir(new URL(`${folder}/`, directory))).filter((name) => /\.(png|webp|svg)$/.test(name)).map((name) => `/${folder}/${name}`)))).flat()
const recordings = JSON.parse(await readFile(new URL('../src/data/native-audio.json', import.meta.url), 'utf8'))
const audio = [...new Set(Object.values(recordings).flatMap((recording) => [recording.normal, recording.slow].filter(Boolean)))]
for (const path of audio) {
  if (!/^\/audio\/[a-zA-Z0-9_/-]+\.(mp3|ogg|wav|m4a)$/.test(path)) throw new Error(`Invalid native recording path: ${path}`)
}
const videoPhrases = (await Promise.all(['twi', 'ga'].map(async (language) => JSON.parse(await readFile(new URL(`../src/data/${language}-video-phrases.json`, import.meta.url), 'utf8'))))).flat()
for (const phrase of videoPhrases) {
  if (!/^\/audio\/(twi\/learnakan-\d{3}|ga\/[a-z0-9-]+)\.m4a$/.test(phrase.audio)) throw new Error(`Invalid video phrase audio path: ${phrase.audio}`)
  const bytes = await readFile(new URL(phrase.audio.slice(1), directory))
  if (bytes.length !== phrase.bytes || createHash('sha256').update(bytes).digest('hex') !== phrase.sha256) throw new Error(`Video phrase audio mismatch: ${phrase.id ?? phrase.number}`)
}
const lessons = JSON.parse(await readFile(new URL('../src/data/twi-lessons.json', import.meta.url), 'utf8'))
for (const lesson of lessons) {
  if (!/^\/media\/twi\/[a-zA-Z0-9_-]+\.mp4$/.test(lesson.video)) throw new Error('Invalid lesson video path')
  const bytes = await readFile(new URL(lesson.video.slice(1), directory))
  if (bytes.length !== lesson.bytes || createHash('sha256').update(bytes).digest('hex') !== lesson.sha256) throw new Error(`Lesson media mismatch: ${lesson.id}`)
}
const core = ['/', '/manifest.webmanifest', '/icon.svg', ...assets, ...artwork, ...audio, ...videoPhrases.map((phrase) => phrase.audio), ...lessons.map((lesson) => lesson.poster)].sort()
const hash = createHash('sha256')
for (const path of core) hash.update(await readFile(new URL(path === '/' ? 'index.html' : path.slice(1), directory)))
const source = await readFile(new URL('../public/service-worker.js', import.meta.url), 'utf8')
await writeFile(new URL('service-worker.js', directory), source.replace("'vernacular-development'", `'vernacular-${hash.digest('hex').slice(0, 12)}'`).replace("['/', '/manifest.webmanifest', '/icon.svg']", JSON.stringify(core)).replace('const LESSON_MEDIA = []', `const LESSON_MEDIA = ${JSON.stringify(lessons.map((lesson) => lesson.video))}`))
console.log(`Offline shell and ${core.length - 3} bundled assets prepared.`)
