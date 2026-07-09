import type { ContentItem, EarnedBadge, MockExamResult, SessionRecord, SrsState, XpEntry } from '../types'
import { seedItems } from '../data'
import { supabase } from './supabase'
import { isExpired, recordingPath } from './speaking'
import {
  appendEarnedBadges,
  appendMockExam,
  appendSessionRecord,
  appendXpEntry,
  loadEarnedBadges,
  loadMockExams,
  loadSessionRecords,
  loadSrsStates,
  loadXpLedger,
  replaceEarnedBadges,
  replaceMockExams,
  replaceSessionRecords,
  replaceSrsStates,
  replaceXpLedger,
  saveProfile,
  saveSrsState,
  loadProfile,
  type StoredProfile,
} from './storage'

/**
 * Couche d'accès aux données des écrans. Deux modes :
 * - local (pas d'env Supabase ou pas connecté) : localStorage uniquement, comme en M0 ;
 * - connecté : write-through — localStorage d'abord (l'app reste utilisable hors
 *   ligne), puis push vers Supabase ; les push ratés sont mis en file et rejoués
 *   au prochain démarrage. À la connexion, les données locales existantes sont
 *   migrées une fois vers le cloud, puis le serveur fait référence.
 */

const PUSH_QUEUE_KEY = 'klaar.pushqueue.v1'
const SYNCED_FLAG_KEY = 'klaar.synced.v1'

type PushOp =
  | { type: 'srs'; state: SrsState }
  | { type: 'session'; record: SessionRecord }
  | { type: 'xp'; entry: XpEntry }
  | { type: 'badge'; badge: EarnedBadge }
  | { type: 'exam'; result: MockExamResult }

function loadQueue(): PushOp[] {
  try {
    return JSON.parse(localStorage.getItem(PUSH_QUEUE_KEY) ?? '[]') as PushOp[]
  } catch {
    return []
  }
}

function saveQueue(queue: PushOp[]): void {
  localStorage.setItem(PUSH_QUEUE_KEY, JSON.stringify(queue))
}

function enqueue(op: PushOp): void {
  saveQueue([...loadQueue(), op])
}

const cache: {
  items: ContentItem[]
  states: Record<string, SrsState>
  userId: string | null
  profile: StoredProfile | null
} = {
  items: seedItems,
  states: {},
  userId: null,
  profile: null,
}

async function pushOp(userId: string, op: PushOp): Promise<boolean> {
  if (supabase === null) return false
  if (op.type === 'srs') {
    const { error } = await supabase.from('srs_state').upsert({
      user_id: userId,
      content_item_id: op.state.itemId,
      ease_factor: op.state.easeFactor,
      interval_days: op.state.intervalDays,
      repetitions: op.state.repetitions,
      lapses: op.state.lapses,
      next_review_at: op.state.nextReviewAt,
      updated_at: new Date().toISOString(),
    })
    return error === null
  }
  if (op.type === 'session') {
    const { error } = await supabase.from('sessions').insert({
      user_id: userId,
      finished_at: op.record.finishedAt,
      cards_reviewed: op.record.cardsReviewed,
      correct_first_try: op.record.correctFirstTry,
      lapsed: op.record.lapsed,
      duration_seconds: op.record.durationSeconds ?? null,
      xp_earned: op.record.xpEarned ?? null,
      module: op.record.module ?? null,
    })
    return error === null
  }
  if (op.type === 'exam') {
    const { error } = await supabase.from('mock_exams').insert({
      user_id: userId,
      exam_type: op.result.examType,
      exam_id: op.result.examId,
      score: op.result.score,
      max_score: op.result.maxScore,
      taken_at: op.result.takenAt,
      duration_seconds: op.result.durationSeconds ?? null,
      details: op.result.details ?? null,
    })
    return error === null
  }
  if (op.type === 'badge') {
    // ignoreDuplicates : un badge déjà gagné (autre appareil) n'est pas une erreur.
    const { error } = await supabase
      .from('badges')
      .upsert(
        { user_id: userId, badge_code: op.badge.code, earned_at: op.badge.earnedAt },
        { onConflict: 'user_id,badge_code', ignoreDuplicates: true },
      )
    return error === null
  }
  const { error } = await supabase.from('xp_ledger').insert({
    user_id: userId,
    amount: op.entry.amount,
    reason: op.entry.reason,
    created_at: op.entry.createdAt,
  })
  return error === null
}

