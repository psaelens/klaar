import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router'
import { useTheme } from './hooks/useTheme'
import { initRepo } from './lib/repo'
import Home from './pages/Home'
import Session from './pages/Session'
import Exam from './pages/Exam'
import Summary from './pages/Summary'
import Config from './pages/Config'
import Import from './pages/Import'
import Parent from './pages/Parent'

export default function App() {
  const { theme, toggle } = useTheme()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void initRepo().then(() => setReady(true))
  }, [])

  return (
    <div className="min-h-dvh bg-ink-50 text-ink-900 dark:bg-ink-900 dark:text-ink-100">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-4">
        <header className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="font-display text-2xl font-extrabold tracking-tight text-action-700 dark:text-action-400"
          >
            Klaar!
          </Link>
          <div className="flex items-center gap-1">
            <Link
              to="/config"
              aria-label="Synchronisation et compte"
              className="rounded-full p-2 text-xl hover:bg-ink-200 dark:hover:bg-ink-800"
            >
              ⚙️
            </Link>
            <button
              type="button"
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
              className="rounded-full p-2 text-xl hover:bg-ink-200 dark:hover:bg-ink-800"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </header>
        <main className="flex flex-1 flex-col">
          {ready ? (
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/session" element={<Session />} />
              <Route path="/examen" element={<Exam />} />
              <Route path="/bilan" element={<Summary />} />
              <Route path="/config" element={<Config />} />
              <Route path="/import" element={<Import />} />
              <Route path="/parent" element={<Parent />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="animate-pulse font-display text-2xl font-extrabold text-action-700 dark:text-action-400">
                Klaar!
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
