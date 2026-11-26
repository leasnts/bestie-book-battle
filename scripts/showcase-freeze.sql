-- =====================================================
-- Compte de lili figé : toujours la même lecture, recalée sur aujourd'hui
-- =====================================================
-- Chaque nuit à 00 h 01 (UTC), pg_cron remet les livres de lili dans l'état
-- photographié par showcase.snapshot(), toutes les dates décalées du nombre de
-- jours écoulés depuis la photo : série toujours allumée, toujours J-21, notes
-- toujours « d'hier ». Ce que lili change dans ces livres pendant la journée est
-- effacé la nuit ; un livre qu'elle ajoute en plus n'est pas touché.
--
-- Mise en place (une fois) :
--   1. python3 scripts/seed-demo-account.py  → exécuter le SQL produit
--   2. exécuter ce fichier
-- Pour changer la vitrine : modifier le seed, le relancer, puis
--   -- Pour arrêter le gel : select cron.unschedule('showcase-restore');
-- =====================================================

create extension if not exists pg_cron;

create schema if not exists showcase;
revoke all on schema showcase from public, anon, authenticated;

create table if not exists showcase.meta (snap_date date not null);

-- Photographie le livre modèle de lili, Fourth Wing ; ses autres livres sont réels et jamais touchés
create or replace function showcase.snapshot() returns void
language plpgsql set search_path = '' as $$
declare
  template constant uuid := '82d9ce6c-d7af-5d54-98b6-973b4e4cf9b7';  -- Fourth Wing
begin
  drop table if exists showcase.challenges, showcase.challenge_participants, showcase.user_progress,
    showcase.progress_history, showcase.challenge_goals, showcase.annotations,
    showcase.annotation_reactions, showcase.annotation_reads;

  create table showcase.challenges as select * from public.challenges where id = template;
  create table showcase.challenge_participants as
    select * from public.challenge_participants where challenge_id in (select id from showcase.challenges);
  create table showcase.user_progress as
    select * from public.user_progress where challenge_id in (select id from showcase.challenges);
  create table showcase.progress_history as
    select * from public.progress_history where challenge_id in (select id from showcase.challenges);
  create table showcase.challenge_goals as
    select * from public.challenge_goals where challenge_id in (select id from showcase.challenges);
  create table showcase.annotations as
    select * from public.annotations where challenge_id in (select id from showcase.challenges);
  create table showcase.annotation_reactions as
    select * from public.annotation_reactions where annotation_id in (select id from showcase.annotations);
  create table showcase.annotation_reads as
    select * from public.annotation_reads where annotation_id in (select id from showcase.annotations);

  delete from showcase.meta;
  insert into showcase.meta values (current_date);
end $$;

-- La liste des colonnes d'une table, dates décalées de `delta` jours
create or replace function showcase.shifted_cols(tbl text, delta int) returns text
language sql stable set search_path = '' as $$
  select string_agg(
    case
      when c.data_type = 'timestamp with time zone' then format('%I + make_interval(days => %s)', c.column_name, delta)
      when c.data_type = 'date' then format('%I + %s', c.column_name, delta)
      when c.udt_name = '_date' then format('array(select d + %s from unnest(%I) d)', delta, c.column_name)
      else quote_ident(c.column_name)
    end, ', ' order by c.ordinal_position)
  from information_schema.columns c
  -- Colonnes communes seulement : une colonne ajoutée après la photo garde sa valeur par défaut
  where c.table_schema = 'public' and c.table_name = tbl
    and exists (select 1 from information_schema.columns s
                where s.table_schema = 'showcase' and s.table_name = tbl and s.column_name = c.column_name);
$$;

create or replace function showcase.restore() returns void
language plpgsql set search_path = '' as $$
declare
  delta int := current_date - (select snap_date from showcase.meta);
  t text;
  cols text;
begin
  -- Les couleurs de couverture calculées par l'app depuis la photo : on les garde
  update showcase.challenges s set cover_palette = c.cover_palette
  from public.challenges c
  where c.id = s.id and s.cover_palette is null and c.cover_palette is not null;

  -- Cascade normale (triggers actifs) : participants, progression, notes…
  delete from public.challenges where id in (select id from showcase.challenges);

  -- SET et pas set_config() : Supabase n'autorise ce réglage que par une instruction SET
  set local session_replication_role = replica;
  foreach t in array array['challenges', 'challenge_participants', 'user_progress', 'progress_history',
                           'challenge_goals', 'annotations', 'annotation_reactions', 'annotation_reads'] loop
    select string_agg(quote_ident(c.column_name), ', ' order by c.ordinal_position) into cols
    from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = t
      and exists (select 1 from information_schema.columns s
                  where s.table_schema = 'showcase' and s.table_name = t and s.column_name = c.column_name);
    execute format('insert into public.%I (%s) select %s from showcase.%I', t, cols, showcase.shifted_cols(t, delta), t);
  end loop;
  set local session_replication_role = origin;
end $$;

revoke all on all functions in schema showcase from public, anon, authenticated;


select cron.unschedule('showcase-restore') where exists (select 1 from cron.job where jobname = 'showcase-restore');
select cron.schedule('showcase-restore', '1 0 * * *', 'select showcase.restore()');
