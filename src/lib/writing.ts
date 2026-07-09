import type { Grade } from '../types'

/**
 * Expression écrite guidée (PRD §11, M4) : fonctions pures de l'écran de
 * rédaction. Format examen CE1D (PRD §16) : deux rédactions courtes d'environ
 * 60 mots, sans dictionnaire, niveau A2-. Pas de juge automatique (PRD §13) :
 * l'élève s'auto-évalue avec la checklist des points attendus.
 */

/** Une session de rédaction = 2 textes, comme les deux rédactions de l'examen. */
export const WRITING_PROMPTS_PER_SESSION = 2
/** Longueur visée à l'examen. */
export const WRITING_TARGET_WORDS = 60
/** En dessous, le texte est trop court pour être auto-évalué (bouton désactivé). */
export const WRITING_MIN_WORDS = 40

/** Compte les mots d'un brouillon : séquences séparées par des blancs contenant au moins une lettre ou un chiffre. */
export function countWords(text: string): number {
  return text.split(/\s+/).filter((token) => /[\p{L}\p{N}]/u.test(token)).length
}

/**
 * Note suggérée par l'auto-évaluation : tous les points cochés = réussi,
 * au moins la moitié = difficile, sinon à revoir. L'élève reste libre de
 * choisir — c'est une aide, pas un juge (PRD §13).
 */
export function suggestedGrade(checkedCount: number, totalCount: number): Grade {
  if (totalCount === 0 || checkedCount >= totalCount) return 'good'
  if (checkedCount * 2 >= totalCount) return 'hard'
  return 'again'
}
