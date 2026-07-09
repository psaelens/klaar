/** Modalité de travail (sous-ensemble des types de contenu déjà jouables). */
export type Module = 'vocab' | 'grammar' | 'listening' | 'writing' | 'speaking'

/** Item de contenu pédagogique (aligné sur le schéma `content_items`, PRD §7). */
export interface ContentItem {
  id: string
  type: Module
  theme: string
  /** Face question : mot NL (vocab), phrase à trou (grammar) ou consigne FR (writing). */
  front: string
  /** Face réponse : traduction (vocab), bonne réponse (grammar/listening) ou texte modèle NL (writing). */
  back: string
  /** Options du drill à choix, bonne réponse incluse (grammar, listening) ; absent pour le vocabulaire. */
  choices?: string[] | null
  /** Question de compréhension en français (listening : front = transcript NL lu en TTS). */
  question?: string | null
  /** Points attendus, en français (writing/speaking : auto-évaluation guidée). */
  checklist?: string[] | null
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
  /** Modalité travaillée (absent sur les sessions d'avant M2 : vocabulaire). */
  module?: Module
  /** Nombre de cartes distinctes vues. */
  cardsReviewed: number
  /** Cartes réussies du premier coup. */
  correctFirstTry: number
  /** Cartes ratées au moins une fois (puis retravaillées dans la session). */
  lapsed: number
  /** Durée de la session en secondes (absent sur les sessions d'avant M1). */
  durationSeconds?: number
  /** XP gagné pendant la session (absent sur les sessions d'avant M1). */
  xpEarned?: number
}

/** Entrée du journal d'XP (aligné sur le futur `xp_ledger`, PRD §7). */
export interface XpEntry {
  amount: number
  reason: string
  createdAt: string
}

/** Badge gagné (aligné sur la table `badges`) — ne se reprend jamais. */
export interface EarnedBadge {
  code: string
  earnedAt: string
}
