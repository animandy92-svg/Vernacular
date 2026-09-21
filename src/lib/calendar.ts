export const dateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export function daysAfter(day: string, days: number) {
  const [year, month, date] = day.split('-').map(Number)
  const next = new Date(year, month - 1, date, 12)
  next.setDate(next.getDate() + days)
  return dateKey(next)
}
