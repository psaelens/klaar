-- M6 : examens blancs chronométrés (PRD §7 : table mock_exams ; §8 : boss battles).
-- * mock_exams : résultat d'une épreuve blanche — append-only par le
--   propriétaire, lecture par le parent du foyer (même modèle que sessions).
--   details : cotation par section (jsonb, calculée côté client par
--   auto-correction — pas de juge automatique, PRD §13).
-- * sessions.module : la valeur `exam` devient valide — un examen blanc
--   enregistre aussi une session pour compter dans les minutes du streak,
--   sans polluer les taux par modalité (le dashboard n'agrège que les 5
--   modalités d'entraînement).

create table public.mock_exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  exam_type text not null check (exam_type in ('ecrit', 'oral')),
  exam_id text not null,
  score real not null,
  max_score real not null,
  taken_at timestamptz not null default now(),
  duration_seconds integer,
  details jsonb
);

create index mock_exams_user_idx on public.mock_exams (user_id, taken_at);

grant select, insert on public.mock_exams to authenticated;
grant select, insert, update, delete on public.mock_exams to service_role;

alter table public.mock_exams enable row level security;

create policy "mock_exams_select_own_or_parent" on public.mock_exams
  for select using (user_id = auth.uid() or public.is_parent_of(user_id));
create policy "mock_exams_insert_own" on public.mock_exams
  for insert with check (user_id = auth.uid());

alter table public.sessions
  drop constraint sessions_module_check;
alter table public.sessions
  add constraint sessions_module_check
  check (module is null or module in ('vocab', 'grammar', 'listening', 'writing', 'speaking', 'exam'));
