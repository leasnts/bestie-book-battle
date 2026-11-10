-- Notifications chapi (#178) — tout se décide ici, côté serveur.
--
-- Quatre notifs seulement :
--   reminder : le rappel, à son heure, seulement si on n'a pas lu ce jour-là
--   overtake : une pote vient de passer devant (1 fois par pote et par jour)
--   carnet   : nouvelle note à une page déjà lue, ou réaction sur ma note (regroupées)
--   cap      : la veille d'un cap pas encore atteint
--
-- Règles : 2 notifs envoyées par jour au plus ; rien de 22 h à 9 h (heure locale)
-- pour le groupe, reporté à 9 h ; jamais pour sa propre action ; tout est revérifié
-- juste avant l'envoi (une note supprimée, une pote repassée derrière → rien).
-- L'app, elle, n'affiche aucune notif quand elle est ouverte (sauf nouvelle note,
-- en bandeau) : voir services/notifications.ts.
--
-- Une file : public.notifications. Les déclencheurs y déposent, notif_tick()
-- (pg_cron, chaque minute) planifie rappels et caps, compose les textes et
-- envoie à l'API Expo Push via pg_net.
-- Rejouable : tout est en « if not exists » / « or replace ».

create extension if not exists pg_net;

alter table public.users add column if not exists timezone text;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null check (kind in ('reminder', 'overtake', 'carnet', 'cap')),
  challenge_id uuid references public.challenges(id) on delete cascade,
  -- Composés à l'envoi, avec les données du moment
  title text,
  subtitle text,
  body text,
  url text not null default '/',
  data jsonb not null default '{}',
  dedupe_key text,
  send_after timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'sent', 'skipped')),
  skip_reason text,
  sent_at timestamptz,
  push_token text,
  net_request_id bigint,
  created_at timestamptz not null default now(),
  unique (user_id, dedupe_key)
);

create index if not exists notifications_due on public.notifications (send_after) where status = 'pending';
create index if not exists notifications_user on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;
drop policy if exists "Je vois mes notifs" on public.notifications;
create policy "Je vois mes notifs" on public.notifications
  for select using (user_id = (select auth.uid()));

-- ─── Heure locale ────────────────────────────────────────────────────────────

create or replace function public.notif_tz(p_user uuid) returns text
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select u.timezone from public.users u
      where u.id = p_user and exists (select 1 from pg_catalog.pg_timezone_names z where z.name = u.timezone)),
    'Europe/Paris');
$$;

create or replace function public.notif_local_now(p_user uuid) returns timestamp
language sql stable security definer set search_path = '' as $$
  select now() at time zone public.notif_tz(p_user);
$$;

-- Hors des heures calmes (22 h - 9 h) : le prochain moment permis
create or replace function public.notif_awake(p_user uuid, p_at timestamptz) returns timestamptz
language plpgsql stable security definer set search_path = '' as $$
declare
  tz text := public.notif_tz(p_user);
  l timestamp := p_at at time zone tz;
begin
  if extract(hour from l) >= 22 then return ((l::date + 1) + time '09:00') at time zone tz; end if;
  if extract(hour from l) < 9 then return (l::date + time '09:00') at time zone tz; end if;
  return p_at;
end $$;

-- Position de lecture d'une personne dans un livre, entre 0 et 1
create or replace function public.notif_position(p_user uuid, p_challenge uuid) returns numeric
language sql stable security definer set search_path = '' as $$
  select coalesce(max(case when p.total_pages > 0 then p.current_page::numeric / p.total_pages else 0 end), 0)
  from public.user_progress p where p.user_id = p_user and p.challenge_id = p_challenge;
$$;

-- Le total de pages de son édition
create or replace function public.notif_total(p_user uuid, p_challenge uuid) returns int
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select nullif(p.total_pages, 0) from public.user_progress p where p.user_id = p_user and p.challenge_id = p_challenge),
    (select c.total_pages from public.challenges c where c.id = p_challenge));
$$;

-- « p. 212 », ou « ≈ p. 212 » dans une autre édition (comme utils/annotations.ts)
create or replace function public.notif_page(p_user uuid, p_challenge uuid, p_position numeric, p_edition int)
returns text language plpgsql stable security definer set search_path = '' as $$
declare total int := public.notif_total(p_user, p_challenge);
begin
  return case when p_edition is not null and p_edition <> total then '≈ p. ' else 'p. ' end
    || greatest(1, ceil(least(greatest(p_position, 0), 1) * total - 0.02))::int;
