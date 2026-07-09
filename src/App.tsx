import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from './hooks/useTheme'
import { initRepo } from './lib/repo'
import TabBar from './components/TabBar'
import Home from './pages/Home'
import Session from './pages/Session'
import Exam from './pages/Exam'
import Exams from './pages/Exams'
import Progress from './pages/Progress'
import Summary from './pages/Summary'
import Config from './pages/Config'
import Import from './pages/Import'
import Parent from './pages/Parent'

export default function App() {
  const { theme, toggle } = useTheme()
  const [ready, setReady] = useState(false)
  const { pathname } = useLocation()
  // Session et examen blanc : mode focus, sans navigation (IDENTITE.md).
  const focusMode = pathname === '/session' || pathname === '/examen'
  // Largeur par route : la session reste étroite partout (le focus est une
  // feature) ; le dashboard parent s'étale sur PC ; le reste respire sur md+.
  const width = focusMode
    ? 'max-w-md'
    : pathname === '/parent'
      ? 'max-w-md md:max-w-2xl lg:max-w-4xl'
      : 'max-w-md md:max-w-2xl'

  useEffect(() => {
    void initRepo().then(() => setReady(true))
  }, [])

  return (
    <div
      className={`min-h-dvh bg-ink-50 text-ink-900 dark:bg-ink-900 dark:text-ink-100 ${focusMode ? '' : 'lg:pl-44'}`}
    >
      <div
        className={`mx-auto flex min-h-dvh flex-col px-4 py-4 ${width} ${focusMode ? '' : 'pb-20 lg:pb-4'}`}
      >
        <header className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="font-display text-2xl font-extrabold tracking-tight text-action-700 dark:text-action-400"
          >
            Klaar!
          </Link>
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            className="rounded-full p-2 text-ink-500 hover:bg-ink-200 hover:text-ink-700 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-200"
          >
            {theme === 'dark' ? <Sun size={20} aria-hidden /> : <Moon size={20} aria-hidden />}
          </button>
        </header>
        <main className="flex flex-1 flex-col">
          {ready ? (
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/session" element={<Session />} />
              <Route path="/examen" element={<Exam />} />
              <Route path="/examens" element={<Exams />} />
              <Route path="/progres" element={<Progress />} />
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
      {ready && !focusMode && <TabBar />}
    </div>
  )
}
