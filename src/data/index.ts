import type { ContentItem } from '../types'
import vocabRaw from './vocab.json'
import grammarRaw from './grammar.json'

/**
 * Contenu de départ générique (PRD §14) en attendant l'import des feuilles
 * scannées. Jamais de contenu en dur dans les composants : tout passe par ce
 * module de données. En mode connecté, le serveur fait référence (repo.ts).
 */
export const vocabItems: ContentItem[] = vocabRaw as ContentItem[]
export const grammarItems: ContentItem[] = grammarRaw as ContentItem[]
export const seedItems: ContentItem[] = [...vocabItems, ...grammarItems]