end $$;

-- Un extrait court d'une note, sans point final ajouté
create or replace function public.notif_excerpt(a public.annotations) returns text
language sql immutable set search_path = '' as $$
  select case
    when coalesce(btrim(a.body), '') <> '' then left(btrim(a.body), 110) || case when length(btrim(a.body)) > 110 then '…' else '' end
    when coalesce(btrim(a.quote), '') <> '' then '« ' || left(btrim(a.quote), 100) || case when length(btrim(a.quote)) > 100 then '…' else '' end || ' »'
    when a.audio_path is not null then 'Une note vocale'
    when a.emoji is not null then a.emoji
    else 'Une note'
  end;
$$;

-- « Emma », « Emma et Lucas », « Emma, Lucas et Lou »
create or replace function public.notif_names(p_names text[]) returns text
language sql immutable set search_path = '' as $$
  select case
    when coalesce(array_length(p_names, 1), 0) = 0 then ''
    when array_length(p_names, 1) = 1 then p_names[1]
    else array_to_string(p_names[1:array_length(p_names, 1) - 1], ', ') || ' et ' || p_names[array_length(p_names, 1)]
  end;
$$;

-- ─── Déclencheurs ────────────────────────────────────────────────────────────

-- Une pote passe devant : on attend 2 min (elle peut corriger) et on revérifie à l'envoi
create or replace function public.notif_on_progress() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  -- Seulement sa propre lecture, depuis l'app (pas les scripts, pas la position de départ)
  if (select auth.uid()) is distinct from new.user_id then return new; end if;
  if current_setting('chapi.start_position', true) = 'on' then return new; end if;
  if new.progress_percentage is null or old.progress_percentage is null
     or new.progress_percentage <= old.progress_percentage then return new; end if;

  for r in
    select p.user_id from public.user_progress p
    where p.challenge_id = new.challenge_id and p.user_id <> new.user_id
      and p.progress_percentage >= old.progress_percentage
      and p.progress_percentage < new.progress_percentage
  loop
    insert into public.notifications (user_id, kind, challenge_id, url, data, dedupe_key, send_after)
    values (r.user_id, 'overtake', new.challenge_id, '/leaderboard',
            jsonb_build_object('actor', new.user_id),
            'overtake:' || new.challenge_id || ':' || new.user_id || ':' || (public.notif_local_now(r.user_id))::date,
            now() + interval '2 minutes')
    on conflict (user_id, dedupe_key) do nothing;
  end loop;
  return new;
-- Une notif ratée ne doit jamais empêcher d'enregistrer sa page ou sa note
exception when others then
  raise warning 'notif: %', sqlerrm;
  return new;
end $$;

drop trigger if exists notif_progress on public.user_progress;
create trigger notif_progress after update of current_page on public.user_progress
  for each row execute function public.notif_on_progress();

