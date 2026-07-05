import type { ContentItem, SessionRecord, SrsState, XpEntry } from '../types'
import { seedItems } from '../data'
import { supabase } from './supabase'
import {
  appendSessionRecord,
  appendXpEntry,
  loadSessionRecords,
  loadSrsStates,
  loadXpLedger,
  replaceSessionRecords,
  replaceSrsStates,
  replaceXpLedger,
  saveSrsState,
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
} = {
  items: seedItems,
  states: {},
  userId: null,
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
}

/** À appeler une fois au démarrage de l'app, avant le premier rendu des pages. */
export async function initRepo(): Promise<void> {
  cache.states = loadSrsStates()
  cache.items = seedItems
  cache.userId = null
  if (supabase === null) return

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session === null) return

  cache.userId = session.user.id
  try {
    await migrateLocalData(session.user.id)
    await flushQueue(session.user.id)
    await pullFromCloud(session.user.id)
  } catch {
    // Hors ligne ou serveur indisponible : l'app continue sur le cache local.
  }
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
