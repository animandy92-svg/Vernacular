import { FALLBACK_WORDS, PHRASES } from './content'
import type { EnvironmentId, LanguageCode, Progress, WordEntry } from '../types'

export interface CourseLesson {
  id: string
  chapter: number
  title: string
  goal: string
  tip: string
  wordIds: string[]
  mission: { prompt: string; wordId: string }
  checkpoint?: boolean
}

export const COURSE_CHAPTERS: { title: string; description: string; environment: EnvironmentId }[] = [
  { title: 'A warm welcome', description: 'Greetings, courtesy and a first introduction', environment: 'courtyard' },
  { title: 'People close to you', description: 'Family, friendship and belonging', environment: 'grove' },
  { title: 'At the market', description: 'Food, counting and shopping words', environment: 'market' },
  { title: 'An ordinary day', description: 'Home, learning, time and finding your way', environment: 'library' },
]

const imported = (number: number) => `twi-everyday-${String(number).padStart(4, '0')}`
const phrase = (id: string) => `course-twi-${id}`

const lesson = (number: number, chapter: number, title: string, goal: string, tip: string, wordIds: string[], prompt: string, wordId: string, checkpoint = false): CourseLesson => ({
  id: `twi-foundations-${String(number).padStart(2, '0')}`, chapter, title, goal, tip, wordIds, mission: { prompt, wordId }, checkpoint,
})

// This is an editorial draft using existing source entries, not a reviewed course.
// Translations remain needs-review; no new translations are generated here.
export const TWI_LESSONS: CourseLesson[] = [
  lesson(1, 0, 'Your first hello', 'Welcome someone and say thank you.', 'Learn each expression first. Then try remembering it without looking.', ['twi-akwaaba', 'twi-maakye', 'twi-medaase'], 'Someone arrives at your home. Choose the expression meaning “welcome”.', 'twi-akwaaba'),
  lesson(2, 0, 'Greetings through the day', 'Recognise morning, afternoon and evening greetings.', 'Match each greeting to its time of day.', ['twi-maakye', 'twi-maaha', 'twi-maadwo'], 'It is the afternoon. Which greeting have you practised?', 'twi-maaha'),
  lesson(3, 0, 'A little courtesy', 'Recognise please, sorry, yes and no.', 'These short expressions are useful building blocks. Full conversations come with practice.', [imported(19), imported(21), 'twi-aane', 'twi-daabi'], 'You want to add “please”. Which expression means that?', imported(19)),
  lesson(4, 0, 'A first introduction', 'Practise asking how someone is and introducing Ama.', 'The example introduces Ama. Learn the whole expression before changing a name with a speaker’s help.', [phrase('how-are-you'), phrase('i-am-well'), phrase('my-name'), 'twi-din'], 'Someone asks how you are. Choose “I am well”.', phrase('i-am-well')),
  lesson(5, 0, 'Welcome checkpoint', 'Bring your first greetings and expressions together.', 'Try the checks from memory. It is fine to revisit the teaching cards.', ['twi-akwaaba', 'twi-medaase', imported(19), phrase('how-are-you'), phrase('my-name')], 'You are practising the introduction “My name is Ama”. Find it.', phrase('my-name'), true),
  lesson(6, 1, 'Your close family', 'Recognise words for mother, father and child.', 'Picture the people each word could refer to as you practise.', ['twi-ena', 'twi-agya', 'twi-abofra'], 'In a family picture, which word labels “mother”?', 'twi-ena'),
  lesson(7, 1, 'Brothers and sisters', 'Recognise brother, sister and family.', 'Look for the parts shared by the words for brother and sister.', [imported(417), imported(430), imported(469)], 'You are labelling a picture of a sister. Which expression fits?', imported(430)),
  lesson(8, 1, 'Visiting grandparents', 'Practise grandmother, grandfather and home.', 'These are vocabulary labels. Ways of addressing relatives need context and speaker guidance.', [imported(482), imported(495), 'twi-fie'], 'Which expression in this lesson means “grandfather”?', imported(495)),
  lesson(9, 1, 'Friendship and belonging', 'Recognise friend, love and name.', 'Connect each word to a person or memory that matters to you.', ['twi-adamfo', 'twi-odo', 'twi-din'], 'You want the word meaning “friend”. Which one is it?', 'twi-adamfo'),
  lesson(10, 1, 'Family checkpoint', 'Remember familiar people without looking back.', 'Remembering a word today is a first step. Reviews will check it again on later days.', ['twi-ena', 'twi-agya', imported(430), imported(469), 'twi-adamfo'], 'Choose the word meaning “family”.', imported(469), true),
  lesson(11, 2, 'Food and water', 'Recognise water, food, rice and bread.', 'Start with names of things. This lesson does not yet teach a complete food order.', ['twi-nsuo', 'twi-aduane', imported(989), imported(1002)], 'You are identifying rice on a food list. Which word means “rice”?', imported(989)),
  lesson(12, 2, 'A small shopping list', 'Recognise fish, orange and banana.', 'Imagine the three items together in a basket.', [imported(1028), imported(1132), imported(1145)], 'Which word labels the banana in your basket?', imported(1145)),
  lesson(13, 2, 'Count to five', 'Practise the numbers one to five.', 'After studying, try counting aloud. Check pronunciation with a speaker when recordings are available.', ['twi-baako', 'twi-mmienu', 'twi-mmiensa', imported(2536), imported(2549)], 'There are three items in the basket. Choose “three”.', 'twi-mmiensa'),
  lesson(14, 2, 'Market words', 'Recognise market, money and price.', 'Knowing these words is preparation for a conversation about buying something.', [imported(1717), imported(1691), imported(1704)], 'Which word in this lesson means “money”?', imported(1691)),
  lesson(15, 2, 'Market checkpoint', 'Remember food, numbers and money words together.', 'Switching between topics can make recall harder. Take your time.', ['twi-nsuo', imported(1002), imported(1145), 'twi-mmienu', imported(1691)], 'Your list contains bread. Choose its name.', imported(1002), true),
  lesson(16, 3, 'Around the home', 'Recognise home, room and chair.', 'Picture a familiar room as you learn these words.', ['twi-fie', imported(716), imported(794)], 'You are naming a chair. Which word fits?', imported(794)),
  lesson(17, 3, 'Learning together', 'Practise school, book and friend.', 'Reuse familiar words in a new setting. Repetition is part of learning.', ['twi-sukuu', 'twi-nwoma', 'twi-adamfo'], 'Which word means “book”?', 'twi-nwoma'),
  lesson(18, 3, 'Today and tomorrow', 'Recognise morning, today, tomorrow and yesterday.', 'Use the English meanings to keep the time words distinct.', ['twi-anopa', imported(2367), imported(2380), imported(2393)], 'You are referring to tomorrow. Which word means that?', imported(2380)),
  lesson(19, 3, 'Finding your way', 'Practise here, there, road, go and come.', 'These are individual building blocks, not complete directions yet.', [imported(9), imported(10), imported(1821), imported(2705), imported(2716)], 'Which word in this lesson means “here”?', imported(9)),
  lesson(20, 3, 'Your foundation checkpoint', 'Bring greetings, people and everyday words together.', 'Finishing the course records practice, not fluency. Keep reviewing and practise with a speaker.', ['twi-akwaaba', phrase('i-am-well'), imported(469), 'twi-nsuo', imported(2380), imported(1821)], 'Return to your first conversation. Choose “I am well”.', phrase('i-am-well'), true),
]

