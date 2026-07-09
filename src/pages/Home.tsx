import { Link } from 'react-router'
import type { Module } from '../types'
import { getContentItems, getSrsStates } from '../lib/repo'
import { MODULE_LABELS, selectForModule } from '../lib/modules'
import { computeStreak, STREAK_MIN_MINUTES_PER_DAY } from '../lib/streak'
import { minutesInLastDays } from '../lib/dashboard'
import { badgeDef } from '../lib/badges'
import { loadEarnedBadges, loadMockExams, loadSessionRecords, totalXp } from '../lib/storage'
import { exams } from '../lib/exams'

const MODULE_ICONS: Record<Module, string> = {
  vocab: '📚',
  grammar: '🧩',
  listening: '🎧',
  writing: '✍️',
  speaking: '🎤',
}

function moduleCounts(module: Module) {
  const { reviews, fresh } = selectForModule(getContentItems(), getSrsStates(), new Date(), module)
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
                  <span className="font-semibold text-teal-700 dark:text-teal-400">{reviews}</span> à réviser
                </span>
              )}
              {reviews > 0 && fresh > 0 && ' + '}
              {fresh > 0 && (
                <span>
                  <span className="font-semibold text-teal-700 dark:text-teal-400">{fresh}</span> nouveau
                  {fresh > 1 ? 'x' : ''}
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
  const records = loadSessionRecords()
  const now = new Date()
  const streak = computeStreak(records, now)
  const remainingToday = Math.max(0, STREAK_MIN_MINUTES_PER_DAY - minutesInLastDays(records, now, 1))
  const xp = totalXp()
  const badges = loadEarnedBadges()
    .map((badge) => badgeDef(badge.code))
    .filter((def) => def !== undefined)
  const modules = Object.keys(MODULE_LABELS) as Module[]
  const nothingDue = modules.every((module) => moduleCounts(module).total === 0)

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
              streak.todayDone
                ? 'Journée validée (≥ 1 h de travail) !'
                : `Encore ~${remainingToday} min aujourd’hui pour valider la journée`
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

      {modules.map((module) => (
        <ModuleCard key={module} module={module} />
      ))}

      <div className="flex flex-col gap-3 rounded-3xl border-2 border-amber-400 bg-amber-50 p-5 text-left dark:border-amber-600 dark:bg-amber-950">
        <p className="font-bold">🏆 Examens blancs</p>
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Comme le vrai CE1D, chronométré. Gros bonus d'XP à la clé !
        </p>
        {exams.map((exam) => {
          const attempts = loadMockExams().filter((r) => r.examId === exam.id)
          const best = attempts.reduce<number | null>(
            (acc, r) => (acc === null || r.score > acc ? r.score : acc),
            null,
          )
          return (
            <Link
              key={exam.id}
              to={`/examen?id=${exam.id}`}
              className="flex items-center justify-between rounded-2xl bg-amber-500 px-5 py-3.5 font-bold text-white shadow-lg shadow-amber-500/25 transition hover:bg-amber-600 active:scale-95"
            >
              <span>{exam.title}</span>
              <span className="text-sm font-semibold">
                {best !== null
                  ? `Record : ${best}/${exam.type === 'ecrit' ? 70 : 30}`
                  : `${exam.type === 'ecrit' ? '≈ 2 h' : '≈ 15 min'}`}
              </span>
            </Link>
          )
        })}
      </div>

      {badges.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2" aria-label="Badges gagnés">
          {badges.map((def) => (
            <span
              key={def.code}
              title={`${def.label} — ${def.description}`}
              className="rounded-full bg-amber-100 px-3 py-1 text-lg dark:bg-amber-900"
            >
              {def.emoji}
            </span>
          ))}
        </div>
      )}

      {learnedCount > 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {learnedCount} carte{learnedCount > 1 ? 's' : ''} en cours d'apprentissage sur {itemCount}
        </p>
      )}
    </div>
  )
}
