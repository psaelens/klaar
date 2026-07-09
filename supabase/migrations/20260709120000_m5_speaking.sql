-- M5 : expression orale.
-- * sessions.module : la modalité `speaking` devient valide (le type de
--   contenu `speaking` est déjà dans la contrainte depuis M4).
-- * bucket privé `recordings` : enregistrements de l'élève, un objet par
--   prise au chemin {user_id}/{horodatage}-{item}.webm. L'élève écrit, lit
--   et supprime dans SON dossier (la suppression sert à la rétention côté
--   client, voir DECISIONS.md) ; le parent du foyer écoute (PRD §13 :
--   créneau hebdomadaire) ; personne d'autre. Taille plafonnée et types MIME
--   audio uniquement pour protéger le quota de stockage.

alter table public.sessions
  drop constraint sessions_module_check;
alter table public.sessions
  add constraint sessions_module_check
  check (module is null or module in ('vocab', 'grammar', 'listening', 'writing', 'speaking'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recordings',
  'recordings',
  false,
  10485760, -- 10 Mo : très large pour ~2 min d'audio webm/opus
  array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg']
)
on conflict (id) do nothing;

create policy "recordings_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "recordings_select_own_or_parent" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'recordings'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_parent_of(((storage.foldername(name))[1])::uuid)
    )
  );

create policy "recordings_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