type LessonSpec = [title: string, goal: string, ids: string[], prompt: string, answer: string]
function starterCourse(code: 'fante' | 'kasem', specs: LessonSpec[]) {
  return specs.map(([title, goal, ids, prompt, answer], index): CourseLesson => ({
    id: `${code}-foundations-${String(index + 1).padStart(2, '0')}`, chapter: Math.floor(index / 5), title, goal,
    tip: (index + 1) % 5 === 0 ? 'Revisit these familiar expressions, then check what you remember. Completing a checkpoint records practice, not fluency.' : 'Learn each expression first. Picture its meaning, then try the practice without looking back.',
    wordIds: ids.map((id) => id.startsWith('phrase:') ? `course-${code}-${id.slice(7)}` : `${code}-${id}`),
    mission: { prompt, wordId: answer.startsWith('phrase:') ? `course-${code}-${answer.slice(7)}` : `${code}-${answer}` },
    checkpoint: (index + 1) % 5 === 0,
  }))
}

export const FANTE_LESSONS = starterCourse('fante', [
  ['Your first hello', 'Practise welcome, good morning and thank you.', ['akwaaba', 'maakye', 'medaase'], 'Someone arrives at your home. Choose “welcome”.', 'akwaaba'],
  ['Greetings through the day', 'Recognise morning, afternoon and evening greetings.', ['maakye', 'maaha', 'maadwo'], 'It is evening. Choose the evening greeting.', 'maadwo'],
  ['A simple response', 'Recognise yes, no and thank you.', ['nyew', 'daabi', 'medaase'], 'Choose the word meaning “yes”.', 'nyew'],
  ['A first introduction', 'Practise checking in and introducing Esi.', ['phrase:how-are-you', 'phrase:i-am-well', 'phrase:my-name'], 'Someone asks how you are. Choose “I am well”.', 'phrase:i-am-well'],
  ['Welcome checkpoint', 'Bring greetings and responses together.', ['akwaaba', 'maaha', 'medaase', 'phrase:how-are-you'], 'Choose the expression meaning “How are you?”.', 'phrase:how-are-you'],
  ['Your close family', 'Recognise mother, father and child.', ['maame', 'egya', 'abofra'], 'You are labelling a picture of a father. Choose the word.', 'egya'],
  ['A place to belong', 'Practise home, love and mother.', ['fie', 'odo', 'maame'], 'Choose the word meaning “home”.', 'fie'],
  ['Meet a friend', 'Recognise friend and name, and practise Esi’s introduction.', ['nyenko', 'dzin', 'phrase:my-name'], 'Choose the introduction “My name is Esi”.', 'phrase:my-name'],
  ['Checking in', 'Revisit the opening and response of a short exchange.', ['phrase:good-morning', 'phrase:how-are-you', 'phrase:i-am-well'], 'Choose the question meaning “How are you?”.', 'phrase:how-are-you'],
  ['Family checkpoint', 'Remember people, friendship and home.', ['maame', 'egya', 'abofra', 'nyenko', 'fie'], 'Which word means “friend”?', 'nyenko'],
  ['Food and water', 'Recognise food and water, and revisit thank you.', ['edziban', 'nsu', 'medaase'], 'Choose the word meaning “water”.', 'nsu'],
  ['One, two, three', 'Practise three basic numbers.', ['kor', 'ebien', 'ebiasa'], 'There are two items. Choose “two”.', 'ebien'],
  ['A food list', 'Remember food and water alongside a number.', ['edziban', 'nsu', 'kor'], 'Find the word meaning “food”.', 'edziban'],
  ['Short responses', 'Revisit yes, no and thanks without looking first.', ['nyew', 'daabi', 'medaase'], 'Choose the word meaning “no”.', 'daabi'],
  ['Everyday essentials checkpoint', 'Bring food, numbers and courtesy together.', ['nsu', 'edziban', 'ebien', 'ebiasa', 'medaase'], 'There are three items. Choose “three”.', 'ebiasa'],
  ['Learning together', 'Recognise school, book and friend.', ['skuul', 'nwoma', 'nyenko'], 'Choose the word meaning “book”.', 'nwoma'],
  ['Look at the sky', 'Recognise sun, moon and morning.', ['ewia', 'bosoom', 'anapa'], 'Choose the word meaning “moon”.', 'bosoom'],
  ['A morning greeting', 'Connect morning vocabulary and greetings.', ['anapa', 'maakye', 'phrase:good-morning'], 'Choose the single-word greeting “good morning”.', 'maakye'],
  ['Your name and home', 'Revisit an introduction and familiar everyday words.', ['phrase:my-name', 'dzin', 'fie'], 'Which word means “name”?', 'dzin'],
  ['Your foundation checkpoint', 'Recall expressions from all four chapters.', ['akwaaba', 'phrase:i-am-well', 'maame', 'nsu', 'nwoma', 'ebiasa'], 'Someone asks how you are. Choose “I am well”.', 'phrase:i-am-well'],
])

