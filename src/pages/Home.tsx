import { useState, type ComponentType } from 'react'
import { Link } from 'react-router'
import { BookOpen, Headphones, Mic, PenLine, Puzzle } from 'lucide-react'
import type { Module } from '../types'
import { getContentItems, getProfile, getSrsStates, isConnected, syncConfigured } from '../lib/repo'
import { MODULE_LABELS, selectForModule } from '../lib/modules'
import { computeStreak, STREAK_MIN_MINUTES_PER_DAY } from '../lib/streak'
import { minutesInLastDays } from '../lib/dashboard'
import { loadDemoMode, loadSessionRecords, saveDemoMode } from '../lib/storage'

const MODULE_ICONS: Record<Module, ComponentType<{ size?: number; 'aria-hidden'?: boolean }>> = {
  vocab: BookOpen,
  grammar: Puzzle,
  listening: Headphones,
  writing: PenLine,
  speaking: Mic,
}

function moduleCounts(module: Module) {
  const { reviews, fresh } = selectForModule(getContentItems(), getSrsStates(), new Date(), module)
  return { reviews: reviews.length, fresh: fresh.length, total: reviews.length + fresh.length }
}

function ModuleCard({ module }: { module: Module }) {
  const { reviews, fresh, total } = moduleCounts(module)
  const Icon = MODULE_ICONS[module]

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-ink-200 bg-white p-5 text-left dark:border-ink-700 dark:bg-ink-800">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-action-50 text-action-700 dark:bg-action-950 dark:text-action-300">
          <Icon size={20} aria-hidden />
        </span>
        <p className="font-bold">{MODULE_LABELS[module]}</p>
        <p className="ml-auto text-right text-sm text-ink-500 dark:text-ink-400">
          {total === 0 ? (
            'Tout est révisé 🎉'
          ) : (
            <>
              {reviews > 0 && (
                <span>
                  <span className="font-semibold text-action-700 tabular-nums dark:text-action-400">
                    {reviews}
                  </span>{' '}
                  à réviser
                </span>
              )}
              {reviews > 0 && fresh > 0 && ' + '}
              {fresh > 0 && (
                <span>
                  <span className="font-semibold text-action-700 tabular-nums dark:text-action-400">
                    {fresh}
                  </span>{' '}
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
          className="rounded-2xl bg-action-600 px-6 py-3.5 text-center font-bold text-white shadow-lg shadow-action-600/25 transition hover:bg-action-700 active:scale-95"
        >
          Commencer
        </Link>
      )}
    </div>
  )
}

/** Anneau d'objectif quotidien (charte : l'orange = progression). */
function GoalRing({ minutes }: { minutes: number }) {
  const ratio = Math.min(1, minutes / STREAK_MIN_MINUTES_PER_DAY)
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 64 64" className="size-16 shrink-0 -rotate-90" aria-hidden>
      <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="7" />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="var(--color-action-500)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${c * ratio} ${c}`}
      />
    </svg>
  )
}

/** Pastille d'état de connexion, toujours visible en haut de l'accueil (PRD §17). */
function StatusChip() {
  const profile = getProfile()
  if (isConnected()) {
    return (
      <Link
        to="/config"
        className="mx-auto rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-ink-700 ring-1 ring-ink-200 hover:bg-ink-100 dark:bg-ink-800 dark:text-ink-200 dark:ring-ink-700 dark:hover:bg-ink-700"
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
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-action-700 dark:text-action-400">
        Klaar&nbsp;!
      </h1>
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
  const records = loadSessionRecords()
  const now = new Date()
  const [demo, setDemo] = useState(loadDemoMode)
  // Données locales antérieures à l'écran visiteur : on considère le mode démo déjà choisi.
  const usedBefore = records.length > 0 || Object.keys(getSrsStates()).length > 0

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
  const todayMinutes = minutesInLastDays(records, now, 1)
  const modules = Object.keys(MODULE_LABELS) as Module[]
  const nothingDue = modules.every((module) => moduleCounts(module).total === 0)

  return (
    <div className="flex flex-1 flex-col justify-center gap-5 text-center">
      <StatusChip />

      {/* Objectif du jour : l'heure d'entraînement, à la Strava (IDENTITE.md) */}
      <div className="flex items-center justify-between gap-4 rounded-3xl bg-ink-900 p-5 text-left text-ink-50 dark:bg-ink-800">
        <div>
          <p className="font-display text-3xl font-extrabold tabular-nums">
            {todayMinutes}
            <span className="text-lg text-ink-300"> / {STREAK_MIN_MINUTES_PER_DAY} min</span>
          </p>
          <p className="mt-0.5 text-sm text-ink-300">
            Objectif du jour
            {streak.current > 0 && (
              <>
                {' · '}
                <span className={streak.todayDone ? 'text-reward-300' : ''}>
                  <span
                    className={streak.todayDone ? 'inline-block motion-safe:animate-flame' : 'inline-block'}
                  >
                    🔥
                  </span>{' '}
                  {streak.current} jour{streak.current > 1 ? 's' : ''}
                </span>
              </>
            )}
          </p>
        </div>
        <GoalRing minutes={todayMinutes} />
      </div>

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

      <div className="grid gap-5 md:grid-cols-2">
        {modules.map((module) => (
          <ModuleCard key={module} module={module} />
        ))}
      </div>
    </div>
  )
}
