import type { Module, SessionRecord } from '../types'
import { localDay } from './streak'

/**
 * Badges (PRD §8) : règles pures calculées côté client après chaque session
 * terminée, à partir des données déjà synchronisées (sessions, XP, streak).
 * Un badge gagné ne se reprend jamais (table append-only côté serveur).
 */

export interface BadgeDef {
  code: string
  emoji: string
  label: string
  description: string
}

export const BADGES: BadgeDef[] = [
  { code: 'first-session', emoji: '🐣', label: 'Premier pas', description: 'Première session terminée' },
  {
    code: 'perfect-session',
    emoji: '🎯',
    label: 'Sans faute',
    description: 'Une session d’au moins 5 cartes sans aucune erreur',
  },
  {
    code: 'all-modules-day',
    emoji: '🎒',
    label: 'Menu complet',
    description: 'Trois modalités différentes le même jour',
  },
  {
    code: 'first-writing',
    emoji: '✍️',
    label: 'Première rédaction',
    description: 'Un premier texte écrit en néerlandais',
  },
  {
    code: 'first-speaking',
    emoji: '🎤',
    label: 'Première prise de parole',
    description: 'Un premier sujet présenté à voix haute en néerlandais',
  },
  { code: 'sessions-25', emoji: '🏃', label: 'Marathonien', description: '25 sessions terminées' },
  { code: 'streak-3', emoji: '🔥', label: 'Bien lancé', description: '3 jours de travail d’affilée' },
  { code: 'streak-7', emoji: '⚡', label: 'Semaine complète', description: '7 jours d’affilée' },
  { code: 'streak-14', emoji: '🌟', label: 'Inarrêtable', description: '14 jours d’affilée' },
  { code: 'xp-500', emoji: '💪', label: '500 XP', description: '500 points d’expérience au total' },
  { code: 'xp-1000', emoji: '🏆', label: '1000 XP', description: '1000 points d’expérience au total' },
]

export function badgeDef(code: string): BadgeDef | undefined {
  return BADGES.find((badge) => badge.code === code)
}

export interface BadgeInput {
  records: SessionRecord[]
  xpTotal: number
  /** Streak courant en jours (calculé par computeStreak). */
  streakDays: number
}

/** Tous les codes de badges mérités dans l'état actuel. */
export function deservedBadges({ records, xpTotal, streakDays }: BadgeInput): string[] {
  const deserved: string[] = []

  if (records.length >= 1) deserved.push('first-session')
  if (records.length >= 25) deserved.push('sessions-25')
  if (records.some((record) => record.cardsReviewed >= 5 && record.lapsed === 0))
    deserved.push('perfect-session')

  const modulesByDay = new Map<string, Set<Module>>()
  for (const record of records) {
    const day = localDay(new Date(record.finishedAt))
    const set = modulesByDay.get(day) ?? new Set<Module>()
    set.add(record.module ?? 'vocab')
    modulesByDay.set(day, set)
  }
  if ([...modulesByDay.values()].some((set) => set.size >= 3)) deserved.push('all-modules-day')
  if (records.some((record) => record.module === 'writing')) deserved.push('first-writing')
  if (records.some((record) => record.module === 'speaking')) deserved.push('first-speaking')

  if (streakDays >= 3) deserved.push('streak-3')
  if (streakDays >= 7) deserved.push('streak-7')
  if (streakDays >= 14) deserved.push('streak-14')
  if (xpTotal >= 500) deserved.push('xp-500')
  if (xpTotal >= 1000) deserved.push('xp-1000')

  return deserved
}

/** Codes mérités mais pas encore gagnés (à attribuer maintenant). */
export function newBadges(input: BadgeInput, earnedCodes: string[]): string[] {
  const earned = new Set(earnedCodes)
  return deservedBadges(input).filter((code) => !earned.has(code))
}
