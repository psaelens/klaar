-- Klaar! — schéma initial (M1), aligné sur le PRD §7.
-- RLS activée sur TOUTES les tables dès cette première migration (PRD Annexe A) :
--   * l'enfant ne lit/écrit que ses propres données ;
--   * le parent lit les données de son foyer mais ne modifie jamais les réponses ;
--   * le contenu pédagogique global (household_id null) est lisible par tous les
--     utilisateurs authentifiés, le contenu du foyer uniquement par ses membres.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  household_id uuid not null references public.households (id) on delete cascade,
  role text not null check (role in ('parent', 'child')),
  display_name text not null,
  created_at timestamptz not null default now()
);

create table public.content_items (
  id text primary key,
  -- null = contenu de départ global, sinon contenu importé par un foyer
  household_id uuid references public.households (id) on delete cascade,
  type text not null check (
    type in ('vocab', 'grammar', 'listening', 'reading', 'writing_prompt', 'speaking_prompt')
  ),
  theme text not null,
  source_ref text,
  front text not null,
  back text not null,
  audio_url text,
  difficulty smallint not null default 1 check (difficulty between 1 and 3),
  curriculum_unit text,
  created_at timestamptz not null default now()
);

create table public.srs_state (
  user_id uuid not null references public.profiles (id) on delete cascade,
  content_item_id text not null references public.content_items (id) on delete cascade,
  ease_factor real not null default 2.5,
  interval_days integer not null default 0,
  repetitions integer not null default 0,
  lapses integer not null default 0,
  next_review_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, content_item_id)
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  finished_at timestamptz not null,
  cards_reviewed integer not null,
  correct_first_try integer not null,
  lapsed integer not null,
  duration_seconds integer,
  xp_earned integer
);

create table public.xp_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index srs_state_next_review_idx on public.srs_state (user_id, next_review_at);
create index sessions_user_idx on public.sessions (user_id, finished_at);
create index xp_ledger_user_idx on public.xp_ledger (user_id, created_at);
create index content_items_household_idx on public.content_items (household_id);

-- ---------------------------------------------------------------------------
-- Fonctions d'aide RLS (security definer pour éviter la récursion sur profiles)
-- ---------------------------------------------------------------------------

create function public.current_household_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id from profiles where id = auth.uid();
$$;

create function public.is_parent()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'parent'
  );
$$;

-- Le parent peut-il voir les données de cet utilisateur ? (même foyer)
create function public.is_parent_of(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_parent()
    and exists (
      select 1 from profiles
      where id = target_user
        and household_id = public.current_household_id()
    );
$$;

-- ---------------------------------------------------------------------------
-- Configuration du foyer : création atomique foyer + profil du créateur.
-- Nécessaire car la policy SELECT sur households ne rend un foyer visible
-- qu'aux membres — impossible de récupérer l'id via INSERT ... RETURNING
-- avant que le profil existe (œuf et poule du premier écran de config).
-- ---------------------------------------------------------------------------

create function public.create_household_with_profile(
  household_name text,
  my_role text,
  my_display_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if exists (select 1 from profiles where id = auth.uid()) then
    raise exception 'profile already exists';
  end if;
  insert into households (name) values (household_name) returning id into new_household;
  insert into profiles (id, household_id, role, display_name)
    values (auth.uid(), new_household, my_role, my_display_name);
  return new_household;
end;
$$;

revoke execute on function public.create_household_with_profile(text, text, text) from public, anon;
grant execute on function public.create_household_with_profile(text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Grants (les nouveaux défauts Supabase ne donnent plus de DML aux rôles API :
-- on accorde explicitement le strict nécessaire, les policies RLS affinent).
-- Pas de grant à anon : l'app exige une connexion. Pas d'update/delete sur les
-- tables append-only (sessions, xp_ledger) ni sur profiles/households.
-- ---------------------------------------------------------------------------

grant select, insert on public.households to authenticated;
grant select, insert on public.profiles to authenticated;
grant select, insert, update, delete on public.content_items to authenticated;
grant select, insert, update on public.srs_state to authenticated;
grant select, insert on public.sessions to authenticated;
grant select, insert on public.xp_ledger to authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.households enable row level security;
alter table public.profiles enable row level security;
alter table public.content_items enable row level security;
alter table public.srs_state enable row level security;
alter table public.sessions enable row level security;
alter table public.xp_ledger enable row level security;

-- households : visibles par leurs membres ; créables par tout utilisateur
-- authentifié (assistant de configuration du foyer).
create policy "households_select_member" on public.households
  for select using (id = public.current_household_id());
create policy "households_insert_authenticated" on public.households
  for insert to authenticated with check (true);

-- profiles : chacun crée et voit le sien ; les membres d'un foyer se voient.
create policy "profiles_select_household" on public.profiles
  for select using (id = auth.uid() or household_id = public.current_household_id());
create policy "profiles_insert_self" on public.profiles
  for insert with check (id = auth.uid());

-- content_items : contenu global (household_id null) lisible par tous les
-- authentifiés ; contenu de foyer lisible par ses membres ; seul le parent
-- importe/modifie le contenu de son foyer.
create policy "content_select" on public.content_items
  for select to authenticated
  using (household_id is null or household_id = public.current_household_id());
create policy "content_insert_parent" on public.content_items
  for insert with check (public.is_parent() and household_id = public.current_household_id());
create policy "content_update_parent" on public.content_items
  for update using (public.is_parent() and household_id = public.current_household_id());
create policy "content_delete_parent" on public.content_items
  for delete using (public.is_parent() and household_id = public.current_household_id());

-- srs_state : l'élève gère le sien ; le parent du foyer peut lire (dashboard)
-- mais jamais écrire (« pas modifier les réponses », PRD Annexe A).
create policy "srs_select_own_or_parent" on public.srs_state
  for select using (user_id = auth.uid() or public.is_parent_of(user_id));
create policy "srs_insert_own" on public.srs_state
  for insert with check (user_id = auth.uid());
create policy "srs_update_own" on public.srs_state
  for update using (user_id = auth.uid());

-- sessions : append-only par le propriétaire ; lecture par le parent du foyer.
create policy "sessions_select_own_or_parent" on public.sessions
  for select using (user_id = auth.uid() or public.is_parent_of(user_id));
create policy "sessions_insert_own" on public.sessions
  for insert with check (user_id = auth.uid());

-- xp_ledger : append-only par le propriétaire ; lecture par le parent du foyer.
create policy "xp_select_own_or_parent" on public.xp_ledger
  for select using (user_id = auth.uid() or public.is_parent_of(user_id));
create policy "xp_insert_own" on public.xp_ledger
  for insert with check (user_id = auth.uid());
