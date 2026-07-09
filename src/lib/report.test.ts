import { describe, expect, it } from 'vitest'
import type { SessionRecord } from '../types'
import { weeklyReport } from './report'

// Jeudi 9 juillet 2026, 14 h locale.
const NOW = new Date(2026, 6, 9, 14, 0)

function session(daysAgo: number, overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    finishedAt: new Date(2026, 6, 9 - daysAgo, 10, 0).toISOString(),
    cardsReviewed: 10,
    correctFirstTry: 8,
    lapsed: 2,
    durationSeconds: 1800,
    xpEarned: 100,
    ...overrides,
  }
}

describe('weeklyReport', () => {
  it('semaine vide : tout à zéro, taux null', () => {
    const report = weeklyReport([], NOW)
    expect(report.daysWorked).toBe(0)
    expect(report.daysValidated).toBe(0)
    expect(report.minutes).toBe(0)
    expect(report.rate).toBeNull()
    expect(report.rateDeltaPct).toBeNull()
    expect(report.weakest).toBeNull()
  })

  it('compte les jours travaillés et validés (≥ 60 min) des 7 derniers jours', () => {
    const records = [
      session(0, { durationSeconds: 3600 }), // aujourd'hui : 60 min → validé
      session(2, { durationSeconds: 1200 }), // 20 min → travaillé, pas validé
      session(2, { durationSeconds: 1500 }), // +25 min le même jour → 45 min
      session(9), // hors fenêtre
    ]
    const report = weeklyReport(records, NOW)
    expect(report.daysWorked).toBe(2)
    expect(report.daysValidated).toBe(1)
    expect(report.minutes).toBe(105)
  })

  it('compare la semaine aux 7 jours précédents (minutes et taux)', () => {
    const records = [
      session(1, { durationSeconds: 3600, cardsReviewed: 10, correctFirstTry: 9 }), // semaine : 90 %
      session(8, { durationSeconds: 1800, cardsReviewed: 10, correctFirstTry: 6 }), // précédente : 60 %
    ]
    const report = weeklyReport(records, NOW)
    expect(report.minutes).toBe(60)
    expect(report.minutesDelta).toBe(30)
    expect(report.rate).toBeCloseTo(0.9)
    expect(report.rateDeltaPct).toBe(30)
  })

  it('détecte la modalité la plus faible (≥ 5 cartes vues)', () => {
    const records = [
      session(1, { module: 'vocab', cardsReviewed: 10, correctFirstTry: 9 }),
      session(2, { module: 'grammar', cardsReviewed: 8, correctFirstTry: 2 }),
      session(3, { module: 'listening', cardsReviewed: 4, correctFirstTry: 0 }), // < 5 cartes : ignoré
    ]
    const report = weeklyReport(records, NOW)
    expect(report.weakest?.module).toBe('grammar')
    expect(report.weakest?.rate).toBeCloseTo(0.25)
  })

  it('les examens blancs (module exam) ne polluent pas le point faible', () => {
    const records = [
      session(1, { module: 'exam', cardsReviewed: 6, correctFirstTry: 0 }),
      session(2, { module: 'vocab', cardsReviewed: 10, correctFirstTry: 9 }),
    ]
    expect(weeklyReport(records, NOW).weakest?.module).toBe('vocab')
  })
})
