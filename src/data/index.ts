import type { ContentItem } from '../types'
import vocabRaw from './vocab.json'

/**
 * Contenu de départ générique (PRD §14) en attendant l'import des feuilles
 * scannées (M1). Jamais de contenu en dur dans les composants : tout passe
 * par ce module de données.
 */
export const vocabItems: ContentItem[] = vocabRaw as ContentItem[]
