import type { ContentItem, Module, SrsState } from '../types'
import { selectSessionItems, type SessionSelection } from './srs'
import { WRITING_PROMPTS_PER_SESSION } from './writing'
import { SPEAKING_PROMPTS_PER_SESSION } from './speaking'

/** Libellés d'affichage des modalités (PRD §5). */
export const MODULE_LABELS: Record<Module, string> = {
  vocab: 'Vocabulaire',
  grammar: 'Grammaire',
  listening: 'Écoute',
  writing: 'Rédaction',
  speaking: 'Oral',
}

/** Modalités de production : sessions courtes au format examen (PRD §16). */
const PRODUCTION_CAP: Partial<Record<Module, number>> = {
  writing: WRITING_PROMPTS_PER_SESSION,
  speaking: SPEAKING_PROMPTS_PER_SESSION,
}

/** Sous-ensemble du contenu jouable dans une modalité donnée. */
export function itemsForModule(items: ContentItem[], module: Module): ContentItem[] {
  return items.filter((item) => item.type === module)
}

/**
 * File d'une session pour une modalité. En production (rédaction, oral),
 * 2 sujets maximum comme à l'examen (PRD §16) — révisions dues d'abord.
 */
export function selectForModule(
  items: ContentItem[],
  states: Record<string, SrsState>,
  now: Date,
  module: Module,
): SessionSelection {
  const pool = itemsForModule(items, module)
  const cap = PRODUCTION_CAP[module]
  if (cap === undefined) return selectSessionItems(pool, states, now)
  const { reviews, fresh } = selectSessionItems(pool, states, now, {
    maxReviews: cap,
    maxNew: cap,
  })
  return { reviews, fresh: fresh.slice(0, cap - reviews.length) }
}

/**
 * Fisher-Yates sans mutation. `rng` injectable pour des tests déterministes.
 * Sert à mélanger l'ordre des options d'un drill à l'affichage.
 */
export function shuffle<T>(array: readonly T[], rng: () => number = Math.random): T[] {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    const a = copy[i] as T
    copy[i] = copy[j] as T
    copy[j] = a
  }
  return copy
}
