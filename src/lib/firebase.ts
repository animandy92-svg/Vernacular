import { initializeApp } from 'firebase/app'
import {
  collection,
  getDocs,
  initializeFirestore,
  limit,
  orderBy,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  where,
} from 'firebase/firestore'
import type { LanguageCode, WordEntry } from '../types'

const firebaseConfig = {
  projectId: 'vernacular-bace0',
  appId: '1:860736290949:web:6f10f3883df6f57d8ea9ec',
  storageBucket: 'vernacular-bace0.firebasestorage.app',
  apiKey: 'AIzaSyA9Gs9JB4YiX1SvTOawVSY5Z8uBiXONRXk',
  authDomain: 'vernacular-bace0.firebaseapp.com',
  messagingSenderId: '860736290949',
  measurementId: 'G-XLBPDW9V8R',
}

const app = initializeApp(firebaseConfig)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

export interface LeaderboardEntry {
  id: string
  name: string
  xp: number
  language: string
  rank?: number
}

export async function fetchWords(language: LanguageCode): Promise<WordEntry[] | null> {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, 'words'),
        where('language', '==', language),
        where('visibility', '==', 'public'),
      ),
    )
    if (snapshot.empty) return null
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as WordEntry)
  } catch (error) {
    console.info('Using the offline language pack.', error)
    return null
  }
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const snapshot = await getDocs(query(collection(db, 'leaderboard'), orderBy('xp', 'desc'), limit(20)))
    return snapshot.docs.map((item, index) => ({
      id: item.id,
      rank: index + 1,
      ...(item.data() as Omit<LeaderboardEntry, 'id' | 'rank'>),
    }))
  } catch (error) {
    console.info('Leaderboard is offline.', error)
    return []
  }
}
