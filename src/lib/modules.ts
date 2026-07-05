import type { ContentItem, Module } from '../types'

/** Libellés d'affichage des modalités (PRD §5). */
export const MODULE_LABELS: Record<Module, string> = {
  vocab: 'Vocabulaire',
  grammar: 'Grammaire',
}

/** Sous-ensemble du contenu jouable dans une modalité donnée. */
export function itemsForModule(items: ContentItem[], module: Module): ContentItem[] {
  return items.filter((item) => item.type === module)
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
