import type { Module, SessionRecord } from '../types'
import { localDay } from './streak'

/**
 * Agrégations pures du dashboard parent (PRD §9) : jours travaillés,
 * minutes/jour, taux de réussite. Le taux de réussite = cartes sues du
 * premier coup / cartes vues — même définition que le bilan de session.
 */

export interface DayActivity {
  /** Jour calendrier local YYYY-MM-DD. */
  day: string
  minutes: number
  sessions: number
}

/** Activité des `days` derniers jours locaux (aujourd'hui inclus), du plus ancien au plus récent. */
export function dailyActivity(records: SessionRecord[], now: Date, days = 28): DayActivity[] {
  const byDay = new Map<string, { minutes: number; sessions: number }>()
  for (const record of records) {
    const day = localDay(new Date(record.finishedAt))
    const entry = byDay.get(day) ?? { minutes: 0, sessions: 0 }
    entry.minutes += (record.durationSeconds ?? 0) / 60
    entry.sessions += 1
    byDay.set(day, entry)
  }

  const result: DayActivity[] = []
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset)
    const day = localDay(date)
    const entry = byDay.get(day)
    result.push({
      day,
      minutes: Math.round(entry?.minutes ?? 0),
      sessions: entry?.sessions ?? 0,
    })
  }
  return result
}

/** Taux de réussite 0..1 (null si aucune carte vue). */
export function successRate(records: SessionRecord[]): number | null {
  let seen = 0
  let firstTry = 0
  for (const record of records) {
    seen += record.cardsReviewed
    firstTry += record.correctFirstTry
  }
  return seen === 0 ? null : firstTry / seen
}

/** Taux de réussite par modalité (les sessions d'avant M2 comptent comme vocabulaire). */
export function successRateByModule(records: SessionRecord[]): Record<Module, number | null> {
  const of = (module: Module) =>
    successRate(records.filter((record) => (record.module ?? 'vocab') === module))
  return { vocab: of('vocab'), grammar: of('grammar') }
}

/** Minutes travaillées sur les `days` derniers jours locaux (aujourd'hui inclus). */
export function minutesInLastDays(records: SessionRecord[], now: Date, days = 7): number {
  return dailyActivity(records, now, days).reduce((sum, day) => sum + day.minutes, 0)
}