export const KASEM_LESSONS = starterCourse('kasem', [
  ['Your first hello', 'Recognise hello, a greeting at a home and yes.', ['dinle', 'besem', 'ehee'], 'Choose the expression meaning “hello”.', 'dinle'],
  ['A morning visit', 'Practise a morning greeting and a greeting at a home.', ['phrase:good-morning', 'besem', 'dinle'], 'Choose the expression translated “good morning”.', 'phrase:good-morning'],
  ['A simple response', 'Recognise yes, no and “It is well”.', ['ehee', 'awo', 'phrase:it-is-well'], 'Choose the word meaning “no”.', 'awo'],
  ['Checking in', 'Practise asking how it is and asking someone’s name.', ['phrase:how-is-it', 'phrase:it-is-well', 'phrase:your-name'], 'Choose the question meaning “What is your name?”.', 'phrase:your-name'],
  ['Welcome checkpoint', 'Bring greetings, questions and responses together.', ['dinle', 'besem', 'ehee', 'phrase:how-is-it', 'phrase:it-is-well'], 'Choose the response “It is well”.', 'phrase:it-is-well'],
  ['Your close family', 'Recognise mother, father and child.', ['nu', 'ko', 'bu'], 'You are labelling a picture of a mother. Choose the word.', 'nu'],
  ['Friendship and belonging', 'Recognise friend, love and name.', ['cilong', 'sono', 'yiri'], 'Which word means “friend”?', 'cilong'],
  ['People in your community', 'Practise chief or king, friend and child.', ['pe', 'cilong', 'bu'], 'Which word is translated “chief or king”?', 'pe'],
  ['Getting to know someone', 'Revisit name vocabulary and asking someone’s name.', ['yiri', 'phrase:your-name', 'phrase:how-is-it'], 'Choose the question meaning “What is your name?”.', 'phrase:your-name'],
  ['Family checkpoint', 'Remember people and belonging.', ['nu', 'ko', 'bu', 'cilong', 'sono'], 'Choose the word meaning “father”.', 'ko'],
  ['Food and water', 'Recognise water, soup or stew, and market.', ['na', 'dwe', 'yaga'], 'Choose the word meaning “water”.', 'na'],
  ['One, two, three', 'Practise three basic numbers.', ['didua', 'sile', 'nto'], 'There are two items. Choose “two”.', 'sile'],
  ['Everyday objects', 'Recognise knife, book and hand.', ['siu', 'tono', 'jinga'], 'Which word means “book”?', 'tono'],
  ['The market and the road', 'Practise market, road or way, and water.', ['yaga', 'cwenge', 'na'], 'Which word means “market”?', 'yaga'],
  ['Everyday essentials checkpoint', 'Bring food, numbers and place words together.', ['na', 'dwe', 'didua', 'nto', 'yaga'], 'Choose the word meaning “three”.', 'nto'],
  ['Learning together', 'Practise school, book and “I am learning Kasem”.', ['karadige', 'tono', 'phrase:learning'], 'Choose the expression “I am learning Kasem”.', 'phrase:learning'],
  ['Day and night', 'Recognise morning, night, sun and moon or month.', ['zizinga', 'titii', 'we', 'cana'], 'Choose the word meaning “night”.', 'titii'],
  ['The world outside', 'Recognise bird, tree and rain.', ['zunge', 'tiu', 'dua'], 'Choose the word meaning “rain”.', 'dua'],
  ['Parts of the body', 'Recognise head, hand, leg and eye.', ['yuu', 'jinga', 'naga', 'yi'], 'Choose the word meaning “hand”.', 'jinga'],
  ['Your foundation checkpoint', 'Recall expressions from all four chapters.', ['dinle', 'phrase:it-is-well', 'nu', 'na', 'tono', 'phrase:learning'], 'Choose the expression “I am learning Kasem”.', 'phrase:learning'],
])

