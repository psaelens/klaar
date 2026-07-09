import { Link, useLocation } from 'react-router'
import { loadSessionRecords } from '../lib/storage'
import { MODULE_LABELS } from '../lib/modules'
import { badgeDef } from '../lib/badges'

export default function Summary() {
  const records = loadSessionRecords()
  const last = records[records.length - 1]
  // Badges gagnés à l'instant (état de navigation ; perdu au reload — déjà attribués, pas grave).
  const location = useLocation()
  const celebrated = ((location.state as { newBadges?: string[] } | null)?.newBadges ?? [])
    .map(badgeDef)
    .filter((def) => def !== undefined)

  if (last === undefined) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p>Pas encore de session terminée.</p>
        <Link to="/" className="font-semibold text-action-700 underline dark:text-action-400">
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
        <h1 className="font-display text-2xl font-extrabold text-action-700 dark:text-action-400">
          Sessie klaar ! 🎉
        </h1>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Session{' '}
          {last.module === 'exam' ? 'examen blanc' : MODULE_LABELS[last.module ?? 'vocab'].toLowerCase()}{' '}
          terminée
        </p>
      </div>

      <dl className="grid w-full grid-cols-3 gap-3">
        <div className="rounded-2xl border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-800">
          <dt className="text-xs text-ink-500 dark:text-ink-400">Cartes vues</dt>
          <dd className="mt-1 font-display text-2xl font-extrabold tabular-nums">{last.cardsReviewed}</dd>
        </div>
        <div className="rounded-2xl border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-800">
          <dt className="text-xs text-ink-500 dark:text-ink-400">Du 1er coup</dt>
          <dd className="mt-1 font-display text-2xl font-extrabold tabular-nums text-action-700 dark:text-action-400">
            {last.correctFirstTry}
          </dd>
        </div>
        <div className="rounded-2xl border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-800">
          <dt className="text-xs text-ink-500 dark:text-ink-400">Retravaillées</dt>
          <dd className="mt-1 font-display text-2xl font-extrabold tabular-nums text-reward-600 dark:text-reward-400">
            {last.lapsed}
          </dd>
        </div>
      </dl>

      {last.xpEarned !== undefined && (
        <p className="rounded-full bg-reward-100 px-6 py-2 text-lg font-bold text-reward-800 dark:bg-reward-900 dark:text-reward-200">
          +{last.xpEarned} XP ⭐
        </p>
      )}

      {celebrated.length > 0 && (
        <div className="flex w-full flex-col gap-2">
          {celebrated.map((def) => (
            <div
              key={def.code}
              className="flex items-center gap-3 rounded-2xl border-2 border-reward-400 bg-reward-50 p-4 text-left dark:border-reward-500 dark:bg-reward-950"
            >
              <span className="text-3xl">{def.emoji}</span>
              <span>
                <span className="block font-bold text-reward-800 dark:text-reward-200">
                  Nouveau badge : {def.label} !
                </span>
                <span className="block text-sm text-reward-700 dark:text-reward-300">{def.description}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-ink-600 dark:text-ink-300">{encouragement}</p>

      <Link
        to="/"
        className="w-full rounded-2xl bg-action-600 px-8 py-5 text-lg font-bold text-white shadow-lg shadow-action-600/25 transition hover:bg-action-700 active:scale-95"
      >
        Retour à l'accueil
      </Link>
    </div>
  )
}
