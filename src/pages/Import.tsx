import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { supabase } from '../lib/supabase'
import { parseVocabLines } from '../lib/importParse'

/**
 * Import de contenu (PRD §10) — réservé au parent connecté. Le contenu importé
 * appartient au foyer et apparaît chez l'élève au prochain démarrage de l'app.
 * M1 : collage de texte « nl ; fr » ligne par ligne. L'import photo (OCR) viendra plus tard.
 */

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'

type Gate = 'loading' | 'not-configured' | 'not-parent' | 'ready'

export default function Import() {
  const [gate, setGate] = useState<Gate>('loading')
  const [householdId, setHouseholdId] = useState<string | null>(null)

  const [text, setText] = useState('')
  const [theme, setTheme] = useState('')
  const [unit, setUnit] = useState('')
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(1)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<number | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

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
      const { data } = await sb
        .from('profiles')
        .select('role, household_id')
        .eq('id', session.user.id)
        .single()
      if (data === null || data.role !== 'parent') {
        setGate('not-parent')
        return
      }
      setHouseholdId(data.household_id)
      setGate('ready')
    })
  }, [])

  const { items, errors } = parseVocabLines(text)

  async function handleImport() {
    if (supabase === null || householdId === null || theme.trim() === '') return
    setBusy(true)
    setImportError(null)
    const rows = items.map((item) => ({
      id: `imp-${crypto.randomUUID()}`,
      household_id: householdId,
      type: 'vocab' as const,
      theme: theme.trim(),
      front: item.front,
      back: item.back,
      difficulty,
      curriculum_unit: unit.trim() === '' ? null : unit.trim(),
    }))
    const { error } = await supabase.from('content_items').insert(rows)
    if (error !== null) {
      setImportError(`Import impossible : ${error.message}`)
      setBusy(false)
      return
    }
    setDone(rows.length)
    setText('')
    setBusy(false)
  }

  if (gate === 'loading') {
    return <p className="animate-pulse text-center text-slate-400">Chargement…</p>
  }

  if (gate === 'not-configured' || gate === 'not-parent') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-xl font-bold">Importer du contenu</h1>
        <p className="text-slate-600 dark:text-slate-400">
          {gate === 'not-configured'
            ? "La synchronisation n'est pas configurée sur ce déploiement."
            : "L'import de contenu est réservé au compte parent (connecte-toi via ⚙️)."}
        </p>
        <Link to="/" className="font-semibold text-teal-700 underline dark:text-teal-400">
          Retour à l'accueil
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="text-xl font-bold">Importer du vocabulaire</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Une ligne par mot : <code className="font-mono">mot néerlandais ; traduction française</code>
      </p>

      <textarea
        rows={8}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setDone(null)
        }}
        placeholder={'de fiets ; le vélo\nhet huis ; la maison'}
        className={`${inputClass} min-h-40 font-mono text-sm`}
      />

      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          required
          placeholder="Thème (ex. Unité 5)"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className={inputClass}
        />
        <input
          type="text"
          placeholder="Unité du programme (optionnel)"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className={inputClass}
        />
      </div>

      <label className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
        Difficulté
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(Number(e.target.value) as 1 | 2 | 3)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
        >
          <option value={1}>1 — facile</option>
          <option value={2}>2 — moyen</option>
          <option value={3}>3 — difficile</option>
        </select>
      </label>

      {errors.length > 0 && (
        <ul className="rounded-xl bg-amber-100 p-3 text-sm text-amber-900 dark:bg-amber-900 dark:text-amber-100">
          {errors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <p className="mb-2 text-sm font-semibold">{items.length} mot(s) prêt(s) à importer :</p>
          <ul className="max-h-48 overflow-y-auto text-sm">
            {items.map((item) => (
              <li
                key={item.front}
                className="flex justify-between gap-2 border-b border-slate-100 py-1 last:border-0 dark:border-slate-700"
              >
                <span lang="nl" className="font-semibold">
                  {item.front}
                </span>
                <span className="text-slate-500 dark:text-slate-400">{item.back}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        disabled={busy || items.length === 0 || theme.trim() === ''}
        onClick={() => void handleImport()}
        className="rounded-2xl bg-teal-600 px-6 py-3 font-bold text-white transition hover:bg-teal-700 active:scale-95 disabled:opacity-50"
      >
        {busy
          ? 'Import…'
          : theme.trim() === ''
            ? 'Indique un thème pour importer'
            : `Importer ${items.length} mot(s)`}
      </button>

      {done !== null && (
        <p className="rounded-xl bg-teal-100 p-3 text-sm text-teal-900 dark:bg-teal-900 dark:text-teal-100">
          {done} mot(s) importé(s) ! L'élève les verra à sa prochaine ouverture de l'app.
        </p>
      )}
      {importError !== null && (
        <p className="rounded-xl bg-amber-100 p-3 text-sm text-amber-900 dark:bg-amber-900 dark:text-amber-100">
          {importError}
        </p>
      )}

      <Link to="/" className="text-center text-sm text-slate-400 underline">
        Retour à l'accueil
      </Link>
    </div>
  )
}
