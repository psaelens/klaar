import { describe, it, expect } from 'vitest'
import {
  initialSrsState,
  review,
  isDue,
  selectSessionItems,
  INITIAL_EASE_FACTOR,
  MIN_EASE_FACTOR,
} from './srs'
import type { ContentItem, SrsState } from '../types'

const NOW = new Date('2026-07-04T10:00:00.000Z')
const DAY_MS = 24 * 60 * 60 * 1000

function daysFromNow(iso: string): number {
  return (new Date(iso).getTime() - NOW.getTime()) / DAY_MS
}

describe('initialSrsState', () => {
  it('crée un état dû immédiatement avec les valeurs SM-2 de départ', () => {
    const state = initialSrsState('item-1', NOW)
    expect(state.easeFactor).toBe(INITIAL_EASE_FACTOR)
    expect(state.repetitions).toBe(0)
    expect(state.intervalDays).toBe(0)
    expect(state.lapses).toBe(0)
    expect(isDue(state, NOW)).toBe(true)
  })
})

describe('review — réponses correctes', () => {
  it('suit la progression SM-2 : 1 jour, puis 6 jours, puis intervalle × facilité', () => {
    let state = initialSrsState('item-1', NOW)

    state = review(state, 'good', NOW)
    expect(state.repetitions).toBe(1)
    expect(state.intervalDays).toBe(1)
    expect(daysFromNow(state.nextReviewAt)).toBeCloseTo(1)

    state = review(state, 'good', NOW)
    expect(state.repetitions).toBe(2)
    expect(state.intervalDays).toBe(6)

    const easeBefore = state.easeFactor
    state = review(state, 'good', NOW)
    expect(state.repetitions).toBe(3)
    expect(state.intervalDays).toBe(Math.round(6 * state.easeFactor))
    expect(state.easeFactor).toBeGreaterThan(easeBefore)
  })

  it('augmente le facteur de facilité sur "good" et le diminue sur "hard"', () => {
    const base = initialSrsState('item-1', NOW)
    expect(review(base, 'good', NOW).easeFactor).toBeGreaterThan(base.easeFactor)
    expect(review(base, 'hard', NOW).easeFactor).toBeLessThan(base.easeFactor)
  })

  it('"hard" fait quand même progresser les répétitions (réponse correcte mais laborieuse)', () => {
    const state = review(initialSrsState('item-1', NOW), 'hard', NOW)
    expect(state.repetitions).toBe(1)
    expect(state.intervalDays).toBe(1)
    expect(state.lapses).toBe(0)
  })
})

describe('review — réponse ratée', () => {
  it('réinitialise répétitions et intervalle, incrémente les échecs, item dû immédiatement', () => {
    let state = initialSrsState('item-1', NOW)
    state = review(state, 'good', NOW)
    state = review(state, 'good', NOW)
    expect(state.intervalDays).toBe(6)

    state = review(state, 'again', NOW)
    expect(state.repetitions).toBe(0)
    expect(state.intervalDays).toBe(0)
    expect(state.lapses).toBe(1)
    expect(isDue(state, NOW)).toBe(true)
  })

  it('ne descend jamais le facteur de facilité sous le minimum', () => {
    let state = initialSrsState('item-1', NOW)
    for (let i = 0; i < 20; i++) {
      state = review(state, 'again', NOW)
    }
    expect(state.easeFactor).toBe(MIN_EASE_FACTOR)
  })
})

describe('isDue', () => {
  it('est vrai à échéance exacte et passée, faux avant', () => {
    const state = initialSrsState('item-1', NOW)
    const future = { ...state, nextReviewAt: new Date(NOW.getTime() + 1000).toISOString() }
    expect(isDue(state, NOW)).toBe(true)
    expect(isDue(future, NOW)).toBe(false)
    expect(isDue(future, new Date(NOW.getTime() + 1000))).toBe(true)
  })
})

describe('selectSessionItems', () => {
  const items: ContentItem[] = ['a', 'b', 'c', 'd', 'e'].map((id) => ({
    id,
    type: 'vocab',
    theme: 'test',
    front: `nl-${id}`,
    back: `fr-${id}`,
    difficulty: 1,
    curriculum_unit: null,
  }))

  function stateAt(itemId: string, nextReviewAt: Date): SrsState {
    return { ...initialSrsState(itemId, NOW), nextReviewAt: nextReviewAt.toISOString() }
  }

  it('sépare les révisions dues des nouveaux items, révisions les plus en retard d’abord', () => {
    const states = {
      a: stateAt('a', new Date(NOW.getTime() - DAY_MS)), // dû depuis hier
      b: stateAt('b', new Date(NOW.getTime() - 3 * DAY_MS)), // dû depuis 3 jours
      c: stateAt('c', new Date(NOW.getTime() + DAY_MS)), // pas encore dû
    }
    const { reviews, fresh } = selectSessionItems(items, states, NOW)
    expect(reviews.map((i) => i.id)).toEqual(['b', 'a'])
    expect(fresh.map((i) => i.id)).toEqual(['d', 'e'])
  })

  it('respecte les plafonds de révisions et de nouveaux items', () => {
    const states = {
      a: stateAt('a', NOW),
      b: stateAt('b', NOW),
      c: stateAt('c', NOW),
    }
    const { reviews, fresh } = selectSessionItems(items, states, NOW, {
      maxReviews: 2,
      maxNew: 1,
    })
    expect(reviews).toHaveLength(2)
    expect(fresh).toHaveLength(1)
  })

  it('sans aucun état, tout est nouveau (dans la limite du plafond)', () => {
    const { reviews, fresh } = selectSessionItems(items, {}, NOW, { maxNew: 3 })
    expect(reviews).toHaveLength(0)
    expect(fresh.map((i) => i.id)).toEqual(['a', 'b', 'c'])
  })
})
