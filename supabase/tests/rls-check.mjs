/**
 * Vérification des politiques RLS contre le stack Supabase LOCAL.
 * Prérequis : `npx supabase start` (Docker). Lancer : `node supabase/tests/rls-check.mjs`
 * Crée des utilisateurs jetables (préfixe rls-check-) puis les supprime.
 */
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '../../src/data')
const seedCount =
  JSON.parse(readFileSync(join(dataDir, 'vocab.json'), 'utf-8')).length +
  JSON.parse(readFileSync(join(dataDir, 'grammar.json'), 'utf-8')).length +
  JSON.parse(readFileSync(join(dataDir, 'listening.json'), 'utf-8')).length +
  JSON.parse(readFileSync(join(dataDir, 'writing.json'), 'utf-8')).length +
  JSON.parse(readFileSync(join(dataDir, 'speaking.json'), 'utf-8')).length

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
  coparent: { email: `rls-check-coparent-${suffix}@test.local`, password: 'motdepasse-coparent' },
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
const coparent = client()
await coparent.auth.signInWithPassword(users.coparent)
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

  // --- Co-parent : rejoint le foyer via son id (lien d'invitation)
  const { error: coErr } = await coparent
    .from('profiles')
    .insert({ id: users.coparent.id, household_id: hh.id, role: 'parent', display_name: 'Maman' })
  check("co-parent rejoint le foyer via l'id d'invitation", !coErr, coErr?.message)

  const { data: coHh } = await coparent.from('households').select('id').eq('id', hh.id)
  check('co-parent voit le foyer une fois membre', coHh?.length === 1)

  await stranger.rpc('create_household_with_profile', {
    household_name: 'Autre foyer',
    my_role: 'child',
    my_display_name: 'Autre élève',
  })

  // --- Contenu
  const { data: contentChild } = await child.from('content_items').select('id')
  check(
    `enfant lit le contenu global de départ (${seedCount} items)`,
    contentChild?.length === seedCount,
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

  // --- Badges (append-only)
  const { error: badgeErr } = await child
    .from('badges')
    .insert({ user_id: users.child.id, badge_code: 'first-session' })
  check('enfant enregistre son badge', !badgeErr, badgeErr?.message)

  const { data: badgeParent } = await parent.from('badges').select('*').eq('user_id', users.child.id)
  check("parent lit les badges de l'enfant", badgeParent?.length === 1)

  const { data: badgeStranger } = await stranger.from('badges').select('*').eq('user_id', users.child.id)
  check("l'autre foyer ne lit PAS les badges de l'enfant", badgeStranger?.length === 0)

  const { data: badgeSpoof, error: badgeSpoofErr } = await child
    .from('badges')
    .insert({ user_id: users.parent.id, badge_code: 'triche' })
    .select()
  check(
    "enfant ne peut PAS attribuer un badge à quelqu'un d'autre",
    badgeSpoofErr !== null || badgeSpoof?.length === 0,
  )

  const { data: badgeUpd, error: badgeUpdErr } = await child
    .from('badges')
    .update({ badge_code: 'autre' })
    .eq('user_id', users.child.id)
    .select()
  check(
    'enfant ne peut PAS modifier un badge gagné (append-only)',
    badgeUpdErr !== null || badgeUpd?.length === 0,
  )

  // --- Examens blancs (append-only)
  const { error: examErr } = await child.from('mock_exams').insert({
    user_id: users.child.id,
    exam_type: 'ecrit',
    exam_id: 'blanc-ecrit-01',
    score: 42,
    max_score: 70,
  })
  check('enfant enregistre son examen blanc', !examErr, examErr?.message)

  const { data: examParent } = await parent.from('mock_exams').select('*').eq('user_id', users.child.id)
  check("parent lit les examens blancs de l'enfant", examParent?.length === 1)

  const { data: examStranger } = await stranger.from('mock_exams').select('*').eq('user_id', users.child.id)
  check("l'autre foyer ne lit PAS les examens blancs", examStranger?.length === 0)

  const { data: examUpd, error: examUpdErr } = await child
    .from('mock_exams')
    .update({ score: 70 })
    .eq('user_id', users.child.id)
    .select()
  check(
    'enfant ne peut PAS réécrire un examen passé (append-only)',
    examUpdErr !== null || examUpd?.length === 0,
  )

  // --- Lecture du suivi par le co-parent (mêmes droits que le parent)
  const { data: coSessions } = await coparent.from('sessions').select('*').eq('user_id', users.child.id)
  check("co-parent lit les sessions de l'enfant", coSessions?.length === 1)

  const { data: coBadges } = await coparent.from('badges').select('*').eq('user_id', users.child.id)
  check("co-parent lit les badges de l'enfant", coBadges?.length === 1)

  const { data: coExams } = await coparent.from('mock_exams').select('*').eq('user_id', users.child.id)
  check("co-parent lit les examens blancs de l'enfant", coExams?.length === 1)

  const { error: coSrsErr } = await coparent
    .from('srs_state')
    .update({ repetitions: 99 })
    .eq('user_id', users.child.id)
    .select()
    .then(({ data, error }) => ({ error: error ?? (data?.length === 0 ? new Error('0 ligne') : null) }))
  check("co-parent ne peut PAS modifier l'état SRS de l'enfant", coSrsErr !== null)

  // --- Enregistrements oraux (Storage, bucket privé `recordings`)
  const audio = new Blob([new Uint8Array(64)], { type: 'audio/webm' })
  const recPath = `${users.child.id}/rls-check-${suffix}.webm`
  const { error: recErr } = await child.storage.from('recordings').upload(recPath, audio)
  check('enfant dépose un enregistrement dans SON dossier', !recErr, recErr?.message)

  const { error: recSpoofErr } = await child.storage
    .from('recordings')
    .upload(`${users.parent.id}/rls-check-${suffix}.webm`, audio)
  check("enfant ne peut PAS déposer dans le dossier d'un autre", recSpoofErr !== null)

  const { data: recParent, error: recParentErr } = await parent.storage.from('recordings').download(recPath)
  check(
    "parent écoute l'enregistrement de l'enfant (créneau hebdo)",
    !recParentErr && recParent !== null,
    recParentErr?.message,
  )

  const { data: recCoparent, error: recCoErr } = await coparent.storage.from('recordings').download(recPath)
  check("co-parent écoute l'enregistrement de l'enfant", !recCoErr && recCoparent !== null, recCoErr?.message)

  const { error: recStrangerErr } = await stranger.storage.from('recordings').download(recPath)
  check("l'autre foyer ne peut PAS écouter l'enregistrement", recStrangerErr !== null)

  const { error: recParentDelErr } = await parent.storage.from('recordings').remove([recPath])
  const { data: stillThere } = await child.storage.from('recordings').download(recPath)
  check(
    "parent ne peut PAS supprimer l'enregistrement de l'enfant",
    (recParentDelErr !== null || stillThere !== null) && stillThere !== null,
  )

  const { error: recDelErr } = await child.storage.from('recordings').remove([recPath])
  check('enfant supprime son enregistrement (rétention)', !recDelErr, recDelErr?.message)
} finally {
  // --- Nettoyage
  await admin.storage
    .from('recordings')
    .remove([`${users.child.id}/rls-check-${suffix}.webm`, `${users.parent.id}/rls-check-${suffix}.webm`])
  for (const u of Object.values(users)) {
    await admin.auth.admin.deleteUser(u.id)
  }
  await admin.from('content_items').delete().eq('id', `test-${suffix}`)
}

console.log(failures === 0 ? '\nRLS : tout est conforme.' : `\nRLS : ${failures} ÉCHEC(S).`)
process.exit(failures === 0 ? 0 : 1)