export const COURSES = { twi: TWI_LESSONS, fante: FANTE_LESSONS, kasem: KASEM_LESSONS }
export const lessonsFor = (language: LanguageCode) => COURSES[language]

const phraseWords: WordEntry[] = PHRASES.map((entry) => ({
  id: `course-${entry.id}`, language: entry.language, word: entry.phrase, translation: entry.translation,
  category: 'Conversation', difficulty: 'beginner', phonetic: '', example: '', reviewStatus: 'needs-review', visibility: 'public', source: 'existing-phrase-pack',
}))
const allEntries = new Map([...FALLBACK_WORDS, ...phraseWords].map((entry) => [entry.id, entry]))
export const COURSE_WORDS = [...new Set(Object.values(COURSES).flat().flatMap((item) => item.wordIds))].map((id) => {
  const entry = allEntries.get(id)
  if (!entry) throw new Error(`Course entry is missing: ${id}`)
  return entry
})
export const COURSE_WORD_MAP = new Map(COURSE_WORDS.map((entry) => [entry.id, entry]))
export const courseWords = (language: LanguageCode) => COURSE_WORDS.filter((entry) => entry.language === language)
export const lessonWords = (item: CourseLesson) => item.wordIds.map((id) => COURSE_WORD_MAP.get(id)!)
export const nextLesson = (progress: Progress, language: LanguageCode) => lessonsFor(language).find((item) => !progress.lessons?.[item.id])
export const lessonUnlocked = (item: CourseLesson, progress: Progress, language: LanguageCode) => {
  const lessons = lessonsFor(language)
  const index = lessons.findIndex((entry) => entry.id === item.id)
  return index >= 0 && (index === 0 || !!progress.lessons?.[lessons[index - 1].id])
}
