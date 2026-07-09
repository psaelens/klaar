import { describe, expect, it } from 'vitest'
import { countWords, suggestedGrade } from './writing'

describe('countWords', () => {
  it('texte vide ou blanc = 0 mot', () => {
    expect(countWords('')).toBe(0)
    expect(countWords('   \n\t ')).toBe(0)
  })

  it('compte les mots séparés par des blancs', () => {
    expect(countWords('Hallo, ik ben Lucas.')).toBe(4)
    expect(countWords('Ik  woon\nin   Namen')).toBe(4)
  })

  it('ignore la ponctuation isolée mais garde les mots accentués et les nombres', () => {
    expect(countWords('- Hé ! Één ijsje : 2 euro —')).toBe(5)
  })
})

describe('suggestedGrade', () => {
  it('tous les points cochés = réussi', () => {
    expect(suggestedGrade(4, 4)).toBe('good')
    expect(suggestedGrade(0, 0)).toBe('good')
  })

  it('au moins la moitié = difficile', () => {
    expect(suggestedGrade(2, 4)).toBe('hard')
    expect(suggestedGrade(3, 5)).toBe('hard')
    expect(suggestedGrade(4, 5)).toBe('hard')
  })

  it('moins de la moitié = à revoir', () => {
    expect(suggestedGrade(1, 4)).toBe('again')
    expect(suggestedGrade(2, 5)).toBe('again')
    expect(suggestedGrade(0, 3)).toBe('again')
  })
})
