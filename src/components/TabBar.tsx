import { Link, useLocation } from 'react-router'
import { ChartLine, Dumbbell, Trophy, UserRound } from 'lucide-react'

/**
 * Navigation principale (charte docs/IDENTITE.md) : onglets en bas sur mobile
 * (zone du pouce), rail latéral à partir de lg. Masquée pendant une session ou
 * un examen (mode focus) — géré par App. Icônes Lucide : même visage sur
 * Android, iOS et Windows.
 */

const TABS = [
  { to: '/', label: 'Réviser', icon: Dumbbell },
  { to: '/examens', label: 'Examens', icon: Trophy },
  { to: '/progres', label: 'Progrès', icon: ChartLine },
  { to: '/config', label: 'Profil', icon: UserRound },
] as const

export default function TabBar() {
  const { pathname } = useLocation()

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-ink-200 bg-white/95 backdrop-blur lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:w-44 lg:border-t-0 lg:border-r dark:border-ink-700 dark:bg-ink-800/95"
    >
      <div className="mx-auto flex max-w-md lg:mx-0 lg:max-w-none lg:flex-col lg:gap-1 lg:px-3 lg:pt-24">
        {TABS.map(({ to, label, icon: Icon }) => {
          const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 pt-2 pb-2.5 text-[0.65rem] font-semibold transition lg:flex-none lg:flex-row lg:gap-3 lg:rounded-xl lg:px-4 lg:py-3 lg:text-sm ${
                active
                  ? '-mt-px border-t-2 border-action-600 text-action-700 lg:mt-0 lg:border-t-0 lg:bg-action-50 dark:border-action-400 dark:text-action-400 dark:lg:bg-action-950'
                  : 'text-ink-500 hover:text-ink-700 lg:hover:bg-ink-100 dark:text-ink-400 dark:hover:text-ink-200 dark:lg:hover:bg-ink-700'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} aria-hidden />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
