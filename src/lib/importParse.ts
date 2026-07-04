/**
 * Parsing du texte collé dans l'écran d'import (PRD §10) : une ligne par mot,
 * `néerlandais ; français` (séparateur « ; » ou tabulation). Fonction pure, testée.
 */

export interface ParsedVocabItem {
  front: string
  back: string
}

export interface ParseResult {
  items: ParsedVocabItem[]
  /** Messages d'erreur lisibles, avec le numéro de ligne d'origine. */
  errors: string[]
}

export function parseVocabLines(text: string): ParseResult {
  const items: ParsedVocabItem[] = []
  const errors: string[] = []
  const seen = new Set<string>()

  const lines = text.split(/\r?\n/)
  lines.forEach((rawLine, index) => {
    const line = rawLine.trim()
    if (line === '') return

    const separatorIndex = line.includes(';') ? line.indexOf(';') : line.indexOf('\t')
    if (separatorIndex === -1) {
      errors.push(`Ligne ${index + 1} : séparateur « ; » manquant (« ${line.slice(0, 40)} »)`)
      return
    }

    const front = line.slice(0, separatorIndex).trim()
    const back = line.slice(separatorIndex + 1).trim()
    if (front === '' || back === '') {
      errors.push(`Ligne ${index + 1} : mot ou traduction vide (« ${line.slice(0, 40)} »)`)
      return
    }

    const key = front.toLowerCase()
    if (seen.has(key)) {
      errors.push(`Ligne ${index + 1} : « ${front} » apparaît deux fois, seule la première est gardée`)
      return
    }
    seen.add(key)
    items.push({ front, back })
  })

  return { items, errors }
}
