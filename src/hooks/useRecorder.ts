import { useEffect, useRef, useState } from 'react'

/**
 * Enregistrement audio (MediaRecorder) pour le module oral. Si l'appareil n'a
 * pas de micro ou refuse la permission, status passe à `unavailable` et
 * l'écran d'oral propose de s'entraîner sans enregistrement (item jouable
 * quand même, comme le fallback TTS de l'écoute).
 */

/** Garde-fou : une prise ne dépasse jamais 3 minutes (l'examen vise ~1-2 min). */
export const RECORDING_MAX_SECONDS = 180

export type RecorderStatus = 'idle' | 'recording' | 'done' | 'unavailable'

export interface Recorder {
  status: RecorderStatus
  /** Durée de la prise en cours ou terminée, en secondes. */
  seconds: number
  /** Prise terminée, prête à réécouter et à envoyer. */
  blob: Blob | null
  /** URL objet locale du blob pour <audio>. */
  url: string | null
  start: () => void
  stop: () => void
  reset: () => void
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  return ['audio/webm', 'audio/mp4', 'audio/ogg'].find((type) => MediaRecorder.isTypeSupported(type))
}

export function useRecorder(): Recorder {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [seconds, setSeconds] = useState(0)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<number | null>(null)

  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  function releaseUrl() {
    setUrl((previous) => {
      if (previous !== null) URL.revokeObjectURL(previous)
      return null
    })
  }

  // Nettoyage si l'élève quitte l'écran en pleine prise.
  useEffect(() => {
    return () => {
      clearTimer()
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop())
      releaseUrl()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function start() {
    if (status === 'recording') return
    if (navigator.mediaDevices?.getUserMedia === undefined || typeof MediaRecorder === 'undefined') {
      setStatus('unavailable')
      return
    }
    void navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mimeType = pickMimeType()
        const recorder = new MediaRecorder(stream, mimeType !== undefined ? { mimeType } : {})
        const chunks: Blob[] = []
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunks.push(event.data)
        }
        recorder.onstop = () => {
          stream.getTracks().forEach((track) => track.stop())
          const recorded = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
          setBlob(recorded)
          setUrl(URL.createObjectURL(recorded))
          setStatus('done')
        }
        recorderRef.current = recorder
        releaseUrl()
        setBlob(null)
        setSeconds(0)
        setStatus('recording')
        recorder.start()
        clearTimer()
        timerRef.current = window.setInterval(() => {
          setSeconds((previous) => {
            if (previous + 1 >= RECORDING_MAX_SECONDS) stop()
            return previous + 1
          })
        }, 1000)
      })
      .catch(() => setStatus('unavailable'))
  }

  function stop() {
    clearTimer()
    const recorder = recorderRef.current
    if (recorder !== null && recorder.state !== 'inactive') recorder.stop()
  }

  function reset() {
    clearTimer()
    const recorder = recorderRef.current
    if (recorder !== null && recorder.state !== 'inactive') {
      recorder.onstop = () => recorder.stream.getTracks().forEach((track) => track.stop())
      recorder.stop()
    }
    recorderRef.current = null
    releaseUrl()
    setBlob(null)
    setSeconds(0)
    setStatus('idle')
  }

  return { status, seconds, blob, url, start, stop, reset }
}
