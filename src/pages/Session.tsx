import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import type { ContentItem, Grade, SrsState } from '../types'
import { getContentItems, getSrsStates, recordSession, saveState } from '../lib/repo'
import { initialSrsState, review, selectSessionItems } from '../lib/srs'
import { sessionXp, type AnsweredCard } from '../lib/xp'
import ProgressBar from '../components/ProgressBar'

interface SessionData {
  queue: ContentItem[]
  states: Record<string, SrsState>
  newIds: Set<string>
}

function buildSession(): SessionData {
  const states = getSrsStates()
  const { reviews, fresh } = selectSessionItems(getContentItems(), states, new Date())
  return {
    queue: [...reviews, ...fresh],
    states,
    newIds: new Set(fresh.map((item) => item.id)),
  }
}

export default function Session() {
  const navigate = useNavigate()
  const [session] = useState(buildSession)
  const [startedAt] = useState(() => new Date())
  const [queue, setQueue] = useState(session.queue)
  const [revealed, setRevealed] = useState(false)
  // Cartes terminées (réussies) / ratées au moins une fois pendant la session
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())
  const [lapsedIds, setLapsedIds] = useState<Set<string>>(new Set())
  const [answers, setAnswers] = useState<AnsweredCard[]>([])

  const totalUnique = new Set(session.queue.map((item) => item.id)).size
  const current = queue[0]

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
  }

  function finishSession(done: Set<string>, allAnswers: AnsweredCard[]) {
    const now = new Date()
    const xpEarned = sessionXp(allAnswers, true)
    recordSession(
      {
        finishedAt: now.toISOString(),
        cardsReviewed: totalUnique,
        correctFirstTry: [...done].filter((id) => !lapsedIds.has(id)).length,
        lapsed: lapsedIds.size,
        durationSeconds: Math.round((now.getTime() - startedAt.getTime()) / 1000),
        xpEarned,
      },
      {
        amount: xpEarned,
        reason: 'Session vocabulaire terminée',
        createdAt: now.toISOString(),
      },
    )
    navigate('/bilan')
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
        <p lang="nl" className="text-3xl font-bold">
          {current.front}
        </p>
        {revealed && <p className="mt-4 text-xl text-teal-700 dark:text-teal-400">{current.back}</p>}
      </div>

      {revealed ? (
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
