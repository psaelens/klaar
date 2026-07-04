/** Item de contenu pédagogique (aligné sur le futur schéma `content_items`, PRD §7). */
export interface ContentItem {
  id: string
  type: 'vocab'
  theme: string
  /** Face question : le mot en néerlandais. */
  front: string
  /** Face réponse : la traduction française. */
  back: string
  difficulty: 1 | 2 | 3
  /** Unité du programme (null tant que les feuilles scannées ne sont pas importées). */
  curriculum_unit: string | null
}

/** Note donnée par l'élève après avoir vu la réponse. */
export type Grade = 'again' | 'hard' | 'good'

/** État de répétition espacée d'un item pour l'élève (aligné sur le futur `srs_state`). */
export interface SrsState {
  itemId: string
  easeFactor: number
  intervalDays: number
  repetitions: number
  lapses: number
  /** ISO 8601 — l'item est dû quand nextReviewAt <= maintenant. */
  nextReviewAt: string
}

/** Résumé d'une session de révision terminée. */
export interface SessionRecord {
  finishedAt: string
  /** Nombre de cartes distinctes vues. */
  cardsReviewed: number
  /** Cartes réussies du premier coup. */
  correctFirstTry: number
  /** Cartes ratées au moins une fois (puis retravaillées dans la session). */
  lapsed: number
}
