const fs = require('node:fs')
const path = require('node:path')

const projectId = 'vernacular-bace0'
const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'content.ts'), 'utf8')
const wordPattern = /word\('([^']+)', '([^']+)', '([^']+)', '([^']+)', '([^']+)', '([^']+)', '([^']+)'(?:, '([^']+)')?\)/g
const words = []
let match

while ((match = wordPattern.exec(source))) {
  const [, language, shortId, word, translation, category, phonetic, example, difficulty = 'beginner'] = match
  words.push({
    id: `${language}-${shortId}`,
    language,
    word,
    translation,
    category,
    phonetic,
    example,
    difficulty,
    reviewStatus: 'needs-review',
    visibility: 'public',
  })
}

if (words.length < 40) throw new Error(`Expected at least 40 word records, found ${words.length}`)

const languages = [
  { id: 'twi', name: 'Twi', nativeName: 'Asante Twi', region: 'Ashanti & central Ghana', status: 'draft', visibility: 'public', wordCount: words.filter((item) => item.language === 'twi').length },
  { id: 'fante', name: 'Fante', nativeName: 'Mfantse', region: 'Central & coastal Ghana', status: 'draft', visibility: 'public', wordCount: words.filter((item) => item.language === 'fante').length },
]

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
  const records = [
    ...languages.map((item) => ({ collection: 'languages', ...item })),
    ...words.map((item) => ({ collection: 'words', ...item })),
    ...leaders.map((item) => ({ collection: 'leaderboard', ...item })),
  ]
  const writes = records.map(({ collection, id, ...data }) => ({
    update: { name: `${baseName}/${collection}/${id}`, fields: fields(data) },
  }))
  await client.post(`/projects/${projectId}/databases/(default)/documents:batchWrite`, { writes }, {
    headers: { 'x-goog-user-project': projectId },
    skipLog: { resBody: true },
  })
  console.log(`Seeded ${words.length} words, ${languages.length} languages and ${leaders.length} leaderboard entries.`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
