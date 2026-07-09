import examsRaw from '../data/exams.json'

/**
 * Examens blancs (PRD §11 M6, §8 boss battles), calibrés sur le format
 * officiel CE1D (docs/CE1D-FORMAT.md) : CA /30 + CL /20 + EE /20 pour
 * l'écrit, EO /30 pour l'oral, seuil de réussite 50 %. Épreuves originales
 * générées au même format — le contenu officiel ne peut pas être embarqué
 * (droits FWB, repo public). Correction par auto-évaluation (PRD §13).
 */

export type ExamType = 'ecrit' | 'oral'
export type SectionKind = 'ca' | 'cl' | 'ee' | 'eo'

export interface ChecklistPoint {
  label: string
  points: number
}

export interface ExamTask {
  id: string
  title: string
  /** Contexte de communication, en français (comme l'épreuve officielle). */
  context: string
  instruction: string
  /** CA : transcript NL lu en TTS ; CL : texte NL affiché. */
  source?: string
  /** CA/CL : corrigé — informations attendues, en français. */
  expected?: string[]
  /** CA/CL : nombre de réponses demandées (le corrigé peut en lister plus). */
  answersToCount?: number
  /** EE : minimum de mots officiel. */
  minWords?: number
  /** EE/EO : grille d'auto-évaluation pondérée (somme = points). */
  checklist?: ChecklistPoint[]
  /** EE/EO : exemple de réponse NL. */
  example?: string
  /** EO interaction : questions posées en NL (TTS). */
  questions?: string[]
  points: number
}

export interface ExamSection {
  kind: SectionKind
  label: string
  /** Durée officielle ou approchée de la section (CE1D-FORMAT.md). */
  minutes: number
  tasks: ExamTask[]
}

export interface ExamDef {
  id: string
  type: ExamType
  title: string
  sections: ExamSection[]
}

export const exams: ExamDef[] = examsRaw as ExamDef[]

export function examById(id: string): ExamDef | undefined {
  return exams.find((exam) => exam.id === id)
}

/** Barème total d'une épreuve (écrit = 70, oral = 30). */
export function examMaxScore(exam: ExamDef): number {
  return exam.sections.reduce(
    (sum, section) => sum + section.tasks.reduce((s, task) => s + task.points, 0),
    0,
  )
}

/**
 * Cote d'une tâche CA/CL : réponses trouvées / réponses demandées, au prorata
 * des points, arrondi au demi-point (comme la conversion Æ officielle).
 */
export function comprehensionScore(foundCount: number, task: ExamTask): number {
  const total = task.answersToCount ?? task.expected?.length ?? 0
  if (total === 0) return 0
  const capped = Math.min(foundCount, total)
  return Math.round((capped / total) * task.points * 2) / 2
}

/** En dessous de 55 mots, la grille officielle n°2 plafonne à 8/20 (soit 4/10). */
export const EE_SHORT_TEXT_CAP_RATIO = 0.4
export const EE_MIN_WORDS_OFFICIAL = 55

/**
 * Cote d'une tâche EE/EO : somme des points cochés dans la grille.
 * EE : un texte sous 55 mots est plafonné (incontournable officiel).
 */
export function productionScore(checkedPoints: number[], task: ExamTask, wordCount?: number): number {
  const checklist = task.checklist ?? []
  const raw = checkedPoints.reduce((sum, index) => sum + (checklist[index]?.points ?? 0), 0)
  const tooShort = task.minWords !== undefined && wordCount !== undefined && wordCount < EE_MIN_WORDS_OFFICIAL
  return tooShort ? Math.min(raw, Math.round(task.points * EE_SHORT_TEXT_CAP_RATIO)) : raw
}

/** Seuil de réussite officiel du CE1D. */
export const EXAM_PASS_RATIO = 0.5
/** Boss battle (PRD §8) : XP de complétion + bonus si l'épreuve est réussie. */
export const XP_EXAM_COMPLETION = 100
export const XP_EXAM_PASS_BONUS = 100

export function examXp(score: number, maxScore: number): number {
  const passed = maxScore > 0 && score / maxScore >= EXAM_PASS_RATIO
  return XP_EXAM_COMPLETION + (passed ? XP_EXAM_PASS_BONUS : 0)
}
