import { describe, it, expect } from 'vitest'
import { computeStreak } from './streak'
import type { SessionRecord } from '../types'

// 14h00 heure locale pour éviter tout effet de bord autour de minuit
const NOW = new Date(2026, 6, 4, 14, 0, 0) // 4 juillet 2026

function sessionOn(daysAgo: number, minutes = 10): SessionRecord {
  const date = new Date(2026, 6, 4 - daysAgo, 10, 0, 0)
  return {
    finishedAt: date.toISOString(),
    cardsReviewed: 8,
    correctFirstTry: 6,
    lapsed: 2,
    durationSeconds: minutes * 60,
  }
}

describe('computeStreak', () => {
  it('sans aucune session : streak 0, jour non validé', () => {
    expect(computeStreak([], NOW)).toEqual({ current: 0, todayDone: false })
  })

  it("compte les jours consécutifs jusqu'à aujourd'hui inclus", () => {
    const records = [sessionOn(2), sessionOn(1), sessionOn(0)]
    expect(computeStreak(records, NOW)).toEqual({ current: 3, todayDone: true })
  })

  it("aujourd'hui pas encore travaillé ne casse pas le streak d'hier", () => {
    const records = [sessionOn(2), sessionOn(1)]
    expect(computeStreak(records, NOW)).toEqual({ current: 2, todayDone: false })
  })

  it('un jour manqué casse le streak (pas de rattrapage)', () => {
    const records = [sessionOn(3), sessionOn(2), sessionOn(0)] // hier manqué
    expect(computeStreak(records, NOW)).toEqual({ current: 1, todayDone: true })
  })

  it('plusieurs sessions le même jour ne comptent que pour un jour', () => {
    const records = [sessionOn(0), sessionOn(0), sessionOn(0)]
    expect(computeStreak(records, NOW)).toEqual({ current: 1, todayDone: true })
  })

  it('avec un seuil de minutes, les jours trop courts ne valident pas', () => {
    const records = [sessionOn(1, 65), sessionOn(0, 20)]
    expect(computeStreak(records, NOW, { minMinutesPerDay: 60 })).toEqual({
      current: 1,
      todayDone: false,
    })
  })

  it('les minutes de plusieurs sessions du même jour se cumulent pour le seuil', () => {
    const records = [sessionOn(0, 30), sessionOn(0, 35)]
    expect(computeStreak(records, NOW, { minMinutesPerDay: 60 })).toEqual({
      current: 1,
      todayDone: true,
    })
  })

  it('les sessions sans durée (pré-M1) comptent quand le seuil est 0', () => {
    const record: SessionRecord = {
      finishedAt: new Date(2026, 6, 4, 9, 0, 0).toISOString(),
      cardsReviewed: 8,
      correctFirstTry: 8,
      lapsed: 0,
    }
    expect(computeStreak([record], NOW)).toEqual({ current: 1, todayDone: true })
  })
})
