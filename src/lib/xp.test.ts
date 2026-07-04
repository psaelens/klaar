import { describe, it, expect } from 'vitest'
import { xpForAnswer, sessionXp, XP_BASE_VOCAB, XP_SESSION_COMPLETION_BONUS, XP_SESSION_CAP } from './xp'
import type { AnsweredCard } from './xp'

describe('xpForAnswer', () => {
  it('donne le plein XP pondéré par difficulté sur "good"', () => {
    expect(xpForAnswer({ difficulty: 1, grade: 'good' })).toBe(XP_BASE_VOCAB)
    expect(xpForAnswer({ difficulty: 3, grade: 'good' })).toBe(XP_BASE_VOCAB * 3)
  })

  it('donne la moitié sur "hard"', () => {
    expect(xpForAnswer({ difficulty: 2, grade: 'hard' })).toBe(XP_BASE_VOCAB)
  })

  it('ne donne rien sur "again" mais jamais de négatif (non punitif)', () => {
    expect(xpForAnswer({ difficulty: 3, grade: 'again' })).toBe(0)
  })
})

describe('sessionXp', () => {
  it('somme les réponses et ajoute le bonus de complétion', () => {
    const answers: AnsweredCard[] = [
      { difficulty: 1, grade: 'good' }, // 10
      { difficulty: 2, grade: 'hard' }, // 10
      { difficulty: 1, grade: 'again' }, // 0
    ]
    expect(sessionXp(answers, true)).toBe(20 + XP_SESSION_COMPLETION_BONUS)
    expect(sessionXp(answers, false)).toBe(20)
  })

  it('plafonne au cap anti-farming', () => {
    const answers: AnsweredCard[] = Array.from({ length: 100 }, () => ({
      difficulty: 3 as const,
      grade: 'good' as const,
    }))
    expect(sessionXp(answers, true)).toBe(XP_SESSION_CAP)
  })

  it('session vide non terminée = 0 XP', () => {
    expect(sessionXp([], false)).toBe(0)
  })
})
