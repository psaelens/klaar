import type { SessionRecord } from '../types'

/**
 * Streak (PRD §8) : jours consécutifs travaillés, un jour manqué casse le
 * compteur, pas de rattrapage. Le seuil de minutes par jour est paramétrable :
 * 0 tant que seul le vocabulaire existe (voir DECISIONS.md), il passera à 60
 * quand les autres modalités permettront réellement 1 h/jour.
 */

export interface StreakResult {
  /** Jours consécutifs validés, aujourd'hui inclus s'il est déjà validé. */
  current: number
  /** Le quota du jour est-il atteint ? */
  todayDone: boolean
}

/** Jour calendrier local (fuseau de l'appareil) au format YYYY-MM-DD. */
export function localDay(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function previousDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number]
  return localDay(new Date(y, m - 1, d - 1))
}

export function computeStreak(
  records: SessionRecord[],
  now: Date,
  { minMinutesPerDay = 0 } = {},
): StreakResult {
  // Minutes travaillées par jour local
  const minutesByDay = new Map<string, number>()
  for (const record of records) {
    const day = localDay(new Date(record.finishedAt))
    const minutes = (record.durationSeconds ?? 0) / 60
    minutesByDay.set(day, (minutesByDay.get(day) ?? 0) + minutes)
  }

  const isValidated = (day: string): boolean => {
    const minutes = minutesByDay.get(day)
    if (minutes === undefined) return false
    return minMinutesPerDay === 0 || minutes >= minMinutesPerDay
  }

  const today = localDay(now)
  const todayDone = isValidated(today)

  // Le streak se compte à partir d'aujourd'hui (s'il est validé) ou d'hier
  // (aujourd'hui pas encore validé ne casse pas le streak — la journée n'est pas finie).
  let day = todayDone ? today : previousDay(today)
  let current = 0
  while (isValidated(day)) {
    current += 1
    day = previousDay(day)
  }

  return { current, todayDone }
}
