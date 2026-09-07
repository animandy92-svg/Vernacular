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

const FILLER = Array.from('ABDEFGHIKMNOPRSTUWYƐƆ')

export function generateWordGrid(words: WordEntry[], size = 8, random: () => number = Math.random): WordGrid {
  const grid = Array.from({ length: size }, () => Array<string>(size).fill(''))
  const placements: WordPlacement[] = []

  for (const entry of words) {
    const letters = Array.from(normalizeWord(entry.word).replace(/[^A-ZƐƆ]/g, ''))
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
      if (!value) row[col] = FILLER[Math.floor(random() * FILLER.length)]
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
