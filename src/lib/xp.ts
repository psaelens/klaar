import type { Grade } from '../types'

/**
 * Calcul d'XP (PRD §8) : pondéré par difficulté, plafonné par session
 * (anti-farming), bonus de complétion pour encourager à finir la session.
 * Fonctions pures — la persistance est dans storage.ts.
 */

/** XP de base d'une bonne réponse en vocabulaire, multiplié par la difficulté (1-3). */
export const XP_BASE_VOCAB = 10
/** Bonus quand la session est terminée jusqu'au bout. */
export const XP_SESSION_COMPLETION_BONUS = 20
/** Plafond d'XP par session (anti-farming, PRD §8). */
export const XP_SESSION_CAP = 300

export interface AnsweredCard {
  difficulty: 1 | 2 | 3
  grade: Grade
}

/** XP d'une seule réponse : réussi = plein, difficile = moitié, raté = 0 (jamais négatif). */
export function xpForAnswer(card: AnsweredCard): number {
  switch (card.grade) {
    case 'good':
      return XP_BASE_VOCAB * card.difficulty
    case 'hard':
      return Math.round((XP_BASE_VOCAB * card.difficulty) / 2)
    case 'again':
      return 0
  }
}

/** XP total d'une session : somme des réponses + bonus de complétion, plafonné. */
export function sessionXp(answers: AnsweredCard[], completed: boolean): number {
  const total =
    answers.reduce((sum, card) => sum + xpForAnswer(card), 0) + (completed ? XP_SESSION_COMPLETION_BONUS : 0)
  return Math.min(total, XP_SESSION_CAP)
}
