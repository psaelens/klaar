import { describe, expect, it } from 'vitest'
import type { SessionRecord } from '../types'
import { dailyActivity, minutesInLastDays, successRate, successRateByModule } from './dashboard'

const record = (overrides: Partial<SessionRecord>): SessionRecord => ({
  finishedAt: '2026-07-05T10:00:00.000Z',
  cardsReviewed: 10,
  correctFirstTry: 8,
  lapsed: 2,
  durationSeconds: 600,
  xpEarned: 100,
  ...overrides,
})

// Midi heure locale : pas d'ambiguïté de fuseau dans les tests.
const now = new Date(2026, 6, 5, 12, 0, 0)

describe('dailyActivity', () => {
  it('retourne un jour par case, du plus ancien à aujourd’hui', () => {
    const days = dailyActivity([], now, 28)
    expect(days).toHaveLength(28)
    expect(days[27]?.day).toBe('2026-07-05')
    expect(days[0]?.day).toBe('2026-06-08')
    expect(days.every((d) => d.minutes === 0 && d.sessions === 0)).toBe(true)
  })

  it('agrège minutes et sessions par jour local', () => {
    const records = [
      record({ finishedAt: new Date(2026, 6, 5, 9, 0).toISOString(), durationSeconds: 300 }),
      record({ finishedAt: new Date(2026, 6, 5, 18, 0).toISOString(), durationSeconds: 600 }),
      record({ finishedAt: new Date(2026, 6, 1, 9, 0).toISOString(), durationSeconds: 120 }),
    ]
    const days = dailyActivity(records, now, 7)
    const today = days[6]
    expect(today?.minutes).toBe(15)
    expect(today?.sessions).toBe(2)
    expect(days.find((d) => d.day === '2026-07-01')?.minutes).toBe(2)
  })

  it('ignore les sessions hors fenêtre', () => {
    const records = [record({ finishedAt: new Date(2026, 5, 1, 9, 0).toISOString() })]
    const days = dailyActivity(records, now, 7)
    expect(days.every((d) => d.sessions === 0)).toBe(true)
  })
})

describe('successRate', () => {
  it('null sans données, sinon premières réussites / cartes vues', () => {
    expect(successRate([])).toBeNull()
    const records = [
      record({ cardsReviewed: 10, correctFirstTry: 8 }),
      record({ cardsReviewed: 10, correctFirstTry: 6 }),
    ]
    expect(successRate(records)).toBeCloseTo(0.7)
  })
})

describe('successRateByModule', () => {
  it('sépare par modalité, les sessions sans module comptent comme vocab', () => {
    const records = [
      record({ cardsReviewed: 10, correctFirstTry: 5 }), // pas de module → vocab
      record({ module: 'vocab', cardsReviewed: 10, correctFirstTry: 10 }),
      record({ module: 'grammar', cardsReviewed: 8, correctFirstTry: 2 }),
    ]
    const rates = successRateByModule(records)
    expect(rates.vocab).toBeCloseTo(0.75)
    expect(rates.grammar).toBeCloseTo(0.25)
  })

  it('null pour une modalité jamais travaillée', () => {
    expect(successRateByModule([]).grammar).toBeNull()
    expect(successRateByModule([]).writing).toBeNull()
  })

  it('couvre les modalités de production', () => {
    const records = [
      record({ module: 'writing', cardsReviewed: 2, correctFirstTry: 1 }),
      record({ module: 'speaking', cardsReviewed: 4, correctFirstTry: 1 }),
    ]
    expect(successRateByModule(records).writing).toBeCloseTo(0.5)
    expect(successRateByModule(records).speaking).toBeCloseTo(0.25)
  })
})

describe('minutesInLastDays', () => {
  it('somme les minutes des 7 derniers jours', () => {
    const records = [
      record({ finishedAt: new Date(2026, 6, 5, 9, 0).toISOString(), durationSeconds: 600 }),
      record({ finishedAt: new Date(2026, 6, 3, 9, 0).toISOString(), durationSeconds: 300 }),
      record({ finishedAt: new Date(2026, 5, 20, 9, 0).toISOString(), durationSeconds: 900 }),
    ]
    expect(minutesInLastDays(records, now, 7)).toBe(15)
  })
})
