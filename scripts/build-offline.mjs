import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'

const directory = new URL('../dist/', import.meta.url)
const assets = (await readdir(new URL('assets/', directory))).filter((name) => /\.(js|css)$/.test(name)).map((name) => `/assets/${name}`)
const artwork = (await Promise.all(['characters', 'worlds'].map(async (folder) => (await readdir(new URL(`${folder}/`, directory))).filter((name) => /\.(png|webp|svg)$/.test(name)).map((name) => `/${folder}/${name}`)))).flat()
const core = ['/', '/manifest.webmanifest', '/icon.svg', ...assets, ...artwork].sort()
const hash = createHash('sha256')
for (const path of core) hash.update(await readFile(new URL(path === '/' ? 'index.html' : path.slice(1), directory)))
const source = await readFile(new URL('../public/service-worker.js', import.meta.url), 'utf8')
await writeFile(new URL('service-worker.js', directory), source.replace("'vernacular-development'", `'vernacular-${hash.digest('hex').slice(0, 12)}'`).replace("['/', '/manifest.webmanifest', '/icon.svg']", JSON.stringify(core)))
console.log(`Offline shell and ${core.length - 3} bundled assets prepared.`)