/** Rejoue la file des push ratés ; s'arrête à la première erreur (réessaiera plus tard). */
async function flushQueue(userId: string): Promise<void> {
  let queue = loadQueue()
  while (queue.length > 0) {
    const op = queue[0]
    if (op === undefined || !(await pushOp(userId, op))) break
    queue = queue.slice(1)
    saveQueue(queue)
  }
}

/**
 * Migration unique des données locales pré-connexion vers le cloud.
 * Si un AUTRE utilisateur s'était déjà synchronisé sur cet appareil, on ne
 * migre rien (ces données locales sont les siennes, pas celles du nouveau
 * connecté) — le pull qui suit remplacera le cache local.
 */
async function migrateLocalData(userId: string): Promise<void> {
  const alreadySynced = localStorage.getItem(SYNCED_FLAG_KEY)
  if (alreadySynced === userId) return
  if (alreadySynced === null) {
    for (const state of Object.values(loadSrsStates())) {
      enqueue({ type: 'srs', state })
    }
    for (const record of loadSessionRecords()) {
      enqueue({ type: 'session', record })
    }
    for (const entry of loadXpLedger()) {
      enqueue({ type: 'xp', entry })
    }
    for (const badge of loadEarnedBadges()) {
      enqueue({ type: 'badge', badge })
    }
    for (const result of loadMockExams()) {
      enqueue({ type: 'exam', result })
    }
  } else {
    // Changement d'utilisateur : la file d'attente de l'ancien n'est plus valable.
    saveQueue([])
  }
  localStorage.setItem(SYNCED_FLAG_KEY, userId)
}

/** Récupère contenu + état depuis le serveur et rafraîchit le cache local. */
async function pullFromCloud(userId: string): Promise<void> {
  if (supabase === null) return

  const { data: items } = await supabase.from('content_items').select('*')
  if (items !== null && items.length > 0) {
    cache.items = items.map((row) => ({
      id: row.id,
      type: row.type as ContentItem['type'],
      theme: row.theme,
      front: row.front,
      back: row.back,
      choices: (row.choices as string[] | null) ?? null,
      question: row.question,
      checklist: (row.checklist as string[] | null) ?? null,
      difficulty: row.difficulty as ContentItem['difficulty'],
      curriculum_unit: row.curriculum_unit,
    }))
  }

  const { data: srsRows } = await supabase.from('srs_state').select('*').eq('user_id', userId)
  if (srsRows !== null) {
    const states: Record<string, SrsState> = {}
    for (const row of srsRows) {
      states[row.content_item_id] = {
        itemId: row.content_item_id,
        easeFactor: row.ease_factor,
        intervalDays: row.interval_days,
        repetitions: row.repetitions,
        lapses: row.lapses,
        nextReviewAt: row.next_review_at,
      }
    }
    cache.states = states
    replaceSrsStates(states)
  }

  const { data: sessionRows } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('finished_at', { ascending: true })
  if (sessionRows !== null) {
    replaceSessionRecords(
      sessionRows.map((row) => ({
        finishedAt: row.finished_at,
        module: (row.module as SessionRecord['module']) ?? undefined,
        cardsReviewed: row.cards_reviewed,
        correctFirstTry: row.correct_first_try,
        lapsed: row.lapsed,
        durationSeconds: row.duration_seconds ?? undefined,
        xpEarned: row.xp_earned ?? undefined,
      })),
    )
  }

  const { data: xpRows } = await supabase
    .from('xp_ledger')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (xpRows !== null) {
    replaceXpLedger(
      xpRows.map((row) => ({ amount: row.amount, reason: row.reason, createdAt: row.created_at })),
    )
  }

  const { data: badgeRows } = await supabase
    .from('badges')
    .select('badge_code, earned_at')
    .eq('user_id', userId)
    .order('earned_at', { ascending: true })
  if (badgeRows !== null) {
    replaceEarnedBadges(badgeRows.map((row) => ({ code: row.badge_code, earnedAt: row.earned_at })))
  }

  const { data: examRows } = await supabase
    .from('mock_exams')
    .select('*')
    .eq('user_id', userId)
    .order('taken_at', { ascending: true })
  if (examRows !== null) {
    replaceMockExams(
      examRows.map((row) => ({
        examId: row.exam_id,
        examType: row.exam_type as MockExamResult['examType'],
        score: row.score,
        maxScore: row.max_score,
        takenAt: row.taken_at,
        durationSeconds: row.duration_seconds ?? undefined,
        details: (row.details as Record<string, number> | null) ?? undefined,
      })),
    )
  }
}

/**
 * Rétention des enregistrements oraux (voir DECISIONS.md) : au démarrage,
 * l'élève supprime ses propres fichiers plus vieux que la rétention — pas de
 * tâche serveur, la policy RLS ne l'autorise que sur son dossier.
 */
