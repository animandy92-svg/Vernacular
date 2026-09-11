import type { WordEntry } from '../types'

export const normalizeWord = (value: string) => value.trim().normalize('NFC').toLocaleUpperCase()

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

export function scramble(value: string, random: () => number = Math.random): string[] {
  const letters = Array.from(normalizeWord(value))
  if (letters.length < 2) return letters
  let mixed = shuffle(letters, random)
  let attempts = 0
  while (mixed.join('') === letters.join('') && attempts < 8) {
    mixed = shuffle(letters, random)
    attempts += 1
  }
  if (mixed.join('') === letters.join('')) mixed = [...letters.slice(1), letters[0]]
  return mixed
}

export interface GridPosition {
  row: number
  col: number
}

export interface WordPlacement {
  word: WordEntry
  cells: GridPosition[]
}

export interface WordGrid {
  grid: string[][]
  placements: WordPlacement[]
}

const FILLER = Array.from('ABDEFGHIKMNOPRSTUWYƐƆƏƖƲŊ')

export function generateWordGrid(words: WordEntry[], size = 8, random: () => number = Math.random): WordGrid {
  const grid = Array.from({ length: size }, () => Array<string>(size).fill(''))
  const placements: WordPlacement[] = []
  const packLetters = words.flatMap((entry) => Array.from(normalizeWord(entry.word).replace(/[^\p{L}]/gu, '')))
  const filler = [...new Set([...FILLER, ...packLetters])]

  for (const entry of words) {
    const letters = Array.from(normalizeWord(entry.word).replace(/[^\p{L}]/gu, ''))
    if (!letters.length || letters.length > size) continue
    const directions = shuffle(
      [
        { row: 0, col: 1 },
        { row: 1, col: 0 },
        { row: 1, col: 1 },
      ],
      random,
    )
    let placed = false

    for (let attempt = 0; attempt < 80 && !placed; attempt += 1) {
      const direction = directions[attempt % directions.length]
      const maxRow = size - 1 - direction.row * (letters.length - 1)
      const maxCol = size - 1 - direction.col * (letters.length - 1)
      const row = Math.floor(random() * (maxRow + 1))
      const col = Math.floor(random() * (maxCol + 1))
      const cells = letters.map((_, index) => ({ row: row + direction.row * index, col: col + direction.col * index }))
      const fits = cells.every((cell, index) => !grid[cell.row][cell.col] || grid[cell.row][cell.col] === letters[index])
      if (!fits) continue
      cells.forEach((cell, index) => {
        grid[cell.row][cell.col] = letters[index]
      })
      placements.push({ word: entry, cells })
      placed = true
    }
  }

  grid.forEach((row) =>
    row.forEach((value, col) => {
      if (!value) row[col] = filler[Math.floor(random() * filler.length)]
    }),
  )

  return { grid, placements }
}

export const areAdjacent = (first: GridPosition, second: GridPosition) => {
  const rowDistance = Math.abs(first.row - second.row)
  const colDistance = Math.abs(first.col - second.col)
  return rowDistance <= 1 && colDistance <= 1 && rowDistance + colDistance > 0
}

export const samePath = (left: GridPosition[], right: GridPosition[]) =>
  left.length === right.length && left.every((cell, index) => cell.row === right[index].row && cell.col === right[index].col)

export interface CrosswordPlacement extends WordPlacement {
  direction: 'across' | 'down'
  number: number
}

export interface Crossword {
  size: number
  placements: CrosswordPlacement[]
  cells: Map<string, string>
}

const crosswordKey = (row: number, col: number) => `${row}-${col}`

export function generateCrossword(words: WordEntry[], size = 11): Crossword {
  const candidates = [...words]
    .filter((entry) => {
      const length = Array.from(normalizeWord(entry.word).replace(/[^\p{L}]/gu, '')).length
      return length >= 2 && length <= size - 2
    })
    .sort((left, right) => Array.from(right.word).length - Array.from(left.word).length)
    .slice(0, 12)

  const cells = new Map<string, string>()
  const placed: Omit<CrosswordPlacement, 'number'>[] = []
  const first = candidates.shift()
  if (!first) return { size, placements: [], cells }

  const firstLetters = Array.from(normalizeWord(first.word).replace(/[^\p{L}]/gu, ''))
  const firstRow = Math.floor(size / 2)
  const firstCol = Math.floor((size - firstLetters.length) / 2)
  const firstCells = firstLetters.map((letter, index) => {
    const cell = { row: firstRow, col: firstCol + index }
    cells.set(crosswordKey(cell.row, cell.col), letter)
    return cell
  })
  placed.push({ word: first, cells: firstCells, direction: 'across' })

  for (const entry of candidates) {
    if (placed.length >= 6) break
    const letters = Array.from(normalizeWord(entry.word).replace(/[^\p{L}]/gu, ''))
    let nextPlacement: Omit<CrosswordPlacement, 'number'> | null = null

    for (const existing of placed) {
      const direction = existing.direction === 'across' ? 'down' : 'across'
      for (let existingIndex = 0; existingIndex < existing.cells.length && !nextPlacement; existingIndex += 1) {
        const crossing = existing.cells[existingIndex]
        const crossingLetter = cells.get(crosswordKey(crossing.row, crossing.col))
        for (let index = 0; index < letters.length && !nextPlacement; index += 1) {
          if (letters[index] !== crossingLetter) continue
          const startRow = direction === 'down' ? crossing.row - index : crossing.row
          const startCol = direction === 'across' ? crossing.col - index : crossing.col
          const proposed = letters.map((_, offset) => ({
            row: startRow + (direction === 'down' ? offset : 0),
            col: startCol + (direction === 'across' ? offset : 0),
          }))
          const inBounds = proposed.every((cell) => cell.row > 0 && cell.col > 0 && cell.row < size - 1 && cell.col < size - 1)
          const compatible = proposed.every((cell, offset) => {
            const value = cells.get(crosswordKey(cell.row, cell.col))
            return !value || value === letters[offset]
          })
          if (inBounds && compatible) nextPlacement = { word: entry, cells: proposed, direction }
        }
      }
    }

    if (!nextPlacement) continue
    nextPlacement.cells.forEach((cell, index) => cells.set(crosswordKey(cell.row, cell.col), letters[index]))
    placed.push(nextPlacement)
  }

  const starts = [...new Set(placed.map((item) => crosswordKey(item.cells[0].row, item.cells[0].col)))]
    .sort((left, right) => {
      const [leftRow, leftCol] = left.split('-').map(Number)
      const [rightRow, rightCol] = right.split('-').map(Number)
      return leftRow - rightRow || leftCol - rightCol
    })
  const numbering = new Map(starts.map((key, index) => [key, index + 1]))
  const placements = placed.map((item) => ({ ...item, number: numbering.get(crosswordKey(item.cells[0].row, item.cells[0].col)) ?? 1 }))

  return { size, placements, cells }
}
