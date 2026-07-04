/**
 * Vérification des politiques RLS contre le stack Supabase LOCAL.
 * Prérequis : `npx supabase start` (Docker). Lancer : `node supabase/tests/rls-check.mjs`
 * Crée des utilisateurs jetables (préfixe rls-check-) puis les supprime.
 */
import { execSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

const status = JSON.parse(execSync('npx supabase status -o json', { encoding: 'utf-8' }))
const URL = status.API_URL
const ANON = status.ANON_KEY
const SERVICE = status.SERVICE_ROLE_KEY

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } })

let failures = 0
function check(label, ok, detail = '') {
  console.log(`${ok ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures += 1
}

function client() {
  return createClient(URL, ANON, { auth: { persistSession: false } })
}

const suffix = Date.now()
const users = {
  parent: { email: `rls-check-parent-${suffix}@test.local`, password: 'motdepasse-parent' },
  child: { email: `rls-check-child-${suffix}@test.local`, password: '123456' },
  stranger: { email: `rls-check-stranger-${suffix}@test.local`, password: 'autre-foyer' },
}

// --- Création des utilisateurs de test
for (const u of Object.values(users)) {
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
  })
  if (error) throw new Error(`createUser ${u.email}: ${error.message}`)
  u.id = data.user.id
}

const parent = client()
await parent.auth.signInWithPassword(users.parent)
const child = client()
await child.auth.signInWithPassword(users.child)
const stranger = client()
await stranger.auth.signInWithPassword(users.stranger)

try {
  // --- Mise en place foyer + profils (RPC atomique pour le créateur)
  const { data: hhId, error: hhErr } = await parent.rpc('create_household_with_profile', {
    household_name: 'Foyer test',
    my_role: 'parent',
    my_display_name: 'Parent',
  })
  check('parent crée un foyer + son profil (RPC)', !hhErr && typeof hhId === 'string', hhErr?.message)
  const hh = { id: hhId }

  const { error: twiceErr } = await parent.rpc('create_household_with_profile', {
    household_name: 'Doublon',
    my_role: 'parent',
    my_display_name: 'Parent',
  })
  check('la RPC refuse un second profil pour le même utilisateur', twiceErr !== null)

  const { error: cpErr } = await child
    .from('profiles')
    .insert({ id: users.child.id, household_id: hh.id, role: 'child', display_name: 'Élève' })
  check('enfant crée son profil dans le foyer', !cpErr, cpErr?.message)

  const { error: spoofErr } = await child
    .from('profiles')
    .insert({ id: users.stranger.id, household_id: hh.id, role: 'child', display_name: 'Usurpé' })
  check('enfant ne peut PAS créer un profil pour un autre utilisateur', spoofErr !== null)

  await stranger.rpc('create_household_with_profile', {
    household_name: 'Autre foyer',
    my_role: 'child',
    my_display_name: 'Autre élève',
  })

  // --- Contenu
  const { data: contentChild } = await child.from('content_items').select('id')
  check(
    'enfant lit le contenu global de départ (64 items)',
    contentChild?.length === 64,
    `${contentChild?.length} lignes`,
  )

  const { error: childContentErr } = await child
    .from('content_items')
    .insert({ id: `test-${suffix}`, household_id: hh.id, type: 'vocab', theme: 't', front: 'f', back: 'b' })
  check('enfant ne peut PAS importer de contenu', childContentErr !== null)

  const { error: parentContentErr } = await parent
    .from('content_items')
    .insert({ id: `test-${suffix}`, household_id: hh.id, type: 'vocab', theme: 't', front: 'f', back: 'b' })
  check('parent importe du contenu pour son foyer', !parentContentErr, parentContentErr?.message)

  const { data: strangerContent } = await stranger
    .from('content_items')
    .select('id')
    .eq('id', `test-${suffix}`)
  check("l'autre foyer ne voit PAS ce contenu", strangerContent?.length === 0)

  // --- SRS
  const srsRow = {
    user_id: users.child.id,
    content_item_id: 'school-01',
    next_review_at: new Date().toISOString(),
  }
  const { error: srsErr } = await child.from('srs_state').insert(srsRow)
  check('enfant écrit son état SRS', !srsErr, srsErr?.message)

  const { error: srsSpoofErr } = await parent.from('srs_state').insert({ ...srsRow, user_id: users.child.id })
  check("parent ne peut PAS écrire l'état SRS de l'enfant", srsSpoofErr !== null)

  const { data: srsParent } = await parent.from('srs_state').select('*').eq('user_id', users.child.id)
  check("parent lit l'état SRS de l'enfant (dashboard)", srsParent?.length === 1)

  const { data: srsStranger } = await stranger.from('srs_state').select('*').eq('user_id', users.child.id)
  check("l'autre foyer ne lit PAS l'état SRS de l'enfant", srsStranger?.length === 0)

  const { data: updData } = await parent
    .from('srs_state')
    .update({ repetitions: 99 })
    .eq('user_id', users.child.id)
    .select()
  check("parent ne peut PAS modifier l'état SRS de l'enfant", updData?.length === 0)

  // --- Sessions & XP (append-only)
  const session = {
    user_id: users.child.id,
    finished_at: new Date().toISOString(),
    cards_reviewed: 8,
    correct_first_try: 7,
    lapsed: 1,
    duration_seconds: 120,
    xp_earned: 100,
  }
  const { data: sessData, error: sessErr } = await child.from('sessions').insert(session).select().single()
  check('enfant enregistre sa session', !sessErr, sessErr?.message)

  const { data: sessUpd, error: sessUpdErr } = await child
    .from('sessions')
    .update({ xp_earned: 9999 })
    .eq('id', sessData.id)
    .select()
  check(
    'enfant ne peut PAS réécrire une session passée (append-only)',
    sessUpdErr !== null || sessUpd?.length === 0,
  )

  const { error: xpErr } = await child
    .from('xp_ledger')
    .insert({ user_id: users.child.id, amount: 100, reason: 'test' })
  check('enfant enregistre son XP', !xpErr, xpErr?.message)

  const { data: xpParent } = await parent.from('xp_ledger').select('*').eq('user_id', users.child.id)
  check("parent lit l'XP de l'enfant", xpParent?.length === 1)

  const { data: xpSpoof, error: xpSpoofErr } = await child
    .from('xp_ledger')
    .insert({ user_id: users.parent.id, amount: 1000, reason: 'triche' })
    .select()
  check(
    "enfant ne peut PAS créditer de l'XP à quelqu'un d'autre",
    xpSpoofErr !== null || xpSpoof?.length === 0,
  )
} finally {
  // --- Nettoyage
  for (const u of Object.values(users)) {
    await admin.auth.admin.deleteUser(u.id)
  }
  await admin.from('content_items').delete().eq('id', `test-${suffix}`)
}

console.log(failures === 0 ? '\nRLS : tout est conforme.' : `\nRLS : ${failures} ÉCHEC(S).`)
process.exit(failures === 0 ? 0 : 1)
