import { describe, expect, it } from 'vitest'
import type { SessionRecord } from '../types'
import { BADGES, badgeDef, deservedBadges, newBadges } from './badges'

const record = (overrides: Partial<SessionRecord>): SessionRecord => ({
  finishedAt: new Date(2026, 6, 5, 10, 0).toISOString(),
  cardsReviewed: 8,
  correctFirstTry: 6,
  lapsed: 2,
  durationSeconds: 300,
  xpEarned: 80,
  ...overrides,
})

const base = { records: [record({})], xpTotal: 0, streakDays: 0 }

describe('deservedBadges', () => {
  it('première session', () => {
    expect(deservedBadges({ records: [], xpTotal: 0, streakDays: 0 })).toEqual([])
    expect(deservedBadges(base)).toContain('first-session')
  })

  it('sans faute : ≥ 5 cartes et 0 erreur', () => {
    expect(
      deservedBadges({ ...base, records: [record({ cardsReviewed: 4, lapsed: 0 })] }),
    ).not.toContain('perfect-session')
    expect(
      deservedBadges({ ...base, records: [record({ cardsReviewed: 5, lapsed: 0 })] }),
    ).toContain('perfect-session')
  })

  it('menu complet : les 3 modalités le même jour local', () => {
    const sameDay = [
      record({ module: 'vocab', finishedAt: new Date(2026, 6, 5, 9, 0).toISOString() }),
      record({ module: 'grammar', finishedAt: new Date(2026, 6, 5, 14, 0).toISOString() }),
      record({ module: 'listening', finishedAt: new Date(2026, 6, 5, 20, 0).toISOString() }),
    ]
    expect(deservedBadges({ ...base, records: sameDay })).toContain('all-modules-day')

    const spread = [
      record({ module: 'vocab', finishedAt: new Date(2026, 6, 4, 9, 0).toISOString() }),
      record({ module: 'grammar', finishedAt: new Date(2026, 6, 5, 14, 0).toISOString() }),
      record({ module: 'listening', finishedAt: new Date(2026, 6, 6, 20, 0).toISOString() }),
    ]
    expect(deservedBadges({ ...base, records: spread })).not.toContain('all-modules-day')
  })

  it('les sessions sans module comptent comme vocab pour le menu complet', () => {
    const records = [
      record({ finishedAt: new Date(2026, 6, 5, 9, 0).toISOString() }),
      record({ module: 'grammar', finishedAt: new Date(2026, 6, 5, 14, 0).toISOString() }),
      record({ module: 'listening', finishedAt: new Date(2026, 6, 5, 20, 0).toISOString() }),
    ]
    expect(deservedBadges({ ...base, records })).toContain('all-modules-day')
  })

  it('première rédaction : dès une session d’écriture terminée', () => {
    expect(deservedBadges(base)).not.toContain('first-writing')
    expect(
      deservedBadges({ ...base, records: [record({ module: 'writing' })] }),
    ).toContain('first-writing')
  })

  it('première prise de parole : dès une session d’oral terminée', () => {
    expect(deservedBadges(base)).not.toContain('first-speaking')
    expect(
      deservedBadges({ ...base, records: [record({ module: 'speaking' })] }),
    ).toContain('first-speaking')
  })

  it('marathonien à 25 sessions', () => {
    const records = Array.from({ length: 25 }, () => record({}))
    expect(deservedBadges({ ...base, records })).toContain('sessions-25')
    expect(deservedBadges({ ...base, records: records.slice(1) })).not.toContain('sessions-25')
  })

  it('paliers de streak et d’XP', () => {
    expect(deservedBadges({ ...base, streakDays: 3 })).toContain('streak-3')
    expect(deservedBadges({ ...base, streakDays: 2 })).not.toContain('streak-3')
    expect(deservedBadges({ ...base, streakDays: 14 })).toEqual(
      expect.arrayContaining(['streak-3', 'streak-7', 'streak-14']),
    )
    expect(deservedBadges({ ...base, xpTotal: 500 })).toContain('xp-500')
    expect(deservedBadges({ ...base, xpTotal: 499 })).not.toContain('xp-500')
    expect(deservedBadges({ ...base, xpTotal: 1200 })).toEqual(
      expect.arrayContaining(['xp-500', 'xp-1000']),
    )
  })
})

describe('newBadges', () => {
  it('exclut les badges déjà gagnés', () => {
    expect(newBadges(base, [])).toContain('first-session')
    expect(newBadges(base, ['first-session'])).not.toContain('first-session')
  })
})

describe('définitions', () => {
  it('chaque code est unique et retrouvable', () => {
    const codes = BADGES.map((badge) => badge.code)
    expect(new Set(codes).size).toBe(codes.length)
    expect(badgeDef('first-session')?.emoji).toBe('🐣')
    expect(badgeDef('inconnu')).toBeUndefined()
  })
})
