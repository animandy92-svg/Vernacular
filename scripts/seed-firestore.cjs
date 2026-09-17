const path = require('node:path')

const projectId = 'vernacular-bace0'

const leaders = [
  { id: 'ama', name: 'Ama K.', xp: 2480, language: 'Twi' },
  { id: 'kwesi', name: 'Kwesi A.', xp: 2160, language: 'Fante' },
  { id: 'adwoa', name: 'Adwoa N.', xp: 1940, language: 'Twi' },
  { id: 'kofi', name: 'Kofi M.', xp: 1710, language: 'Twi' },
  { id: 'esi', name: 'Esi B.', xp: 1530, language: 'Fante' },
]

function encode(value) {
  if (value === null) return { nullValue: null }
  if (typeof value === 'string') return { stringValue: value }
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encode) } }
  return { mapValue: { fields: fields(value) } }
}

function fields(object) {
  return Object.fromEntries(Object.entries(object).filter(([key]) => key !== 'id').map(([key, value]) => [key, encode(value)]))
}

async function main() {
  // Read the same data as the app, including spreadsheet imports and stable IDs.
  const { FALLBACK_WORDS, LANGUAGES } = await import('../src/data/content.ts')
  const language = process.argv.find((argument) => argument.startsWith('--language='))?.split('=')[1]
  if (language && !LANGUAGES.some((item) => item.code === language)) throw new Error('Unknown language')
  const allWords = FALLBACK_WORDS.filter((item) => !language || item.language === language)
  const words = process.argv.includes('--import-only') ? allWords.filter((item) => item.source === 'twi-everyday-workbook') : allWords
  const languages = LANGUAGES.filter((item) => !language || item.code === language).map((item) => ({
    id: item.code, name: item.name, nativeName: item.nativeName, region: item.region,
    status: 'draft', visibility: 'public', wordCount: allWords.filter((word) => word.language === item.code).length,
  }))
  const selectedLeaders = process.argv.includes('--content-only') || language ? [] : leaders
  const records = [
    ...languages.map((item) => ({ collection: 'languages', ...item })),
    ...words.map((item) => ({ collection: 'words', ...item })),
    ...selectedLeaders.map((item) => ({ collection: 'leaderboard', ...item })),
  ]
  if (process.argv.includes('--dry-run')) {
    console.log(JSON.stringify({ words: words.length, languages, leaderboard: selectedLeaders.length }))
    return
  }
  const globalRoot = process.env.APPDATA
    ? path.join(process.env.APPDATA, 'npm', 'node_modules')
    : '/usr/local/lib/node_modules'
  const firebaseRoot = path.join(globalRoot, 'firebase-tools', 'lib')
  const auth = require(path.join(firebaseRoot, 'auth.js'))
  const account = auth.getGlobalDefaultAccount()
  if (!account) throw new Error('Run firebase login before seeding content.')
  auth.setActiveAccount({}, account)
  const { Client } = require(path.join(firebaseRoot, 'apiv2.js'))
  const client = new Client({ urlPrefix: 'https://firestore.googleapis.com', apiVersion: 'v1' })
  const baseName = `projects/${projectId}/databases/(default)/documents`
  const writes = records.map(({ collection, id, ...data }) => ({
    update: { name: `${baseName}/${collection}/${id}`, fields: fields(data) },
  }))
  for (let offset = 0; offset < writes.length; offset += 250) {
    const batch = writes.slice(offset, offset + 250)
    const result = await client.post(`/projects/${projectId}/databases/(default)/documents:batchWrite`, { writes: batch }, {
      headers: { 'x-goog-user-project': projectId }, skipLog: { resBody: true },
    })
    const failures = (result.body.status ?? []).filter((status) => status.code)
    if (failures.length || result.body.writeResults?.length !== batch.length) throw new Error(`Content batch failed: ${JSON.stringify(failures)}`)
    console.log(`Saved ${Math.min(offset + batch.length, writes.length)}/${writes.length} content records.`)
  }
  console.log(`Seeded ${words.length} words, ${languages.length} languages and ${selectedLeaders.length} leaderboard entries.`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
