// Régénère supabase/seed.sql depuis src/data/*.json (contenu de départ global).
// Usage : node supabase/generate-seed.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const items = [
  ...JSON.parse(readFileSync(join(root, 'src/data/vocab.json'), 'utf-8')),
  ...JSON.parse(readFileSync(join(root, 'src/data/grammar.json'), 'utf-8')),
  ...JSON.parse(readFileSync(join(root, 'src/data/listening.json'), 'utf-8')),
]

const q = (s) => (s === null || s === undefined ? 'null' : `'${String(s).replaceAll("'", "''")}'`)
const qJson = (v) => (v === null || v === undefined ? 'null' : `${q(JSON.stringify(v))}::jsonb`)

const rows = items.map(
  (it) =>
    `  (${q(it.id)}, null, ${q(it.type)}, ${q(it.theme)}, ${q(it.front)}, ${q(it.back)}, ${qJson(
      it.choices ?? null,
    )}, ${q(it.question ?? null)}, ${it.difficulty}, ${q(it.curriculum_unit)})`,
)

const sql = `-- Contenu de depart global — GENERE par supabase/generate-seed.mjs depuis
-- src/data/vocab.json, grammar.json et listening.json. Ne pas editer a la main.
insert into public.content_items (id, household_id, type, theme, front, back, choices, question, difficulty, curriculum_unit) values
${rows.join(',\n')}
on conflict (id) do update set
  type = excluded.type,
  theme = excluded.theme,
  front = excluded.front,
  back = excluded.back,
  choices = excluded.choices,
  question = excluded.question,
  difficulty = excluded.difficulty,
  curriculum_unit = excluded.curriculum_unit;
`

writeFileSync(join(root, 'supabase/seed.sql'), sql)
console.log(`seed.sql régénéré : ${items.length} items`)
