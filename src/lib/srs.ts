import type { Grade, SrsState, ContentItem } from '../types'

/**
 * Répétition espacée type SM-2 (PRD §7) :
 * - réponse correcte → l'intervalle augmente (1 j, 6 j, puis intervalle × facteur de facilité)
 * - réponse ratée → répétitions et intervalle réinitialisés, l'item redevient dû immédiatement
 * Les trois boutons de l'UI sont mappés sur la qualité SM-2 : raté=2, difficile=3, réussi=5.
 */

const GRADE_QUALITY: Record<Grade, number> = {
  again: 2,
  hard: 3,
  good: 5,
}

export const MIN_EASE_FACTOR = 1.3
export const INITIAL_EASE_FACTOR = 2.5

const DAY_MS = 24 * 60 * 60 * 1000

export function initialSrsState(itemId: string, now: Date): SrsState {
  return {
    itemId,
    easeFactor: INITIAL_EASE_FACTOR,
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
    nextReviewAt: now.toISOString(),
  }
}

function nextEaseFactor(easeFactor: number, quality: number): number {
  const updated = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  return Math.max(MIN_EASE_FACTOR, updated)
}

export function review(state: SrsState, grade: Grade, now: Date): SrsState {
  const quality = GRADE_QUALITY[grade]
  const easeFactor = nextEaseFactor(state.easeFactor, quality)

  if (quality < 3) {
    // Raté : l'item repart de zéro et reste dû immédiatement (retravaillé dans la session).
    return {
      ...state,
      easeFactor,
      repetitions: 0,
      intervalDays: 0,
      lapses: state.lapses + 1,
      nextReviewAt: now.toISOString(),
    }
  }

  const repetitions = state.repetitions + 1
  let intervalDays: number
  if (repetitions === 1) {
    intervalDays = 1
  } else if (repetitions === 2) {
    intervalDays = 6
  } else {
    intervalDays = Math.round(state.intervalDays * easeFactor)
  }

  return {
    ...state,
    easeFactor,
    repetitions,
    intervalDays,
    nextReviewAt: new Date(now.getTime() + intervalDays * DAY_MS).toISOString(),
  }
}

export function isDue(state: SrsState, now: Date): boolean {
  return new Date(state.nextReviewAt).getTime() <= now.getTime()
}

export interface SessionSelection {
  /** Items dus (déjà vus), les plus en retard d'abord. */
  reviews: ContentItem[]
  /** Items jamais vus, dans l'ordre du contenu. */
  fresh: ContentItem[]
}

export const DEFAULT_MAX_REVIEWS = 20
export const DEFAULT_MAX_NEW = 8

/**
 * Compose la file d'une session : d'abord les révisions dues, puis quelques
 * nouveaux items pour alimenter le SRS sans noyer l'élève.
 */
export function selectSessionItems(
  items: ContentItem[],
  states: Record<string, SrsState>,
  now: Date,
  { maxReviews = DEFAULT_MAX_REVIEWS, maxNew = DEFAULT_MAX_NEW } = {},
): SessionSelection {
  const reviews = items
    .filter((item) => {
      const state = states[item.id]
      return state !== undefined && isDue(state, now)
    })
    .sort((a, b) => {
      const stateA = states[a.id]
      const stateB = states[b.id]
      if (stateA === undefined || stateB === undefined) return 0
      return new Date(stateA.nextReviewAt).getTime() - new Date(stateB.nextReviewAt).getTime()
    })
    .slice(0, maxReviews)

  const fresh = items.filter((item) => states[item.id] === undefined).slice(0, maxNew)

  return { reviews, fresh }
}
