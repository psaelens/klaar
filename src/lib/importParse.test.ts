import { describe, it, expect } from 'vitest'
import { parseVocabLines } from './importParse'

describe('parseVocabLines', () => {
  it('parse des lignes « nl ; fr » en ignorant les lignes vides et les espaces', () => {
    const { items, errors } = parseVocabLines('de hond ; le chien\n\n  de kat ;le chat  \n')
    expect(errors).toEqual([])
    expect(items).toEqual([
      { front: 'de hond', back: 'le chien' },
      { front: 'de kat', back: 'le chat' },
    ])
  })

  it('accepte la tabulation comme séparateur', () => {
    const { items, errors } = parseVocabLines('de vis\tle poisson')
    expect(errors).toEqual([])
    expect(items).toEqual([{ front: 'de vis', back: 'le poisson' }])
  })

  it('signale les lignes sans séparateur avec leur numéro', () => {
    const { items, errors } = parseVocabLines('de hond ; le chien\npas de séparateur ici')
    expect(items).toHaveLength(1)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('Ligne 2')
  })

  it('signale les moitiés vides', () => {
    const { items, errors } = parseVocabLines('; le chien\nde kat ;')
    expect(items).toHaveLength(0)
    expect(errors).toHaveLength(2)
  })

  it('ne garde que la première occurrence d’un doublon (insensible à la casse)', () => {
    const { items, errors } = parseVocabLines('de hond ; le chien\nDe Hond ; doublon')
    expect(items).toEqual([{ front: 'de hond', back: 'le chien' }])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('deux fois')
  })

  it('texte vide : rien à importer, aucune erreur', () => {
    expect(parseVocabLines('')).toEqual({ items: [], errors: [] })
  })
})
