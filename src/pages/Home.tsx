import { Link } from 'react-router'
import type { Module } from '../types'
import { getContentItems, getSrsStates } from '../lib/repo'
import { selectSessionItems } from '../lib/srs'
import { itemsForModule, MODULE_LABELS } from '../lib/modules'
import { computeStreak } from '../lib/streak'
import { loadSessionRecords, totalXp } from '../lib/storage'

const MODULE_ICONS: Record<Module, string> = { vocab: '📚', grammar: '🧩' }

function moduleCounts(module: Module) {
  const items = itemsForModule(getContentItems(), module)
  const { reviews, fresh } = selectSessionItems(items, getSrsStates(), new Date())
  return { reviews: reviews.length, fresh: fresh.length, total: reviews.length + fresh.length }
}

function ModuleCard({ module }: { module: Module }) {
  const { reviews, fresh, total } = moduleCounts(module)

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 text-left dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between">
        <p className="font-bold">
          {MODULE_ICONS[module]} {MODULE_LABELS[module]}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {total === 0 ? (
            'Tout est révisé 🎉'
          ) : (
            <>
              {reviews > 0 && (
                <span>
                  <span className="font-semibold text-teal-700 dark:text-teal-400">{reviews}</span> à
                  réviser
                </span>
              )}
              {reviews > 0 && fresh > 0 && ' + '}
              {fresh > 0 && (
                <span>
                  <span className="font-semibold text-teal-700 dark:text-teal-400">{fresh}</span>{' '}
                  nouveau{fresh > 1 ? 'x' : ''}
                </span>
              )}
            </>
          )}
        </p>
      </div>
      {total > 0 && (
        <Link
          to={`/session?m=${module}`}
          className="rounded-2xl bg-teal-600 px-6 py-3.5 text-center font-bold text-white shadow-lg shadow-teal-600/25 transition hover:bg-teal-700 active:scale-95"
        >
          Commencer
        </Link>
      )}
    </div>
  )
}

export default function Home() {
  const states = getSrsStates()
  const learnedCount = Object.keys(states).length
  const itemCount = getContentItems().length
  const streak = computeStreak(loadSessionRecords(), new Date())
  const xp = totalXp()
  const nothingDue =
    moduleCounts('vocab').total === 0 && moduleCounts('grammar').total === 0

  return (
    <div className="flex flex-1 flex-col justify-center gap-6 text-center">
      {(streak.current > 0 || xp > 0) && (
        <div className="flex justify-center gap-3">
          <span
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              streak.todayDone
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
            title={
              streak.todayDone ? 'Streak validé aujourd’hui' : 'Fais une session pour garder ton streak !'
            }
          >
            🔥 {streak.current} jour{streak.current > 1 ? 's' : ''}
          </span>
          <span className="rounded-full bg-teal-100 px-4 py-1.5 text-sm font-semibold text-teal-800 dark:bg-teal-900 dark:text-teal-200">
            ⭐ {xp} XP
          </span>
        </div>
      )}

      <h1 className="text-xl font-bold">Klaar aujourd'hui ?</h1>

      {nothingDue && (
        <p className="text-slate-600 dark:text-slate-400">
          Tout est révisé pour le moment. Klaar ! 🎉
          <br />
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Reviens plus tard pour la prochaine révision.
          </span>
        </p>
      )}

      <ModuleCard module="vocab" />
      <ModuleCard module="grammar" />

      {learnedCount > 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {learnedCount} carte{learnedCount > 1 ? 's' : ''} en cours d'apprentissage sur {itemCount}
        </p>
      )}
    </div>
  )
}
