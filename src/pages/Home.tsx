import { useState } from 'react'
import { Link } from 'react-router'
import type { Module } from '../types'
import { getContentItems, getProfile, getSrsStates, isConnected, syncConfigured } from '../lib/repo'
import { MODULE_LABELS, selectForModule } from '../lib/modules'
import { computeStreak, STREAK_MIN_MINUTES_PER_DAY } from '../lib/streak'
import { minutesInLastDays } from '../lib/dashboard'
import { badgeDef } from '../lib/badges'
import {
  loadDemoMode,
  loadEarnedBadges,
  loadMockExams,
  loadSessionRecords,
  saveDemoMode,
  totalXp,
} from '../lib/storage'
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
    <div className="flex flex-col gap-3 rounded-3xl border border-ink-200 bg-white p-5 text-left dark:border-ink-700 dark:bg-ink-800">
      <div className="flex items-center justify-between">
        <p className="font-bold">
          {MODULE_ICONS[module]} {MODULE_LABELS[module]}
        </p>
        <p className="text-sm text-ink-500 dark:text-ink-400">
          {total === 0 ? (
            'Tout est révisé 🎉'
          ) : (
            <>
              {reviews > 0 && (
                <span>
                  <span className="font-semibold text-action-700 dark:text-action-400">{reviews}</span> à
                  réviser
                </span>
              )}
              {reviews > 0 && fresh > 0 && ' + '}
              {fresh > 0 && (
                <span>
                  <span className="font-semibold text-action-700 dark:text-action-400">{fresh}</span> nouveau
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
          className="rounded-2xl bg-action-600 px-6 py-3.5 text-center font-bold text-white shadow-lg shadow-action-600/25 transition hover:bg-action-700 active:scale-95"
        >
          Commencer
        </Link>
      )}
    </div>
  )
}

/** Pastille d'état de connexion, toujours visible en haut de l'accueil (PRD §17). */
function StatusChip() {
  const profile = getProfile()
  if (isConnected()) {
    return (
      <Link
        to="/config"
        className="mx-auto rounded-full bg-action-100 px-4 py-1.5 text-sm font-semibold text-action-800 hover:bg-action-200 dark:bg-action-900 dark:text-action-200 dark:hover:bg-action-800"
      >
        👤 {profile?.displayName ?? 'Connecté'}
        {profile !== null && ` · ${profile.role === 'parent' ? 'Parent' : 'Élève'}`}
      </Link>
    )
  }
  return (
    <Link
      to="/config"
      title="Tes données restent sur cet appareil — connecte-toi pour les retrouver partout"
      className="mx-auto rounded-full bg-ink-200 px-4 py-1.5 text-sm font-semibold text-ink-600 hover:bg-ink-300 dark:bg-ink-800 dark:text-ink-400 dark:hover:bg-ink-700"
    >
      {syncConfigured() ? '🧪 Mode démo — se connecter' : '📱 Mode local'}
    </Link>
  )
}

/** Accueil visiteur : personne n'est connecté et le mode démo n'a pas été choisi. */
function Welcome({ onDemo }: { onDemo: () => void }) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-6 text-center">
      <h1 className="text-3xl font-extrabold text-action-700 dark:text-action-400">Klaar&nbsp;!</h1>
      <p className="text-ink-600 dark:text-ink-400">
        Révision du néerlandais pour le CE1D : vocabulaire, grammaire, écoute, rédaction, oral et examens
        blancs — avec suivi pour le parent.
      </p>
      <Link
        to="/config"
        className="rounded-2xl bg-action-600 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-action-600/25 transition hover:bg-action-700 active:scale-95"
      >
        Se connecter
      </Link>
      <button
        type="button"
        onClick={onDemo}
        className="rounded-2xl border-2 border-action-600 px-6 py-4 text-lg font-bold text-action-700 transition hover:bg-action-50 active:scale-95 dark:text-action-400 dark:hover:bg-ink-800"
      >
        Essayer en mode démo
      </button>
      <p className="text-sm text-ink-500 dark:text-ink-400">
        En mode démo, tout reste sur cet appareil. Si tu te connectes plus tard, tes révisions sont reprises
        dans ton compte.
      </p>
    </div>
  )
}

export default function Home() {
  const states = getSrsStates()
  const learnedCount = Object.keys(states).length
  const itemCount = getContentItems().length
  const records = loadSessionRecords()
  const now = new Date()
  const [demo, setDemo] = useState(loadDemoMode)
  // Données locales antérieures à l'écran visiteur : on considère le mode démo déjà choisi.
  const usedBefore = records.length > 0 || learnedCount > 0

  if (syncConfigured() && !isConnected() && !demo && !usedBefore) {
    return (
      <Welcome
        onDemo={() => {
          saveDemoMode(true)
          setDemo(true)
        }}
      />
    )
  }
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
      <StatusChip />

      {(streak.current > 0 || xp > 0) && (
        <div className="flex justify-center gap-3">
          <span
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              streak.todayDone
                ? 'bg-reward-100 text-reward-800 dark:bg-reward-900 dark:text-reward-200'
                : 'bg-ink-200 text-ink-600 dark:bg-ink-800 dark:text-ink-400'
            }`}
            title={
              streak.todayDone
                ? 'Journée validée (≥ 1 h de travail) !'
                : `Encore ~${remainingToday} min aujourd’hui pour valider la journée`
            }
          >
            🔥 {streak.current} jour{streak.current > 1 ? 's' : ''}
          </span>
          <span className="rounded-full bg-action-100 px-4 py-1.5 text-sm font-semibold text-action-800 dark:bg-action-900 dark:text-action-200">
            ⭐ {xp} XP
          </span>
        </div>
      )}

      <h1 className="font-display text-2xl font-extrabold tracking-tight">Klaar aujourd'hui ?</h1>

      {nothingDue && (
        <p className="text-ink-600 dark:text-ink-400">
          Tout est révisé pour le moment. Klaar ! 🎉
          <br />
          <span className="text-sm text-ink-500 dark:text-ink-400">
            Reviens plus tard pour la prochaine révision.
          </span>
        </p>
      )}

      {modules.map((module) => (
        <ModuleCard key={module} module={module} />
      ))}

      <div className="flex flex-col gap-3 rounded-3xl border-2 border-reward-400 bg-reward-50 p-5 text-left dark:border-reward-600 dark:bg-reward-950">
        <p className="font-bold">🏆 Examens blancs</p>
        <p className="text-sm text-reward-800 dark:text-reward-200">
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
              className="flex items-center justify-between rounded-2xl bg-reward-400 px-5 py-3.5 font-bold text-ink-900 shadow-lg shadow-reward-400/30 transition hover:bg-reward-300 active:scale-95"
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
              className="rounded-full bg-reward-100 px-3 py-1 text-lg dark:bg-reward-900"
            >
              {def.emoji}
            </span>
          ))}
        </div>
      )}

      {learnedCount > 0 && (
        <p className="text-sm text-ink-500 dark:text-ink-400">
          {learnedCount} carte{learnedCount > 1 ? 's' : ''} en cours d'apprentissage sur {itemCount}
        </p>
      )}
    </div>
  )
}
