import { Link, Navigate, Route, Routes } from 'react-router'
import { useTheme } from './hooks/useTheme'
import Home from './pages/Home'
import Session from './pages/Session'
import Summary from './pages/Summary'

export default function App() {
  const { theme, toggle } = useTheme()

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-4">
        <header className="mb-6 flex items-center justify-between">
          <Link to="/" className="text-2xl font-extrabold tracking-tight text-teal-700 dark:text-teal-400">
            Klaar!
          </Link>
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            className="rounded-full p-2 text-xl hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </header>
        <main className="flex flex-1 flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/session" element={<Session />} />
            <Route path="/bilan" element={<Summary />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
