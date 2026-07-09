import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { loadSessionRecords } from '../lib/storage'
import { MODULE_LABELS } from '../lib/modules'
import { badgeDef } from '../lib/badges'

/** Compteur animé (IDENTITE.md : « le compteur d'XP qui monte au bilan »). */
function useCountUp(target: number): number {
  const [value, setValue] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? target : 0,
  )
  useEffect(() => {
    if (value >= target) return
    const start = performance.now()
    const duration = 800
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])
  return value
}

/** Confetti bref à la célébration d'un badge (motion-safe uniquement). */
function Confetti() {
  const colors = [
    'var(--color-action-500)',
    'var(--color-reward-400)',
    'var(--color-zee-600)',
    'var(--color-action-300)',
  ]
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 hidden motion-safe:block">
      {Array.from({ length: 14 }, (_, i) => (
        <span
          key={i}
          className="absolute h-2.5 w-1.5 animate-confetti rounded-xs"
          style={{
            left: `${(i * 37 + 7) % 100}%`,
            background: colors[i % colors.length],
            animationDelay: `${(i % 5) * 90}ms`,
          }}
        />
      ))}
    </div>
  )
}

function XpPill({ amount }: { amount: number }) {
  const animated = useCountUp(amount)
  return (
    <p className="rounded-full bg-reward-100 px-6 py-2 font-display text-lg font-extrabold text-reward-800 tabular-nums dark:bg-reward-900 dark:text-reward-200">
      +{animated} XP ⭐
    </p>
  )
}

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

      {last.xpEarned !== undefined && <XpPill amount={last.xpEarned} />}

      {celebrated.length > 0 && (
        <div className="relative flex w-full flex-col gap-2">
          <Confetti />
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
