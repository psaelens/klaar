import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import type { Module, SessionRecord } from '../types'
import { supabase } from '../lib/supabase'
import { computeStreak } from '../lib/streak'
import {
  dailyActivity,
  minutesInLastDays,
  successRate,
  successRateByModule,
  type DayActivity,
} from '../lib/dashboard'
import { MODULE_LABELS } from '../lib/modules'

/**
 * Dashboard parent v1 (PRD §9) — lecture seule, réservé au rôle parent.
 * Répond aux questions « a-t-il travaillé assez, régulièrement ? » (calendrier,
 * minutes) et « progresse-t-il ? » (taux de réussite global et par modalité).
 * Les policies RLS (is_parent_of) limitent la lecture aux enfants du foyer.
 */

interface Child {
  id: string
  display_name: string
}

type Gate = 'loading' | 'not-configured' | 'not-parent' | 'ready'

function pct(rate: number | null): string {
  return rate === null ? '—' : `${Math.round(rate * 100)} %`
}

function dayLabel(day: string): string {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number]
  return new Date(y, m - 1, d).toLocaleDateString('fr-BE', { day: 'numeric', month: 'short' })
}

function cellClass(cell: DayActivity): string {
  // Jour travaillé = au moins une session, même très courte (les minutes arrondissent à 0).
  if (cell.sessions === 0) return 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
  if (cell.minutes < 10) return 'bg-teal-200 text-teal-900 dark:bg-teal-900 dark:text-teal-100'
  if (cell.minutes < 20) return 'bg-teal-400 text-teal-950 dark:bg-teal-700 dark:text-white'
  return 'bg-teal-600 text-white dark:bg-teal-500'
}

function Calendar({ days }: { days: DayActivity[] }) {
  const weeks: DayActivity[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  const firstWeek = weeks[0] ?? []

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-slate-400 dark:text-slate-500">
        {firstWeek.map((cell) => {
          const [y, m, d] = cell.day.split('-').map(Number) as [number, number, number]
          return (
            <span key={cell.day}>
              {new Date(y, m - 1, d).toLocaleDateString('fr-BE', { weekday: 'narrow' })}
            </span>
          )
        })}
      </div>
      {weeks.map((week) => (
        <div key={week[0]?.day} className="grid grid-cols-7 gap-1.5">
          {week.map((cell) => (
            <div
              key={cell.day}
              title={`${dayLabel(cell.day)} — ${cell.minutes} min, ${cell.sessions} session${cell.sessions > 1 ? 's' : ''}`}
              className={`flex aspect-square items-center justify-center rounded-lg text-xs font-semibold tabular-nums ${cellClass(cell)}`}
            >
              {cell.day.split('-')[2]?.replace(/^0/, '')}
            </div>
          ))}
        </div>
      ))}
      <p className="mt-1 text-right text-xs text-slate-400 dark:text-slate-500">
        Intensité = minutes travaillées par jour (survoler une case pour le détail)
      </p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 text-2xl font-bold">{value}</dd>
    </div>
  )
}

export default function Parent() {
  const [gate, setGate] = useState<Gate>('loading')
  const [children, setChildren] = useState<Child[]>([])
  const [childId, setChildId] = useState<string | null>(null)
  const [records, setRecords] = useState<SessionRecord[]>([])
  const [xp, setXp] = useState(0)

  useEffect(() => {
    const sb = supabase
    if (sb === null) {
      setGate('not-configured')
      return
    }
    void sb.auth.getSession().then(async ({ data: { session } }) => {
      if (session === null) {
        setGate('not-parent')
        return
      }
      const { data: profiles } = await sb.from('profiles').select('id, display_name, role')
      const me = profiles?.find((p) => p.id === session.user.id)
      if (me === undefined || me.role !== 'parent') {
        setGate('not-parent')
        return
      }
      const kids = (profiles ?? []).filter((p) => p.role === 'child')
      setChildren(kids)
      setChildId(kids[0]?.id ?? null)
      setGate('ready')
    })
  }, [])

  useEffect(() => {
    const sb = supabase
    if (sb === null || childId === null) return
    void (async () => {
      const { data: sessionRows } = await sb
        .from('sessions')
        .select('*')
        .eq('user_id', childId)
        .order('finished_at', { ascending: true })
      setRecords(
        (sessionRows ?? []).map((row) => ({
          finishedAt: row.finished_at,
          module: (row.module as Module | null) ?? undefined,
          cardsReviewed: row.cards_reviewed,
          correctFirstTry: row.correct_first_try,
          lapsed: row.lapsed,
          durationSeconds: row.duration_seconds ?? undefined,
          xpEarned: row.xp_earned ?? undefined,
        })),
      )
      const { data: xpRows } = await sb.from('xp_ledger').select('amount').eq('user_id', childId)
      setXp((xpRows ?? []).reduce((sum, row) => sum + row.amount, 0))
    })()
  }, [childId])

  if (gate === 'loading') {
    return <p className="animate-pulse text-center text-slate-400">Chargement…</p>
  }

  if (gate === 'not-configured' || gate === 'not-parent') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-xl font-bold">Suivi parent</h1>
        <p className="text-slate-600 dark:text-slate-400">
          {gate === 'not-configured'
            ? "La synchronisation n'est pas configurée sur ce déploiement."
            : 'Le suivi est réservé au compte parent (connecte-toi via ⚙️).'}
        </p>
        <Link to="/" className="font-semibold text-teal-700 underline dark:text-teal-400">
          Retour à l'accueil
        </Link>
      </div>
    )
  }

  const child = children.find((c) => c.id === childId)
  const now = new Date()
  const days = dailyActivity(records, now, 28)
  const streak = computeStreak(records, now)
  const weekMinutes = minutesInLastDays(records, now, 7)
  const overall = successRate(records)
  const byModule = successRateByModule(records)

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Suivi de {child?.display_name ?? 'l’élève'}</h1>
        {children.length > 1 && (
          <select
            value={childId ?? ''}
            onChange={(e) => setChildId(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
          >
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.display_name}
              </option>
            ))}
          </select>
        )}
      </div>

      {records.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          Pas encore de session synchronisée. Dès que {child?.display_name ?? 'l’élève'} termine une
          session (connecté), elle apparaîtra ici.
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3">
            <Stat label="Streak" value={`🔥 ${streak.current} jour${streak.current > 1 ? 's' : ''}`} />
            <Stat label="XP total" value={`⭐ ${xp}`} />
            <Stat label="Minutes (7 derniers jours)" value={`${weekMinutes} min`} />
            <Stat label="Réussite du 1er coup" value={pct(overall)} />
          </dl>

          <div className="flex flex-wrap gap-2 text-sm">
            {(Object.keys(MODULE_LABELS) as Module[]).map((module) => (
              <span
                key={module}
                className="rounded-full bg-slate-200 px-3 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {MODULE_LABELS[module]} : {pct(byModule[module])}
              </span>
            ))}
          </div>

          <div>
            <h2 className="mb-2 font-bold">4 dernières semaines</h2>
            <Calendar days={days} />
          </div>
        </>
      )}

      <Link to="/" className="text-center text-sm text-slate-400 underline">
        Retour à l'accueil
      </Link>
    </div>
  )
}
