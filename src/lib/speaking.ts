/**
 * Expression orale (PRD §11, M5) : fonctions pures de l'écran d'oral.
 * L'élève écoute une prononciation de référence (TTS du texte modèle),
 * s'enregistre (MediaRecorder), puis s'auto-évalue avec la checklist —
 * la note suggérée est partagée avec la rédaction (`suggestedGrade`,
 * writing.ts) : jamais de juge automatique (PRD §13).
 */

/** Une session d'oral = 2 sujets, comme les deux parties de l'examen. */
export const SPEAKING_PROMPTS_PER_SESSION = 2
/** En dessous, la prise est trop courte pour être auto-évaluée (bouton désactivé). */
export const SPEAKING_MIN_SECONDS = 20
/** Durée visée par l'examen oral. */
export const SPEAKING_TARGET_SECONDS = 90
/**
 * Rétention des enregistrements dans Supabase Storage : assez pour le créneau
 * d'écoute hebdomadaire du parent (PRD §13) avec de la marge, sans faire
 * gonfler le quota de stockage (décision Pierre 2026-07-09).
 */
export const RECORDINGS_RETENTION_DAYS = 14

/** m:ss pour l'affichage d'une durée d'enregistrement. */
export function formatSeconds(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(clamped / 60)
  const seconds = String(clamped % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

/** Chemin de l'objet Storage : {userId}/{horodatage}-{itemId}.webm — le dossier racine porte les policies RLS. */
export function recordingPath(userId: string, itemId: string, now: Date): string {
  const stamp = now.toISOString().replaceAll(':', '-')
  return `${userId}/${stamp}-${itemId}.webm`
}

/** L'objet Storage a-t-il dépassé la rétention ? */
export function isExpired(createdAt: string, now: Date, retentionDays = RECORDINGS_RETENTION_DAYS): boolean {
  const ageMs = now.getTime() - new Date(createdAt).getTime()
  return ageMs > retentionDays * 24 * 60 * 60 * 1000
}