-- Ajoute un élément à la notif carnet en attente (une seule par personne et par livre)
create or replace function public.notif_carnet_push(p_user uuid, p_challenge uuid, p_field text, p_item jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  select id into v_id from public.notifications
  where user_id = p_user and challenge_id = p_challenge and kind = 'carnet' and status = 'pending'
  order by created_at limit 1 for update;

  if v_id is null then
    insert into public.notifications (user_id, kind, challenge_id, url, data, send_after)
    values (p_user, 'carnet', p_challenge, '/carnet',
            jsonb_build_object('notes', '[]'::jsonb, 'reactions', '[]'::jsonb) || jsonb_build_object(p_field, jsonb_build_array(p_item)),
            now() + interval '2 minutes');
  else
    -- Regroupe : le compte à rebours repart, sans dépasser 10 min après la première
    update public.notifications n
    set data = jsonb_set(n.data, array[p_field],
                 case when coalesce(n.data -> p_field, '[]'::jsonb) @> jsonb_build_array(p_item)
                      then n.data -> p_field else coalesce(n.data -> p_field, '[]'::jsonb) || jsonb_build_array(p_item) end),
        send_after = least(n.created_at + interval '10 minutes', greatest(n.send_after, now() + interval '2 minutes'))
    where n.id = v_id;
  end if;
end $$;

-- Nouvelle note du groupe : à celles et ceux qui ont déjà lu cette page (zéro spoil)
create or replace function public.notif_on_annotation() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  if (select auth.uid()) is distinct from new.user_id then return new; end if;
  if new.visibility <> 'club' then return new; end if;

  for r in
    select cp.user_id from public.challenge_participants cp
    where cp.challenge_id = new.challenge_id and cp.user_id <> new.user_id
      and public.notif_position(cp.user_id, new.challenge_id) >= new.position + public.annotation_unlock_margin()
  loop
    perform public.notif_carnet_push(r.user_id, new.challenge_id, 'notes', to_jsonb(new.id::text));
  end loop;
  return new;
-- Une notif ratée ne doit jamais empêcher d'enregistrer sa page ou sa note
exception when others then
  raise warning 'notif: %', sqlerrm;
  return new;
end $$;

drop trigger if exists notif_annotation on public.annotations;
create trigger notif_annotation after insert on public.annotations
  for each row execute function public.notif_on_annotation();

-- Réaction sur ma note
create or replace function public.notif_on_reaction() returns trigger
language plpgsql security definer set search_path = '' as $$
declare a public.annotations;
begin
  if (select auth.uid()) is distinct from new.user_id then return new; end if;
  select * into a from public.annotations where id = new.annotation_id;
  if a.id is null or a.user_id = new.user_id then return new; end if;
  perform public.notif_carnet_push(a.user_id, a.challenge_id, 'reactions',
    jsonb_build_object('a', new.annotation_id, 'u', new.user_id, 'e', new.emoji));
  return new;
-- Une notif ratée ne doit jamais empêcher d'enregistrer sa page ou sa note
exception when others then
  raise warning 'notif: %', sqlerrm;
  return new;
end $$;

drop trigger if exists notif_reaction on public.annotation_reactions;
create trigger notif_reaction after insert on public.annotation_reactions
  for each row execute function public.notif_on_reaction();

-- ─── Composer : le texte, avec les données du moment (null = plus rien à dire) ─

create or replace function public.notif_compose(n public.notifications)
returns table (title text, subtitle text, body text)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_book text;
  v_tz text := public.notif_tz(n.user_id);
  v_today date := (now() at time zone v_tz)::date;
  a public.annotations;
  p record;
  g record;
  v_notes int;
  v_reacts int;
  v_names text[];
  v_cap numeric;
begin
  select c.book_title into v_book from public.challenges c where c.id = n.challenge_id;

  if n.kind = 'reminder' then
    -- Déjà lu aujourd'hui (n'importe quel livre) : rien
    if exists (select 1 from public.progress_history h
               where h.user_id = n.user_id and (h.recorded_at at time zone v_tz)::date = v_today) then
      return;
    end if;
    select up.current_page, up.streak_count, up.last_streak_date, c.book_title into p
    from public.user_progress up join public.challenges c on c.id = up.challenge_id
    where up.user_id = n.user_id and up.challenge_id = n.challenge_id;
    if not found then return; end if;
    return query select
      case when p.streak_count >= 2 and p.last_streak_date >= v_today - 1
           then p.streak_count || ' jours de série' else 'Ton moment lecture' end,
      null::text,
      p.book_title || ' t’attend' || case when p.current_page > 0 then ' p. ' || p.current_page else '' end;

  elsif n.kind = 'overtake' then
    -- Toujours devant ? Sinon on se tait
    select u.first_name,
           public.notif_position((n.data ->> 'actor')::uuid, n.challenge_id) as theirs,
           public.notif_position(n.user_id, n.challenge_id) as mine
      into p
    from public.users u where u.id = (n.data ->> 'actor')::uuid;
    if not found or p.theirs <= p.mine then return; end if;
    return query select p.first_name || ' vient de te passer devant', null::text, v_book;

  elsif n.kind = 'cap' then
    select gl.target_pages, gl.status, c.total_pages as ref into g
    from public.challenge_goals gl join public.challenges c on c.id = gl.challenge_id
    where gl.id = (n.data ->> 'goal')::uuid;
    if not found or g.status <> 'active' or coalesce(g.ref, 0) = 0 then return; end if;
    v_cap := g.target_pages::numeric / g.ref;
    if public.notif_position(n.user_id, n.challenge_id) >= v_cap then return; end if;
    return query select 'Cap demain'::text, null::text,
      v_book || ', ' || public.notif_page(n.user_id, n.challenge_id, v_cap, g.ref) || ' à atteindre';

  elsif n.kind = 'carnet' then
    -- Ce qui existe encore (une note supprimée, une réaction retirée ne comptent plus)
    select count(*), array_agg(distinct u.first_name) into v_notes, v_names
    from public.annotations an join public.users u on u.id = an.user_id
    where an.id in (select (x #>> '{}')::uuid from jsonb_array_elements(n.data -> 'notes') x)
      and an.visibility = 'club';

    select count(*) into v_reacts
    from jsonb_array_elements(n.data -> 'reactions') r
    where exists (select 1 from public.annotation_reactions ar
                  where ar.annotation_id = (r ->> 'a')::uuid and ar.user_id = (r ->> 'u')::uuid and ar.emoji = r ->> 'e');

    if v_notes = 0 and v_reacts = 0 then return; end if;

    if v_notes = 1 and v_reacts = 0 then
      select an.* into a from public.annotations an
      where an.id in (select (x #>> '{}')::uuid from jsonb_array_elements(n.data -> 'notes') x) and an.visibility = 'club'
      limit 1;
      return query select
        v_names[1] || ' a laissé une note ' || public.notif_page(n.user_id, n.challenge_id, a.position, a.edition_total_pages),
        v_book, public.notif_excerpt(a);

    elsif v_notes > 1 and v_reacts = 0 then
      -- Une seule personne : « Emma a laissé 3 notes » ; plusieurs : le compte, et qui
      if array_length(v_names, 1) = 1 then
        return query select v_names[1] || ' a laissé ' || v_notes || ' notes', v_book, 'Dans le carnet'::text;
      else
        return query select v_notes || ' nouvelles notes dans le carnet', v_book, public.notif_names(v_names);
      end if;

    elsif v_notes = 0 then
      select array_agg(distinct u.first_name) into v_names
      from jsonb_array_elements(n.data -> 'reactions') r join public.users u on u.id = (r ->> 'u')::uuid
      where exists (select 1 from public.annotation_reactions ar
                    where ar.annotation_id = (r ->> 'a')::uuid and ar.user_id = (r ->> 'u')::uuid and ar.emoji = r ->> 'e');
      if v_reacts = 1 then
        select an.* into a from public.annotations an
        where an.id = (select (r ->> 'a')::uuid from jsonb_array_elements(n.data -> 'reactions') r
                       where exists (select 1 from public.annotation_reactions ar
                                     where ar.annotation_id = (r ->> 'a')::uuid and ar.user_id = (r ->> 'u')::uuid and ar.emoji = r ->> 'e')
                       limit 1);
        return query select
          v_names[1] || ' a réagi ' || (select r ->> 'e' from jsonb_array_elements(n.data -> 'reactions') r
                                         where exists (select 1 from public.annotation_reactions ar
                                                       where ar.annotation_id = (r ->> 'a')::uuid and ar.user_id = (r ->> 'u')::uuid and ar.emoji = r ->> 'e')
                                         limit 1) || ' à ta note',
          v_book, public.notif_excerpt(a);
      else
        return query select v_reacts || ' réactions sur tes notes', v_book, public.notif_names(v_names);
      end if;

    else
      return query select 'Du nouveau dans le carnet'::text, v_book,
        v_notes || case when v_notes > 1 then ' notes, ' else ' note, ' end
        || v_reacts || case when v_reacts > 1 then ' réactions' else ' réaction' end;
    end if;
  end if;
end $$;

-- ─── La minute : planifier, composer, envoyer ────────────────────────────────

create or replace function public.notif_tick() returns void
language plpgsql security definer set search_path = '' as $$
declare
  n public.notifications;
  u record;
  c record;
  v_local timestamp;
  v_sent int;
  v_req bigint;
begin
  -- 1. Jetons refusés par Apple (app supprimée) : on les oublie
  update public.users us set notification_token = null
  from public.notifications nn join net._http_response r on r.id = nn.net_request_id
  where nn.status = 'sent' and nn.sent_at > now() - interval '1 day'
    and us.id = nn.user_id and us.notification_token = nn.push_token
    and r.content like '%DeviceNotRegistered%';

  -- 2. Le rappel : dans la demi-heure qui suit son heure, si un livre est en cours
  insert into public.notifications (user_id, kind, challenge_id, url, dedupe_key)
  select us.id, 'reminder', cur.challenge_id, '/', 'reminder:' || (now() at time zone public.notif_tz(us.id))::date
  from public.users us
  cross join lateral (
    select up.challenge_id from public.user_progress up join public.challenges ch on ch.id = up.challenge_id
    where up.user_id = us.id and ch.status = 'active' and up.current_page < coalesce(nullif(up.total_pages, 0), ch.total_pages)
    order by up.last_updated_at desc nulls last limit 1
  ) cur
  where us.notification_token is not null
    and coalesce((us.notification_preferences ->> 'daily_reminder')::boolean, true)
    and (now() at time zone public.notif_tz(us.id))::time
        between coalesce((us.notification_preferences ->> 'daily_reminder_time')::time, time '20:00')
            and coalesce((us.notification_preferences ->> 'daily_reminder_time')::time, time '20:00') + interval '30 minutes'
  on conflict (user_id, dedupe_key) do nothing;

  -- 3. Le cap de demain, à midi heure locale
  insert into public.notifications (user_id, kind, challenge_id, url, data, dedupe_key)
  select cp.user_id, 'cap', gl.challenge_id, '/', jsonb_build_object('goal', gl.id), 'cap:' || gl.id
  from public.challenge_goals gl
  join public.challenge_participants cp on cp.challenge_id = gl.challenge_id
  join public.users us on us.id = cp.user_id
  where gl.status = 'active' and gl.deadline > now()
    and us.notification_token is not null
    and (gl.deadline at time zone public.notif_tz(us.id))::date = (now() at time zone public.notif_tz(us.id))::date + 1
    and extract(hour from now() at time zone public.notif_tz(us.id)) between 12 and 21
  on conflict (user_id, dedupe_key) do nothing;

  -- 4. Envoyer ce qui est dû
  for n in
    select * from public.notifications where status = 'pending' and send_after <= now()
    order by send_after limit 200 for update skip locked
  loop
   begin
    select us.notification_token as token, us.notification_preferences as prefs into u
    from public.users us where us.id = n.user_id;

    -- Le groupe se tait la nuit : reporté à 9 h (le rappel, lui, est à l'heure choisie)
    if n.kind in ('overtake', 'carnet', 'cap') and public.notif_awake(n.user_id, now()) > now() then
      update public.notifications set send_after = public.notif_awake(n.user_id, now()) where id = n.id;
      continue;
    end if;

    select * into c from public.notif_compose(n);
    if c.title is null then
      update public.notifications set status = 'skipped', skip_reason = 'stale' where id = n.id;
      continue;
    end if;
    update public.notifications set title = c.title, subtitle = c.subtitle, body = c.body where id = n.id;

    if (n.kind = 'reminder' and not coalesce((u.prefs ->> 'daily_reminder')::boolean, true))
       or (n.kind <> 'reminder' and not coalesce((u.prefs ->> 'group')::boolean, true)) then
      update public.notifications set status = 'skipped', skip_reason = 'off' where id = n.id;
      continue;
    end if;

    if u.token is null then
      update public.notifications set status = 'skipped', skip_reason = 'no_token' where id = n.id;
      continue;
    end if;

    v_local := now() at time zone public.notif_tz(n.user_id);
    select count(*) into v_sent from public.notifications s
    where s.user_id = n.user_id and s.status = 'sent'
      and (s.sent_at at time zone public.notif_tz(n.user_id))::date = v_local::date;
    if v_sent >= 2 then
      update public.notifications set status = 'skipped', skip_reason = 'daily_cap' where id = n.id;
      continue;
    end if;

    select net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Accept', 'application/json'),
      body := jsonb_strip_nulls(jsonb_build_object(
        'to', u.token,
        'title', c.title,
        'subtitle', c.subtitle,
        'body', c.body,
        'sound', 'default',
        'data', jsonb_build_object('kind', n.kind, 'url', n.url, 'challengeId', n.challenge_id, 'id', n.id,
                                  -- Une note déposée : la seule qui fait un signe app ouverte
                                  'note', n.kind = 'carnet' and jsonb_array_length(coalesce(n.data -> 'notes', '[]')) > 0)
      ))
    ) into v_req;

    update public.notifications
    set status = 'sent', sent_at = now(), push_token = u.token, net_request_id = v_req
    where id = n.id;
   -- Une notif en erreur ne bloque pas les autres
   exception when others then
    update public.notifications set status = 'skipped', skip_reason = left('error: ' || sqlerrm, 200) where id = n.id;
   end;
  end loop;

  -- 5. On garde deux mois d'historique
  delete from public.notifications where created_at < now() - interval '60 days';
end $$;

do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
           where ns.nspname = 'public' and p.proname like 'notif\_%' loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;

select cron.unschedule('notif-tick') where exists (select 1 from cron.job where jobname = 'notif-tick');
select cron.schedule('notif-tick', '* * * * *', 'select public.notif_tick()');
