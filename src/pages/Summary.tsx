import { Link } from 'react-router'
import { loadSessionRecords } from '../lib/storage'
import { MODULE_LABELS } from '../lib/modules'

export default function Summary() {
  const records = loadSessionRecords()
  const last = records[records.length - 1]

  if (last === undefined) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p>Pas encore de session terminée.</p>
        <Link to="/" className="font-semibold text-teal-700 underline dark:text-teal-400">
          Retour à l'accueil
        </Link>
      </div>
    )
  }

  const encouragement =
    last.lapsed === 0
      ? 'Sans faute, chapeau ! 🏆'
      : last.correctFirstTry >= last.lapsed
        ? 'Belle session, continue comme ça ! 💪'
        : 'Les mots difficiles reviendront — c’est comme ça qu’on les retient. 👊'

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
      <div>
        <h1 className="text-2xl font-extrabold text-teal-700 dark:text-teal-400">Sessie klaar ! 🎉</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Session {MODULE_LABELS[last.module ?? 'vocab'].toLowerCase()} terminée
        </p>
      </div>

      <dl className="grid w-full grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <dt className="text-xs text-slate-500 dark:text-slate-400">Cartes vues</dt>
          <dd className="mt-1 text-2xl font-bold">{last.cardsReviewed}</dd>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <dt className="text-xs text-slate-500 dark:text-slate-400">Du 1er coup</dt>
          <dd className="mt-1 text-2xl font-bold text-teal-700 dark:text-teal-400">{last.correctFirstTry}</dd>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <dt className="text-xs text-slate-500 dark:text-slate-400">Retravaillées</dt>
          <dd className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{last.lapsed}</dd>
        </div>
      </dl>

      {last.xpEarned !== undefined && (
        <p className="rounded-full bg-amber-100 px-6 py-2 text-lg font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
          +{last.xpEarned} XP ⭐
        </p>
      )}

      <p className="text-slate-600 dark:text-slate-300">{encouragement}</p>

      <Link
        to="/"
        className="w-full rounded-2xl bg-teal-600 px-8 py-5 text-lg font-bold text-white shadow-lg shadow-teal-600/25 transition hover:bg-teal-700 active:scale-95"
      >
        Retour à l'accueil
      </Link>
    </div>
  )
}
