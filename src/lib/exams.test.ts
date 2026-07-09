import { describe, expect, it } from 'vitest'
import type { ExamTask } from './exams'
import {
  comprehensionScore,
  examById,
  examMaxScore,
  exams,
  examXp,
  productionScore,
  XP_EXAM_COMPLETION,
  XP_EXAM_PASS_BONUS,
} from './exams'

describe('contenu des épreuves blanches', () => {
  it('l’écrit vaut 70 (CA 30 + CL 20 + EE 20), l’oral 30 — barème officiel', () => {
    const ecrit = examById('blanc-ecrit-01')
    const oral = examById('blanc-oral-01')
    expect(ecrit).toBeDefined()
    expect(oral).toBeDefined()
    expect(examMaxScore(ecrit!)).toBe(70)
    expect(examMaxScore(oral!)).toBe(30)
  })

  it('chaque grille d’auto-évaluation totalise les points de la tâche', () => {
    for (const exam of exams) {
      for (const section of exam.sections) {
        for (const task of section.tasks) {
          if (task.checklist !== undefined) {
            const sum = task.checklist.reduce((s, point) => s + point.points, 0)
            expect(sum, `${task.id}`).toBe(task.points)
          }
        }
      }
    }
  })

  it('chaque corrigé CA/CL couvre au moins le nombre de réponses demandées', () => {
    for (const exam of exams) {
      for (const section of exam.sections) {
        if (section.kind !== 'ca' && section.kind !== 'cl') continue
        for (const task of section.tasks) {
          expect(task.expected!.length, task.id).toBeGreaterThanOrEqual(task.answersToCount!)
        }
      }
    }
  })
})

describe('comprehensionScore', () => {
  const task = { answersToCount: 8, points: 15 } as ExamTask

  it('prorata arrondi au demi-point', () => {
    expect(comprehensionScore(8, task)).toBe(15)
    expect(comprehensionScore(4, task)).toBe(7.5)
    expect(comprehensionScore(0, task)).toBe(0)
    expect(comprehensionScore(5, task)).toBe(9.5) // 9.375 → 9.5
  })

  it('plafonné au nombre de réponses demandées (règle officielle)', () => {
    expect(comprehensionScore(11, task)).toBe(15)
  })
})

describe('productionScore', () => {
  const task = {
    minWords: 60,
    points: 10,
    checklist: [
      { label: 'a', points: 3 },
      { label: 'b', points: 2 },
      { label: 'c', points: 2 },
      { label: 'd', points: 2 },
      { label: 'e', points: 1 },
    ],
  } as ExamTask

  it('somme des points cochés', () => {
    expect(productionScore([0, 1, 2, 3, 4], task, 70)).toBe(10)
    expect(productionScore([0, 4], task, 70)).toBe(4)
    expect(productionScore([], task, 70)).toBe(0)
  })

  it('texte sous 55 mots : plafonné à 40 % (grille officielle n°2)', () => {
    expect(productionScore([0, 1, 2, 3, 4], task, 54)).toBe(4)
    expect(productionScore([4], task, 40)).toBe(1)
    expect(productionScore([0, 1, 2, 3, 4], task, 55)).toBe(10)
  })

  it('sans minimum de mots (oral), pas de plafond', () => {
    const oral = { points: 15, checklist: [{ label: 'a', points: 15 }] } as ExamTask
    expect(productionScore([0], oral)).toBe(15)
  })
})

describe('examXp', () => {
  it('complétion + bonus boss battle à partir de 50 %', () => {
    expect(examXp(35, 70)).toBe(XP_EXAM_COMPLETION + XP_EXAM_PASS_BONUS)
    expect(examXp(34.5, 70)).toBe(XP_EXAM_COMPLETION)
    expect(examXp(0, 70)).toBe(XP_EXAM_COMPLETION)
    expect(examXp(30, 30)).toBe(XP_EXAM_COMPLETION + XP_EXAM_PASS_BONUS)
  })
})
