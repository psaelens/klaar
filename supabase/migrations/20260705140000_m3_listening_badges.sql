-- M3 : compréhension orale + badges.
-- * content_items.question : question de compréhension (FR) posée sur l'item —
--   utilisée par les items `listening` (front = transcript NL lu en TTS).
-- * sessions.module : la modalité `listening` devient valide.
-- * badges : gamification PRD §7/§8 — append-only par le propriétaire,
--   lecture par le parent du foyer, un badge unique par code et par élève.

alter table public.content_items
  add column question text;

alter table public.sessions
  drop constraint if exists sessions_module_check;
alter table public.sessions
  add constraint sessions_module_check
  check (module is null or module in ('vocab', 'grammar', 'listening'));

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_code text not null,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_code)
);

create index badges_user_idx on public.badges (user_id);

-- Pas d'update/delete : un badge gagné ne se reprend pas (append-only).
grant select, insert on public.badges to authenticated;
grant select, insert, update, delete on public.badges to service_role;

alter table public.badges enable row level security;

create policy "badges_select_own_or_parent" on public.badges
  for select using (user_id = auth.uid() or public.is_parent_of(user_id));
create policy "badges_insert_own" on public.badges
  for insert with check (user_id = auth.uid());
