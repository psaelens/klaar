import { describe, expect, it } from 'vitest'
import type { ContentItem, SrsState } from '../types'
import { itemsForModule, selectForModule, shuffle } from './modules'
import { WRITING_PROMPTS_PER_SESSION } from './writing'

const item = (id: string, type: ContentItem['type']): ContentItem => ({
  id,
  type,
  theme: 't',
  front: 'f',
  back: 'b',
  difficulty: 1,
  curriculum_unit: null,
})

describe('itemsForModule', () => {
  it('ne garde que les items de la modalité demandée', () => {
    const items = [item('v1', 'vocab'), item('g1', 'grammar'), item('v2', 'vocab')]
    expect(itemsForModule(items, 'vocab').map((i) => i.id)).toEqual(['v1', 'v2'])
    expect(itemsForModule(items, 'grammar').map((i) => i.id)).toEqual(['g1'])
  })
})

describe('selectForModule', () => {
  const now = new Date(2026, 6, 9, 12, 0)
  const dueState = (itemId: string): SrsState => ({
    itemId,
    easeFactor: 2.5,
    intervalDays: 1,
    repetitions: 1,
    lapses: 0,
    nextReviewAt: new Date(2026, 6, 8, 12, 0).toISOString(),
  })

  it('rédaction : 2 textes maximum par session (format examen, PRD §16)', () => {
    const items = ['w1', 'w2', 'w3', 'w4'].map((id) => item(id, 'writing'))
    const { reviews, fresh } = selectForModule(items, {}, now, 'writing')
    expect(reviews).toHaveLength(0)
    expect(fresh).toHaveLength(WRITING_PROMPTS_PER_SESSION)
  })

  it('rédaction : les révisions dues passent avant les nouveaux textes', () => {
    const items = ['w1', 'w2', 'w3'].map((id) => item(id, 'writing'))
    const { reviews, fresh } = selectForModule(items, { w1: dueState('w1') }, now, 'writing')
    expect(reviews.map((i) => i.id)).toEqual(['w1'])
    expect(fresh).toHaveLength(1)
  })

  it('oral : 2 sujets maximum par session, comme la rédaction', () => {
    const items = ['s1', 's2', 's3', 's4'].map((id) => item(id, 'speaking'))
    const { reviews, fresh } = selectForModule(items, {}, now, 'speaking')
    expect(reviews).toHaveLength(0)
    expect(fresh).toHaveLength(2)
  })

  it('les autres modalités gardent les plafonds par défaut', () => {
    const items = Array.from({ length: 12 }, (_, i) => item(`v${i}`, 'vocab'))
    const { fresh } = selectForModule(items, {}, now, 'vocab')
    expect(fresh).toHaveLength(8)
  })
})

describe('shuffle', () => {
  it('retourne une permutation sans muter le tableau source', () => {
    const source = ['a', 'b', 'c', 'd']
    const result = shuffle(source)
    expect(result).toHaveLength(4)
    expect([...result].sort()).toEqual(['a', 'b', 'c', 'd'])
    expect(source).toEqual(['a', 'b', 'c', 'd'])
  })

  it('est déterministe à rng fixé', () => {
    let calls = 0
    const rng = () => {
      calls += 1
      return (calls % 10) / 10
    }
    expect(shuffle(['a', 'b', 'c'], rng)).toEqual(
      shuffle(
        ['a', 'b', 'c'],
        (() => {
          let c = 0
          return () => {
            c += 1
            return (c % 10) / 10
          }
        })(),
      ),
    )
  })
})
