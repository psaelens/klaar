import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import type { ContentItem, Grade, Module, SrsState } from '../types'
import {
  awardBadges,
  getContentItems,
  getSrsStates,
  recordSession,
  saveState,
  uploadRecording,
} from '../lib/repo'
import { initialSrsState, review } from '../lib/srs'
import { newBadges } from '../lib/badges'
import { computeStreak } from '../lib/streak'
import { loadEarnedBadges, loadSessionRecords, totalXp } from '../lib/storage'
import { MODULE_LABELS, selectForModule, shuffle } from '../lib/modules'
import { speakDutch, ttsAvailable } from '../lib/tts'
import { countWords, suggestedGrade, WRITING_MIN_WORDS, WRITING_TARGET_WORDS } from '../lib/writing'
import { formatSeconds, SPEAKING_MIN_SECONDS } from '../lib/speaking'
import { useRecorder } from '../hooks/useRecorder'
import { sessionXp, type AnsweredCard } from '../lib/xp'
import ProgressBar from '../components/ProgressBar'

interface SessionData {
  queue: ContentItem[]
  states: Record<string, SrsState>
  newIds: Set<string>
}

function buildSession(module: Module): SessionData {
  const states = getSrsStates()
  const { reviews, fresh } = selectForModule(getContentItems(), states, new Date(), module)
  return {
    queue: [...reviews, ...fresh],
    states,
    newIds: new Set(fresh.map((item) => item.id)),
  }
}

