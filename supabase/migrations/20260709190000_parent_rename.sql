-- Un parent peut modifier son propre nom d'affichage (demande Pierre) :
-- utile car le wizard de création du foyer nomme le premier parent « Parent ».
-- Verrouillage en deux couches :
--   * grant UPDATE limité à la COLONNE display_name (pas de changement de
--     rôle ni de foyer possible, même pour sa propre ligne) ;
--   * policy limitée à SA ligne et au rôle parent (le prénom de l'élève est
--     fixé par le parent à la création, l'élève ne se renomme pas).

grant update (display_name) on public.profiles to authenticated;

create policy "profiles_update_own_name_parent" on public.profiles
  for update
  using (id = auth.uid() and role = 'parent')
  with check (id = auth.uid());
