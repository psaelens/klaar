/**
 * Synthèse vocale pour la compréhension orale (voir DECISIONS.md 2026-07-05) :
 * Web Speech API, voix néerlandaise si disponible, débit ralenti pour un
 * apprenant A2. Si l'appareil n'a pas de synthèse vocale, l'écran d'écoute
 * affiche le transcript à la place (l'item reste jouable).
 */

export function ttsAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

function pickDutchVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices()
  // Préférence : nl-BE (accent belge) puis n'importe quelle voix nl.
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith('nl-be')) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith('nl'))
  )
}

export function speakDutch(text: string): void {
  if (!ttsAvailable()) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'nl-BE'
  utterance.rate = 0.9
  const voice = pickDutchVoice()
  if (voice !== undefined) utterance.voice = voice
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}