async function cleanupOldRecordings(userId: string): Promise<void> {
  if (supabase === null) return
  const { data: objects } = await supabase.storage.from('recordings').list(userId, { limit: 100 })
  if (objects === null) return
  const now = new Date()
  const expired = objects
    .filter((object) => object.created_at !== null && isExpired(object.created_at, now))
    .map((object) => `${userId}/${object.name}`)
  if (expired.length > 0) await supabase.storage.from('recordings').remove(expired)
}

/**
 * Envoie une prise d'oral dans le bucket `recordings` (best-effort : pas de
 * file de retry pour les blobs — un upload raté ne bloque jamais la session,
 * le parent manquera juste cette prise).
 */
export function uploadRecording(blob: Blob, itemId: string): void {
  if (supabase === null || cache.userId === null) return
  const path = recordingPath(cache.userId, itemId, new Date())
  void supabase.storage
    .from('recordings')
    .upload(path, blob, { contentType: blob.type || 'audio/webm' })
    .catch(() => {})
}

/** À appeler une fois au démarrage de l'app, avant le premier rendu des pages. */
export async function initRepo(): Promise<void> {
  cache.states = loadSrsStates()
  cache.items = seedItems
  cache.userId = null
  cache.profile = null
  if (supabase === null) return

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session === null) {
    saveProfile(null)
    return
  }

  cache.userId = session.user.id
  // Profil pour l'affichage de l'accueil ; cache localStorage pour le hors ligne.
  cache.profile = loadProfile()
  try {
    await migrateLocalData(session.user.id)
    await flushQueue(session.user.id)
    await pullFromCloud(session.user.id)
    await cleanupOldRecordings(session.user.id)
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('display_name, role')
      .eq('id', session.user.id)
      .single()
    if (profileRow !== null) {
      cache.profile = {
        displayName: profileRow.display_name,
        role: profileRow.role as StoredProfile['role'],
      }
      saveProfile(cache.profile)
    }
  } catch {
    // Hors ligne ou serveur indisponible : l'app continue sur le cache local.
  }
}

/** La synchronisation est-elle configurée sur ce déploiement ? */
export function syncConfigured(): boolean {
  return supabase !== null
}

/** Utilisateur connecté (null = mode local/démo). */
export function getProfile(): StoredProfile | null {
  return cache.userId !== null ? cache.profile : null
}

export function isConnected(): boolean {
  return cache.userId !== null
}

export function getContentItems(): ContentItem[] {
  return cache.items
}

export function getSrsStates(): Record<string, SrsState> {
  return cache.states
}

export function saveState(state: SrsState): void {
  cache.states[state.itemId] = state
  saveSrsState(state)
  if (cache.userId !== null) {
    const userId = cache.userId
    void pushOp(userId, { type: 'srs', state }).then((ok) => {
      if (!ok) enqueue({ type: 'srs', state })
    })
  }
}

/** Attribue des badges (localStorage + push serveur), retourne les entrées créées. */
export function awardBadges(codes: string[], now: Date): EarnedBadge[] {
  const badges = codes.map((code) => ({ code, earnedAt: now.toISOString() }))
  appendEarnedBadges(badges)
  if (cache.userId !== null) {
    const userId = cache.userId
    for (const badge of badges) {
      void pushOp(userId, { type: 'badge', badge }).then((ok) => {
        if (!ok) enqueue({ type: 'badge', badge })
      })
    }
  }
  return badges
}

/**
 * Enregistre un examen blanc terminé : résultat + session (les minutes de
 * l'épreuve comptent pour le streak) + XP boss battle.
 */
export function recordMockExam(result: MockExamResult, record: SessionRecord, xpEntry: XpEntry): void {
  appendMockExam(result)
  if (cache.userId !== null) {
    const userId = cache.userId
    void pushOp(userId, { type: 'exam', result }).then((ok) => {
      if (!ok) enqueue({ type: 'exam', result })
    })
  }
  recordSession(record, xpEntry)
}

export function recordSession(record: SessionRecord, xpEntry: XpEntry): void {
  appendSessionRecord(record)
  appendXpEntry(xpEntry)
  if (cache.userId !== null) {
    const userId = cache.userId
    void pushOp(userId, { type: 'session', record }).then((ok) => {
      if (!ok) enqueue({ type: 'session', record })
    })
    void pushOp(userId, { type: 'xp', entry: xpEntry }).then((ok) => {
      if (!ok) enqueue({ type: 'xp', entry: xpEntry })
    })
  }
}
