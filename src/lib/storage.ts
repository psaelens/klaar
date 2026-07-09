import type { EarnedBadge, MockExamResult, SrsState, SessionRecord, XpEntry } from '../types'

/**
 * Persistance localStorage (M0). Les clés sont versionnées pour permettre
 * une migration propre vers Supabase en M1 (PRD §6).
 */

const SRS_KEY = 'klaar.srs.v1'
const SESSIONS_KEY = 'klaar.sessions.v1'
const THEME_KEY = 'klaar.theme.v1'
const XP_KEY = 'klaar.xp.v1'
const BADGES_KEY = 'klaar.badges.v1'
const EXAMS_KEY = 'klaar.exams.v1'
const DEMO_KEY = 'klaar.demo.v1'
const PROFILE_KEY = 'klaar.profile.v1'

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function loadSrsStates(): Record<string, SrsState> {
  return readJson<Record<string, SrsState>>(SRS_KEY, {})
}

export function replaceSrsStates(states: Record<string, SrsState>): void {
  localStorage.setItem(SRS_KEY, JSON.stringify(states))
}

export function saveSrsState(state: SrsState): void {
  const states = loadSrsStates()
  states[state.itemId] = state
  localStorage.setItem(SRS_KEY, JSON.stringify(states))
}

export function loadSessionRecords(): SessionRecord[] {
  return readJson<SessionRecord[]>(SESSIONS_KEY, [])
}

export function appendSessionRecord(record: SessionRecord): void {
  const records = loadSessionRecords()
  records.push(record)
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(records))
}

export function replaceSessionRecords(records: SessionRecord[]): void {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(records))
}

export function loadXpLedger(): XpEntry[] {
  return readJson<XpEntry[]>(XP_KEY, [])
}

export function appendXpEntry(entry: XpEntry): void {
  const entries = loadXpLedger()
  entries.push(entry)
  localStorage.setItem(XP_KEY, JSON.stringify(entries))
}

export function totalXp(): number {
  return loadXpLedger().reduce((sum, entry) => sum + entry.amount, 0)
}

export function replaceXpLedger(entries: XpEntry[]): void {
  localStorage.setItem(XP_KEY, JSON.stringify(entries))
}

export function loadEarnedBadges(): EarnedBadge[] {
  return readJson<EarnedBadge[]>(BADGES_KEY, [])
}

export function appendEarnedBadges(badges: EarnedBadge[]): void {
  if (badges.length === 0) return
  localStorage.setItem(BADGES_KEY, JSON.stringify([...loadEarnedBadges(), ...badges]))
}

export function replaceEarnedBadges(badges: EarnedBadge[]): void {
  localStorage.setItem(BADGES_KEY, JSON.stringify(badges))
}

export function loadMockExams(): MockExamResult[] {
  return readJson<MockExamResult[]>(EXAMS_KEY, [])
}

export function appendMockExam(result: MockExamResult): void {
  localStorage.setItem(EXAMS_KEY, JSON.stringify([...loadMockExams(), result]))
}

export function replaceMockExams(results: MockExamResult[]): void {
  localStorage.setItem(EXAMS_KEY, JSON.stringify(results))
}

/** L'utilisateur a explicitement choisi le mode démo (visiteur, données locales). */
export function loadDemoMode(): boolean {
  return readJson<boolean>(DEMO_KEY, false)
}

export function saveDemoMode(enabled: boolean): void {
  localStorage.setItem(DEMO_KEY, JSON.stringify(enabled))
}

/** Profil connecté (affichage accueil), gardé en cache pour les démarrages hors ligne. */
export interface StoredProfile {
  displayName: string
  role: 'parent' | 'child'
}

export function loadProfile(): StoredProfile | null {
  return readJson<StoredProfile | null>(PROFILE_KEY, null)
}

export function saveProfile(profile: StoredProfile | null): void {
  if (profile === null) localStorage.removeItem(PROFILE_KEY)
  else localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export type Theme = 'light' | 'dark'

export function loadTheme(): Theme {
  const stored = readJson<Theme | null>(THEME_KEY, null)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function saveTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, JSON.stringify(theme))
}
