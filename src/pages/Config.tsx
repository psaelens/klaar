import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '../lib/supabase'

/**
 * Configuration de la synchronisation : connexion à un compte existant ou
 * création du foyer (compte parent + compte élève) la première fois.
 * En l'absence de variables d'env Supabase, l'app reste en mode local.
 */

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'
const buttonClass =
  'w-full rounded-2xl bg-teal-600 px-6 py-3 font-bold text-white transition hover:bg-teal-700 active:scale-95 disabled:opacity-50'

/** Email élève suggéré par plus-addressing depuis l'email parent (x@y → x+klaar@y). */
function suggestChildEmail(parentEmail: string): string {
  const at = parentEmail.indexOf('@')
  if (at <= 0) return ''
  return `${parentEmail.slice(0, at)}+klaar${parentEmail.slice(at)}`
}

interface ProfileInfo {
  display_name: string
  role: string
}

export default function Config() {
  const [mode, setMode] = useState<'status' | 'login' | 'setup'>('status')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileInfo | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // Formulaire connexion
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Formulaire création du foyer
  const [parentEmail, setParentEmail] = useState('')
  const [parentPassword, setParentPassword] = useState('')
  const [childName, setChildName] = useState('')
  const [childEmail, setChildEmail] = useState('')
  const [childPin, setChildPin] = useState('')

  useEffect(() => {
    const sb = supabase
    if (sb === null) return
    void sb.auth.getSession().then(async ({ data: { session } }) => {
      if (session === null) return
      setUserEmail(session.user.email ?? session.user.id)
      const { data } = await sb
        .from('profiles')
        .select('display_name, role')
        .eq('id', session.user.id)
        .single()
      if (data !== null) setProfile(data)
    })
  }, [])

  if (supabase === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-xl font-bold">Synchronisation</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Ce déploiement n'a pas de synchronisation configurée : tes révisions sont enregistrées sur cet
          appareil uniquement (mode local).
        </p>
        <Link to="/" className="font-semibold text-teal-700 underline dark:text-teal-400">
          Retour à l'accueil
        </Link>
      </div>
    )
  }
  const client = supabase

  async function handleLogin() {
    setBusy(true)
    setMessage(null)
    const { error } = await client.auth.signInWithPassword({ email, password })
    if (error !== null) {
      setMessage(`Connexion impossible : ${error.message}`)
      setBusy(false)
      return
    }
    // Recharge complète : initRepo refait la migration/le pull proprement.
    window.location.href = '/'
  }

  async function handleSetup() {
    setBusy(true)
    setMessage(null)

    const fail = (step: string, detail: string) => {
      setMessage(`${step} : ${detail}`)
      setBusy(false)
    }

    // 1. Compte parent
    const { data: parentData, error: parentErr } = await client.auth.signUp({
      email: parentEmail,
      password: parentPassword,
    })
    if (parentErr !== null) return fail('Création du compte parent', parentErr.message)
    if (parentData.session === null)
      return fail(
        'Création du compte parent',
        "une confirmation par email est exigée par le serveur — confirme l'email parent puis utilise « Se connecter », ou désactive la confirmation d'email dans Supabase.",
      )

    // 2. Foyer + profil parent (RPC atomique)
    const { data: householdId, error: hhErr } = await client.rpc('create_household_with_profile', {
      household_name: `Foyer ${childName}`,
      my_role: 'parent',
      my_display_name: 'Parent',
    })
    if (hhErr !== null) return fail('Création du foyer', hhErr.message)

    // 3. Compte élève (la session de cet appareil devient celle de l'élève)
    const { data: childData, error: childErr } = await client.auth.signUp({
      email: childEmail,
      password: childPin,
    })
    if (childErr !== null) return fail('Création du compte élève', childErr.message)
    if (childData.session === null || childData.user === null)
      return fail('Création du compte élève', 'pas de session retournée (confirmation email exigée ?)')

    // 4. Profil élève dans le foyer
    const { error: profileErr } = await client.from('profiles').insert({
      id: childData.user.id,
      household_id: householdId,
      role: 'child',
      display_name: childName,
    })
    if (profileErr !== null) return fail('Profil élève', profileErr.message)

    window.location.href = '/'
  }

  async function handleLogout() {
    setBusy(true)
    await client.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-xl font-bold">Synchronisation</h1>

      {userEmail !== null ? (
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <p>
            Connecté : <span className="font-semibold">{profile?.display_name ?? userEmail}</span>
            {profile !== null && (
              <span className="ml-2 rounded-full bg-teal-100 px-3 py-0.5 text-sm text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                {profile.role === 'parent' ? 'Parent' : 'Élève'}
              </span>
            )}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Les révisions se synchronisent automatiquement entre les appareils.
          </p>
          {profile?.role === 'parent' && (
            <Link
              to="/import"
              className="w-full rounded-2xl border-2 border-teal-600 px-6 py-3 text-center font-bold text-teal-700 transition hover:bg-teal-50 active:scale-95 dark:text-teal-400 dark:hover:bg-slate-800"
            >
              Importer du vocabulaire
            </Link>
          )}
          <button type="button" onClick={handleLogout} disabled={busy} className={buttonClass}>
            Se déconnecter
          </button>
        </div>
      ) : mode === 'status' ? (
        <div className="flex flex-col gap-3">
          <p className="text-slate-600 dark:text-slate-400">
            Pas encore connecté : les révisions restent sur cet appareil. Connecte-toi pour les retrouver
            partout.
          </p>
          <button type="button" onClick={() => setMode('login')} className={buttonClass}>
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => setMode('setup')}
            className="w-full rounded-2xl border-2 border-teal-600 px-6 py-3 font-bold text-teal-700 transition hover:bg-teal-50 active:scale-95 dark:text-teal-400 dark:hover:bg-slate-800"
          >
            Première fois : créer le foyer
          </button>
        </div>
      ) : mode === 'login' ? (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            void handleLogin()
          }}
        >
          <input
            type="email"
            required
            placeholder="Email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            required
            placeholder="Mot de passe ou code"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <button type="submit" disabled={busy} className={buttonClass}>
            {busy ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            void handleSetup()
          }}
        >
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Crée en une fois le compte parent et le compte de l'élève. Cet appareil restera connecté en tant
            qu'élève.
          </p>
          <input
            type="email"
            required
            placeholder="Email du parent"
            value={parentEmail}
            onChange={(e) => {
              setParentEmail(e.target.value)
              setChildEmail(suggestChildEmail(e.target.value))
            }}
            className={inputClass}
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Mot de passe du parent (8 caractères min)"
            autoComplete="new-password"
            value={parentPassword}
            onChange={(e) => setParentPassword(e.target.value)}
            className={inputClass}
          />
          <input
            type="text"
            required
            placeholder="Prénom de l'élève"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            className={inputClass}
          />
          <input
            type="email"
            required
            placeholder="Email de l'élève (suggéré automatiquement)"
            value={childEmail}
            onChange={(e) => setChildEmail(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Code de l'élève (6 caractères min)"
            autoComplete="new-password"
            value={childPin}
            onChange={(e) => setChildPin(e.target.value)}
            className={inputClass}
          />
          <button type="submit" disabled={busy} className={buttonClass}>
            {busy ? 'Création…' : 'Créer le foyer'}
          </button>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Note l'email et le code de l'élève : ils servent à le connecter sur ses autres appareils.
          </p>
        </form>
      )}

      {message !== null && (
        <p className="rounded-xl bg-amber-100 p-3 text-sm text-amber-900 dark:bg-amber-900 dark:text-amber-100">
          {message}
        </p>
      )}

      {userEmail === null && mode !== 'status' && (
        <button
          type="button"
          onClick={() => {
            setMode('status')
            setMessage(null)
          }}
          className="text-sm text-slate-400 underline"
        >
          Retour
        </button>
      )}

      <Link to="/" className="text-center text-sm text-slate-400 underline">
        Retour à l'accueil
      </Link>
    </div>
  )
}
