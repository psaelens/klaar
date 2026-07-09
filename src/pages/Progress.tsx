import type { Module } from '../types'
import { getContentItems, getSrsStates } from '../lib/repo'
import { computeStreak, STREAK_MIN_MINUTES_PER_DAY } from '../lib/streak'
import { minutesInLastDays, successRateByModule } from '../lib/dashboard'
import { MODULE_LABELS } from '../lib/modules'
import { badgeDef, BADGES } from '../lib/badges'
import { loadEarnedBadges, loadSessionRecords, totalXp } from '../lib/storage'

/**
 * Onglet Progrès : la vue « record perso » de l'élève — streak, XP, badges,
 * taux de réussite par modalité, cartes en cours d'apprentissage.
 */

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-800">
      <dt className="text-xs text-ink-500 dark:text-ink-400">{label}</dt>
      <dd
        className={`mt-1 font-display text-2xl font-extrabold tabular-nums ${
          accent ? 'text-reward-700 dark:text-reward-300' : ''
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

export default function Progress() {
  const records = loadSessionRecords()
  const now = new Date()
  const streak = computeStreak(records, now)
  const todayMinutes = minutesInLastDays(records, now, 1)
  const xp = totalXp()
  const earned = loadEarnedBadges()
  const earnedCodes = new Set(earned.map((badge) => badge.code))
  const byModule = successRateByModule(records)
  const learnedCount = Object.keys(getSrsStates()).length
  const itemCount = getContentItems().length

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Mes progrès</h1>

      <dl className="grid grid-cols-2 gap-3">
        <Stat label="Streak" value={`🔥 ${streak.current} jour${streak.current > 1 ? 's' : ''}`} />
        <Stat label="XP total" value={`${xp}`} accent />
        <Stat label="Aujourd'hui" value={`${todayMinutes} / ${STREAK_MIN_MINUTES_PER_DAY} min`} />
        <Stat label="Cartes lancées" value={`${learnedCount} / ${itemCount}`} />
      </dl>

      <div>
        <h2 className="mb-2 font-bold">Réussite du 1er coup</h2>
        <div className="flex flex-col gap-2">
          {(Object.keys(MODULE_LABELS) as Module[]).map((module) => {
            const rate = byModule[module]
            return (
              <div
                key={module}
                className="rounded-2xl border border-ink-200 bg-white p-3 dark:border-ink-700 dark:bg-ink-800"
              >
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-semibold">{MODULE_LABELS[module]}</span>
                  <span className="text-ink-500 tabular-nums dark:text-ink-400">
                    {rate === null ? 'pas encore joué' : `${Math.round(rate * 100)} %`}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-ink-100 dark:bg-ink-700">
                  <div
                    className="h-full rounded-full bg-action-600 dark:bg-action-400"
                    style={{ width: `${Math.round((rate ?? 0) * 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-bold">
          Badges{' '}
          <span className="text-sm font-normal text-ink-500 tabular-nums dark:text-ink-400">
            {earned.length} / {BADGES.length}
          </span>
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {BADGES.map((def) => {
            const won = earnedCodes.has(def.code)
            return (
              <div
                key={def.code}
                title={def.description}
                className={`flex items-center gap-2.5 rounded-2xl border p-3 text-sm ${
                  won
                    ? 'border-reward-400 bg-reward-50 dark:border-reward-600 dark:bg-reward-950'
                    : 'border-ink-200 bg-white opacity-45 dark:border-ink-700 dark:bg-ink-800'
                }`}
              >
                <span className={`text-xl ${won ? '' : 'grayscale'}`}>{def.emoji}</span>
                <span className="font-semibold">{badgeDef(def.code)?.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