export default function Session() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const param = searchParams.get('m')
  const module: Module =
    param === 'grammar' || param === 'listening' || param === 'writing' || param === 'speaking'
      ? param
      : 'vocab'
  const [session] = useState(() => buildSession(module))
  const [startedAt] = useState(() => new Date())
  const [queue, setQueue] = useState(session.queue)
  const [revealed, setRevealed] = useState(false)
  // Drill : option choisie (null tant que l'élève n'a pas répondu)
  const [picked, setPicked] = useState<string | null>(null)
  // Cartes terminées (réussies) / ratées au moins une fois pendant la session
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())
  const [lapsedIds, setLapsedIds] = useState<Set<string>>(new Set())
  const [answers, setAnswers] = useState<AnsweredCard[]>([])
  // Rédaction : brouillon de l'élève + points de la checklist cochés (oral aussi).
  const [draft, setDraft] = useState('')
  const [checkedPoints, setCheckedPoints] = useState<Set<number>>(new Set())
  // Oral : prise audio de l'élève.
  const recorder = useRecorder()

  const totalUnique = new Set(session.queue.map((item) => item.id)).size
  const current = queue[0]
  const isDrill = current !== undefined && (current.choices?.length ?? 0) > 0
  const isListening = current !== undefined && current.type === 'listening'
  const isWriting = current !== undefined && current.type === 'writing'
  const isSpeaking = current !== undefined && current.type === 'speaking'
  // Sans synthèse vocale sur l'appareil, on affiche le transcript (item jouable quand même).
  const canSpeak = ttsAvailable()

  // Ordre des options mélangé une fois par présentation de la carte.
  const options = useMemo(
    () => (current?.choices !== undefined && current.choices !== null ? shuffle(current.choices) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current?.id, queue.length],
  )

  if (current === undefined) {
    // File vide dès l'arrivée (rien à réviser) : retour à l'accueil.
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p>Rien à réviser pour le moment.</p>
        <Link to="/" className="font-semibold text-teal-700 underline dark:text-teal-400">
          Retour à l'accueil
        </Link>
      </div>
    )
  }

  function handleGrade(grade: Grade) {
    if (current === undefined) return
    const now = new Date()
    const previous = session.states[current.id] ?? initialSrsState(current.id, now)
    const updated = review(previous, grade, now)
    session.states[current.id] = updated
    saveState(updated)

    const production = current.type === 'writing' || current.type === 'speaking'
    const allAnswers: AnsweredCard[] = [...answers, { difficulty: current.difficulty, grade, production }]
    setAnswers(allAnswers)

    // Oral : la prise part vers le bucket recordings pour l'écoute hebdo du
    // parent (PRD §13) — best-effort, ne bloque jamais la session.
    if (current.type === 'speaking' && recorder.blob !== null) {
      uploadRecording(recorder.blob, current.id)
    }

    const rest = queue.slice(1)
    if (grade === 'again') {
      // Non punitif : la carte revient en fin de file pour être retravaillée.
      setLapsedIds((prev) => new Set(prev).add(current.id))
      setQueue([...rest, current])
    } else {
      const done = new Set(doneIds).add(current.id)
      setDoneIds(done)
      setQueue(rest)
      if (rest.length === 0) {
        finishSession(done, allAnswers)
        return
      }
    }
    setRevealed(false)
    setPicked(null)
    setDraft('')
    setCheckedPoints(new Set())
    recorder.reset()
  }

  function togglePoint(index: number) {
    setCheckedPoints((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function handlePick(option: string) {
    if (picked !== null || current === undefined) return
    setPicked(option)
    if (option === current.back) {
      // Bonne réponse : petit feedback visuel puis carte suivante.
      setTimeout(() => handleGrade('good'), 700)
    }
  }

  function finishSession(done: Set<string>, allAnswers: AnsweredCard[]) {
    const now = new Date()
    const xpEarned = sessionXp(allAnswers, true)
    recordSession(
      {
        finishedAt: now.toISOString(),
        module,
        cardsReviewed: totalUnique,
        correctFirstTry: [...done].filter((id) => !lapsedIds.has(id)).length,
        lapsed: lapsedIds.size,
        durationSeconds: Math.round((now.getTime() - startedAt.getTime()) / 1000),
        xpEarned,
      },
      {
        amount: xpEarned,
        reason: `Session ${MODULE_LABELS[module].toLowerCase()} terminée`,
        createdAt: now.toISOString(),
      },
    )

    // Badges : calculés sur l'état APRÈS enregistrement de cette session.
    const records = loadSessionRecords()
    const earned = newBadges(
      { records, xpTotal: totalXp(), streakDays: computeStreak(records, now).current },
      loadEarnedBadges().map((badge) => badge.code),
    )
    awardBadges(earned, now)
    navigate('/bilan', { state: { newBadges: earned } })
  }

  const optionClass = (option: string): string => {
    if (picked === null)
      return 'border-slate-200 bg-white hover:border-teal-400 dark:border-slate-600 dark:bg-slate-800'
    if (option === current.back)
      return 'border-teal-600 bg-teal-50 font-bold text-teal-800 dark:bg-teal-900 dark:text-teal-100'
    if (option === picked)
      return 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-900 dark:text-amber-100'
    return 'border-slate-200 bg-white opacity-50 dark:border-slate-600 dark:bg-slate-800'
  }

  // Auto-évaluation par les 3 boutons SM-2 (vocabulaire et rédaction).
  const gradeButtons = (
    <div className="grid grid-cols-3 gap-3">
      <button
        type="button"
        onClick={() => handleGrade('again')}
        className="rounded-2xl bg-slate-200 py-4 font-semibold text-slate-700 transition hover:bg-slate-300 active:scale-95 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
      >
        À revoir
      </button>
      <button
        type="button"
        onClick={() => handleGrade('hard')}
        className="rounded-2xl bg-amber-100 py-4 font-semibold text-amber-800 transition hover:bg-amber-200 active:scale-95 dark:bg-amber-900 dark:text-amber-100 dark:hover:bg-amber-800"
      >
        Difficile
      </button>
      <button
        type="button"
        onClick={() => handleGrade('good')}
        className="rounded-2xl bg-teal-600 py-4 font-semibold text-white transition hover:bg-teal-700 active:scale-95"
      >
        Réussi
      </button>
    </div>
  )

  const checklist = current.checklist ?? []
  const draftWords = countWords(draft)
  const suggestion = suggestedGrade(checkedPoints.size, checklist.length)
  const selfCheckHint =
    suggestion === 'good'
      ? 'Tous les points y sont — choisis « Réussi » !'
      : suggestion === 'hard'
        ? 'Il manque un ou deux points — « Difficile » est un choix honnête.'
        : 'Plusieurs points manquent — « À revoir » pour retravailler tout à l’heure.'

  // Auto-évaluation guidée, partagée entre rédaction et oral (PRD §13 : pas de juge automatique).
  const checklistPanel = (
    <div className="flex flex-col gap-2 rounded-2xl border-2 border-teal-600 bg-white p-4 text-left dark:bg-slate-800">
      <p className="font-bold">{isSpeaking ? 'Vérifie ta présentation :' : 'Vérifie ton texte :'}</p>
      {checklist.map((point, index) => (
        <label key={point} className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={checkedPoints.has(index)}
            onChange={() => togglePoint(index)}
            className="mt-0.5 size-5 shrink-0 accent-teal-600"
          />
          <span>{point}</span>
        </label>
      ))}
    </div>
  )

  const examplePanel = (
    <details className="rounded-2xl border border-slate-200 bg-white p-4 text-left dark:border-slate-700 dark:bg-slate-800">
      <summary className="cursor-pointer font-semibold text-teal-700 dark:text-teal-400">
        Voir un exemple de réponse
      </summary>
      <p lang="nl" className="mt-2 text-slate-700 dark:text-slate-200">
        {current.back}
      </p>
      {isSpeaking && canSpeak && (
        <button
          type="button"
          onClick={() => speakDutch(current.back)}
          className="mt-3 rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 active:scale-95"
        >
          🔊 Écouter l'exemple
        </button>
      )}
    </details>
  )

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center gap-3">
        <ProgressBar done={doneIds.size} total={totalUnique} />
        <span className="text-sm tabular-nums text-slate-500 dark:text-slate-400">
          {doneIds.size}/{totalUnique}
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
          {current.theme}
          {session.newIds.has(current.id) && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              Nouveau
            </span>
          )}
        </p>
        {isWriting || isSpeaking ? (
          <p className="w-full text-left text-lg font-semibold whitespace-pre-line">
            {current.front}
          </p>
        ) : isListening ? (
          <>
            {canSpeak && (
              <button
                type="button"
                onClick={() => speakDutch(current.front)}
                className="rounded-full bg-teal-600 px-8 py-4 text-2xl text-white shadow-lg shadow-teal-600/25 transition hover:bg-teal-700 active:scale-95"
              >
                🔊 Écouter
              </button>
            )}
            {(!canSpeak || picked !== null) && (
              <p lang="nl" className="mt-2 text-lg font-semibold text-slate-500 dark:text-slate-400">
                « {current.front} »
              </p>
            )}
            {current.question != null && (
              <p className="mt-3 text-xl font-bold">{current.question}</p>
            )}
          </>
        ) : (
          <>
            <p lang="nl" className={isDrill ? 'text-xl font-bold sm:text-2xl' : 'text-3xl font-bold'}>
              {current.front}
            </p>
            {!isDrill && revealed && (
              <p className="mt-4 text-xl text-teal-700 dark:text-teal-400">{current.back}</p>
            )}
          </>
        )}
      </div>

      {isSpeaking ? (
        revealed ? (
          <div className="flex flex-col gap-4">
            {recorder.url !== null && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-left dark:border-slate-700 dark:bg-slate-800">
                <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
                  Ta prise ({formatSeconds(recorder.seconds)})
                </p>
                <audio controls src={recorder.url} className="mt-2 w-full" />
              </div>
            )}
            {checklistPanel}
            {examplePanel}
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">{selfCheckHint}</p>
            {gradeButtons}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {canSpeak && (
              <button
                type="button"
                onClick={() => speakDutch(current.back)}
                className="rounded-2xl border-2 border-teal-600 bg-white py-3 font-semibold text-teal-700 transition hover:bg-teal-50 active:scale-95 dark:bg-slate-800 dark:text-teal-400 dark:hover:bg-slate-700"
              >
                🔊 Écouter un exemple d'abord
              </button>
            )}
            {recorder.status === 'unavailable' ? (
              <>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                  Pas de micro disponible — entraîne-toi à voix haute, puis évalue-toi.
                </p>
                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className="rounded-2xl bg-teal-600 py-5 text-lg font-bold text-white shadow-lg shadow-teal-600/25 transition hover:bg-teal-700 active:scale-95"
                >
                  Je me suis entraîné →
                </button>
              </>
            ) : recorder.status === 'recording' ? (
              <>
                <p className="animate-pulse text-center text-3xl font-bold text-red-600 tabular-nums dark:text-red-400">
                  ● {formatSeconds(recorder.seconds)}
                </p>
                <button
                  type="button"
                  onClick={recorder.stop}
                  className="rounded-2xl bg-teal-600 py-5 text-lg font-bold text-white shadow-lg shadow-teal-600/25 transition hover:bg-teal-700 active:scale-95"
                >
                  ⏹️ Terminer la prise
                </button>
              </>
            ) : recorder.status === 'done' ? (
              <>
                <audio controls src={recorder.url ?? undefined} className="w-full" />
                <p
                  className={`text-center text-sm font-semibold tabular-nums ${
                    recorder.seconds >= SPEAKING_MIN_SECONDS
                      ? 'text-teal-700 dark:text-teal-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {formatSeconds(recorder.seconds)}
                  {recorder.seconds < SPEAKING_MIN_SECONDS && ' — un peu court, vise 1 à 2 minutes'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={recorder.reset}
                    className="rounded-2xl bg-slate-200 py-4 font-semibold text-slate-700 transition hover:bg-slate-300 active:scale-95 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                  >
                    🔄 Refaire
                  </button>
                  <button
                    type="button"
                    disabled={recorder.seconds < SPEAKING_MIN_SECONDS}
                    onClick={() => setRevealed(true)}
                    className="rounded-2xl bg-teal-600 py-4 font-bold text-white shadow-lg shadow-teal-600/25 transition hover:bg-teal-700 active:scale-95 disabled:opacity-40 disabled:hover:bg-teal-600 disabled:active:scale-100"
                  >
                    J'ai terminé →
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={recorder.start}
                className="rounded-2xl bg-teal-600 py-5 text-lg font-bold text-white shadow-lg shadow-teal-600/25 transition hover:bg-teal-700 active:scale-95"
              >
                🎙️ M'enregistrer (1 à 2 min)
              </button>
            )}
          </div>
        )
      ) : isWriting ? (
        revealed ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-left dark:border-slate-700 dark:bg-slate-800">
              <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase dark:text-slate-500">
                Ton texte
              </p>
              <p lang="nl" className="mt-1 whitespace-pre-line text-slate-700 dark:text-slate-200">
                {draft}
              </p>
            </div>
            {checklistPanel}
            {examplePanel}
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">{selfCheckHint}</p>
            {gradeButtons}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <textarea
              lang="nl"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={7}
              placeholder="Schrijf hier je tekst in het Nederlands…"
              className="rounded-2xl border-2 border-slate-200 bg-white p-4 text-lg dark:border-slate-600 dark:bg-slate-800"
            />
            <p
              className={`text-center text-sm font-semibold tabular-nums ${
                draftWords >= WRITING_MIN_WORDS
                  ? 'text-teal-700 dark:text-teal-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {draftWords} mot{draftWords > 1 ? 's' : ''} — objectif ≈ {WRITING_TARGET_WORDS}
            </p>
            <button
              type="button"
              disabled={draftWords < WRITING_MIN_WORDS}
              onClick={() => setRevealed(true)}
              className="rounded-2xl bg-teal-600 py-5 text-lg font-bold text-white shadow-lg shadow-teal-600/25 transition hover:bg-teal-700 active:scale-95 disabled:opacity-40 disabled:hover:bg-teal-600 disabled:active:scale-100"
            >
              J'ai terminé →
            </button>
          </div>
        )
      ) : isDrill ? (
        <div className="flex flex-col gap-3">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              disabled={picked !== null}
              onClick={() => handlePick(option)}
              lang={isListening ? 'fr' : 'nl'}
              className={`rounded-2xl border-2 px-4 py-4 text-lg font-semibold transition active:scale-95 ${optionClass(option)}`}
            >
              {option}
            </button>
          ))}
          {picked !== null && picked !== current.back && (
            <button
              type="button"
              onClick={() => handleGrade('again')}
              className="rounded-2xl bg-teal-600 py-4 font-bold text-white transition hover:bg-teal-700 active:scale-95"
            >
              Compris, on la retravaillera →
            </button>
          )}
        </div>
      ) : revealed ? (
        gradeButtons
      ) : (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="rounded-2xl bg-teal-600 py-5 text-lg font-bold text-white shadow-lg shadow-teal-600/25 transition hover:bg-teal-700 active:scale-95"
        >
          Voir la réponse
        </button>
      )}

      <Link
        to="/"
        className="text-center text-sm text-slate-400 underline hover:text-slate-600 dark:hover:text-slate-300"
      >
        Quitter la session
      </Link>
    </div>
  )
}
