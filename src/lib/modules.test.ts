import { describe, expect, it } from 'vitest'
import type { ContentItem } from '../types'
import { itemsForModule, shuffle } from './modules'

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
    expect(shuffle(['a', 'b', 'c'], rng)).toEqual(shuffle(['a', 'b', 'c'], (() => {
      let c = 0
      return () => {
        c += 1
        return (c % 10) / 10
      }
    })()))
  })
})
