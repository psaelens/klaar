import { Link } from 'react-router'
import { getContentItems, getSrsStates } from '../lib/repo'
import { selectSessionItems } from '../lib/srs'
import { computeStreak } from '../lib/streak'
import { loadSessionRecords, totalXp } from '../lib/storage'

export default function Home() {
  const items = getContentItems().filter((item) => item.type === 'vocab')
  const states = getSrsStates()
  const { reviews, fresh } = selectSessionItems(items, states, new Date())
  const total = reviews.length + fresh.length
  const learnedCount = Object.keys(states).length
  const streak = computeStreak(loadSessionRecords(), new Date())
  const xp = totalXp()

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
      {(streak.current > 0 || xp > 0) && (
        <div className="flex gap-3">
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
      <div>
        <h1 className="text-xl font-bold">Klaar aujourd'hui ?</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {total > 0 ? (
            <>
              {reviews.length > 0 && (
                <>
                  <span className="font-semibold text-teal-700 dark:text-teal-400">{reviews.length}</span>{' '}
                  carte
                  {reviews.length > 1 ? 's' : ''} à réviser
                </>
              )}
              {reviews.length > 0 && fresh.length > 0 && ' + '}
              {fresh.length > 0 && (
                <>
                  <span className="font-semibold text-teal-700 dark:text-teal-400">{fresh.length}</span>{' '}
                  nouveau
                  {fresh.length > 1 ? 'x' : ''} mot{fresh.length > 1 ? 's' : ''} à découvrir
                </>
              )}
            </>
          ) : (
            'Tout est révisé pour le moment. Klaar ! 🎉'
          )}
        </p>
      </div>

      {total > 0 ? (
        <Link
          to="/session"
          className="w-full rounded-2xl bg-teal-600 px-8 py-5 text-lg font-bold text-white shadow-lg shadow-teal-600/25 transition hover:bg-teal-700 active:scale-95"
        >
          Commencer la session
        </Link>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Reviens plus tard pour la prochaine révision.
        </p>
      )}

      {learnedCount > 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {learnedCount} mot{learnedCount > 1 ? 's' : ''} en cours d'apprentissage sur {items.length}
        </p>
      )}
    </div>
  )
}
