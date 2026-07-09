import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router'
import { FlaskConical, Moon, Smartphone, Sun, UserRound } from 'lucide-react'
import { useTheme } from './hooks/useTheme'
import { getProfile, initRepo, isConnected, syncConfigured } from './lib/repo'
import { applyDisplayPrefs, loadDemoMode, loadDisplayPrefs } from './lib/storage'
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

/**
 * Pastille utilisateur de l'en-tête : qui est connecté (ou Démo/Local), lien
 * vers le profil. Rien pour un visiteur qui n'a pas encore choisi.
 */
function UserChip() {
  const chipClass =
    'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-ink-600 ring-1 ring-ink-200 transition hover:bg-ink-100 dark:text-ink-300 dark:ring-ink-700 dark:hover:bg-ink-800'
  if (isConnected()) {
    const profile = getProfile()
    return (
      <Link to="/config" className={chipClass} title="Mon profil">
        <UserRound size={15} aria-hidden />
        {profile?.displayName ?? 'Connecté'}
      </Link>
    )
  }
  if (!syncConfigured()) {
    return (
      <Link to="/config" className={chipClass} title="Données locales à cet appareil">
        <Smartphone size={15} aria-hidden />
        Local
      </Link>
    )
  }
  if (loadDemoMode()) {
    return (
      <Link to="/config" className={chipClass} title="Mode démo — se connecter">
        <FlaskConical size={15} aria-hidden />
        Démo
      </Link>
    )
  }
  return null
}

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

  // Re-rendu quand le mode démo change (choix sur l'accueil, remise à zéro).
  const [, setIdentityTick] = useState(0)
  useEffect(() => {
    const bump = () => setIdentityTick((n) => n + 1)
    window.addEventListener('klaar:identity', bump)
    return () => window.removeEventListener('klaar:identity', bump)
  }, [])

  useEffect(() => {
    applyDisplayPrefs(loadDisplayPrefs())
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
          <Link to="/" className="font-display text-2xl font-extrabold tracking-tight">
            Klaar<span className="text-action-600 dark:text-action-400">!</span>
          </Link>
          <div className="flex items-center gap-2">
            {ready && <UserChip />}
            <button
              type="button"
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
              className="rounded-full p-2 text-ink-500 hover:bg-ink-200 hover:text-ink-700 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-200"
            >
              {theme === 'dark' ? <Sun size={20} aria-hidden /> : <Moon size={20} aria-hidden />}
            </button>
          </div>
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
              <p className="animate-pulse font-display text-2xl font-extrabold">
                Klaar<span className="text-action-600 dark:text-action-400">!</span>
              </p>
            </div>
          )}
        </main>
      </div>
      {ready && !focusMode && <TabBar />}
    </div>
  )
}
