import type { ContentItem, Module, SrsState } from '../types'
import { selectSessionItems, type SessionSelection } from './srs'
import { WRITING_PROMPTS_PER_SESSION } from './writing'

/** Libellés d'affichage des modalités (PRD §5). */
export const MODULE_LABELS: Record<Module, string> = {
  vocab: 'Vocabulaire',
  grammar: 'Grammaire',
  listening: 'Écoute',
  writing: 'Rédaction',
}

/** Sous-ensemble du contenu jouable dans une modalité donnée. */
export function itemsForModule(items: ContentItem[], module: Module): ContentItem[] {
  return items.filter((item) => item.type === module)
}

/**
 * File d'une session pour une modalité. En rédaction, 2 textes maximum comme
 * les deux rédactions de l'examen (PRD §16) — révisions dues d'abord.
 */
export function selectForModule(
  items: ContentItem[],
  states: Record<string, SrsState>,
  now: Date,
  module: Module,
): SessionSelection {
  const pool = itemsForModule(items, module)
  if (module !== 'writing') return selectSessionItems(pool, states, now)
  const { reviews, fresh } = selectSessionItems(pool, states, now, {
    maxReviews: WRITING_PROMPTS_PER_SESSION,
    maxNew: WRITING_PROMPTS_PER_SESSION,
  })
  return { reviews, fresh: fresh.slice(0, WRITING_PROMPTS_PER_SESSION - reviews.length) }
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
