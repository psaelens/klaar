import type { Module, SessionRecord } from '../types'
import { dailyActivity, successRate } from './dashboard'
import { STREAK_MIN_MINUTES_PER_DAY } from './streak'

/**
 * Rapport hebdomadaire du dashboard parent (PRD §9) : résumé lisible
 * auto-généré des 7 derniers jours, comparé aux 7 jours précédents.
 * Fonctions pures — l'affichage est dans Parent.tsx.
 */

export interface WeeklyReport {
  /** Jours avec au moins une session, sur les 7 derniers jours. */
  daysWorked: number
  /** Jours ayant atteint l'heure de travail (seuil du streak). */
  daysValidated: number
  minutes: number
  /** Delta de minutes vs les 7 jours précédents. */
  minutesDelta: number
  /** Réussite du 1er coup sur la semaine (null si aucune carte). */
  rate: number | null
  /** Delta en points de pourcentage vs la semaine précédente (null si une des deux est vide). */
  rateDeltaPct: number | null
  /** Modalité la plus faible de la semaine (≥ 5 cartes vues), pour cibler l'aide (PRD §9). */
  weakest: { module: Module; rate: number } | null
}

/** Sessions entre `fromDaysAgo` et `toDaysAgo` jours locaux avant `now` (bornes calendrier). */
function inWindow(records: SessionRecord[], now: Date, fromDaysAgo: number, toDaysAgo: number) {
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - fromDaysAgo).getTime()
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() - toDaysAgo + 1).getTime()
  return records.filter((record) => {
    const t = new Date(record.finishedAt).getTime()
    return t >= from && t < to
  })
}

const TRAINING_MODULES: Module[] = ['vocab', 'grammar', 'listening', 'writing', 'speaking']

export function weeklyReport(records: SessionRecord[], now: Date): WeeklyReport {
  const week = inWindow(records, now, 6, 0)
  const previousWeek = inWindow(records, now, 13, 7)

  const days = dailyActivity(records, now, 7)
  const daysWorked = days.filter((day) => day.sessions > 0).length
  const daysValidated = days.filter((day) => day.minutes >= STREAK_MIN_MINUTES_PER_DAY).length
  const minutes = days.reduce((sum, day) => sum + day.minutes, 0)
  const previousMinutes = Math.round(
    previousWeek.reduce((sum, record) => sum + (record.durationSeconds ?? 0) / 60, 0),
  )

  const rate = successRate(week)
  const previousRate = successRate(previousWeek)
  const rateDeltaPct = rate !== null && previousRate !== null ? Math.round((rate - previousRate) * 100) : null

  let weakest: WeeklyReport['weakest'] = null
  for (const module of TRAINING_MODULES) {
    const ofModule = week.filter((record) => (record.module ?? 'vocab') === module)
    const seen = ofModule.reduce((sum, record) => sum + record.cardsReviewed, 0)
    const moduleRate = successRate(ofModule)
    if (seen >= 5 && moduleRate !== null && (weakest === null || moduleRate < weakest.rate)) {
      weakest = { module, rate: moduleRate }
    }
  }

  return {
    daysWorked,
    daysValidated,
    minutes,
    minutesDelta: minutes - previousMinutes,
    rate,
    rateDeltaPct,
    weakest,
  }
}
