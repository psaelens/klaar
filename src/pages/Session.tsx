import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import type { ContentItem, Grade, Module, SrsState } from '../types'
import { awardBadges, getContentItems, getSrsStates, recordSession, saveState } from '../lib/repo'
import { initialSrsState, review, selectSessionItems } from '../lib/srs'
import { newBadges } from '../lib/badges'
import { computeStreak } from '../lib/streak'
import { loadEarnedBadges, loadSessionRecords, totalXp } from '../lib/storage'
import { itemsForModule, MODULE_LABELS, shuffle } from '../lib/modules'
import { speakDutch, ttsAvailable } from '../lib/tts'
import { sessionXp, type AnsweredCard } from '../lib/xp'
import ProgressBar from '../components/ProgressBar'

interface SessionData {
  queue: ContentItem[]
  states: Record<string, SrsState>
  newIds: Set<string>
}

function buildSession(module: Module): SessionData {
  const states = getSrsStates()
  const items = itemsForModule(getContentItems(), module)
  const { reviews, fresh } = selectSessionItems(items, states, new Date())
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
  const module: Module = param === 'grammar' ? 'grammar' : param === 'listening' ? 'listening' : 'vocab'
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

  const totalUnique = new Set(session.queue.map((item) => item.id)).size
  const current = queue[0]
  const isDrill = current !== undefined && (current.choices?.length ?? 0) > 0
  const isListening = current !== undefined && current.type === 'listening'
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

    const allAnswers: AnsweredCard[] = [...answers, { difficulty: current.difficulty, grade }]
    setAnswers(allAnswers)

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
        {isListening ? (
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

      {isDrill ? (
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
