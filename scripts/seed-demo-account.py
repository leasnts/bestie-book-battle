#!/usr/bin/env python3
"""
Compte vitrine : remplit le compte de Lea (« lili ») comme celui d'une lectrice active.

    python3 scripts/seed-demo-account.py > /tmp/seed.sql   # puis exécuter le SQL

- Retire lili de tous ses livres, sauf « Une vie comme une autre » (lu avec Zoé, vraie lectrice).
- Recrée 7 livres sans doublon : 3 lus, 3 en cours (dont 1 en solo et 1 en duo), 1 pas commencé.
- Amis : les 4 comptes de test (Emma, Lucas, Chloé, Théo).
- Tout est daté par rapport au jour où on lance le script : relançable n'importe quand,
  la série du livre principal reste allumée « aujourd'hui ».
"""

import datetime as dt
import random
import uuid

random.seed(7)
TODAY = dt.date.today()
NS = uuid.UUID("de300000-0000-4000-a000-000000000000")

ME = "9b8c837f-0755-4d7a-972f-37cbe51395c1"
EMMA = "aaaaaaaa-1111-4000-a000-000000000001"
LUCAS = "aaaaaaaa-1111-4000-a000-000000000002"
CHLOE = "aaaaaaaa-1111-4000-a000-000000000003"
THEO = "aaaaaaaa-1111-4000-a000-000000000004"
KEEP = "2490d493-c429-42d8-9d82-4de4e49894ca"  # Une vie comme une autre, avec Zoé


def uid(*parts):
    return str(uuid.uuid5(NS, "/".join(map(str, parts))))


def day(n):
    """n jours avant aujourd'hui"""
    return TODAY - dt.timedelta(days=n)


def ts(d, h, m=0):
    # Aujourd'hui : tout se passe juste après minuit (UTC), jamais dans le futur, même
    # quand le gel nocturne (scripts/showcase-freeze.sql) remet le compte à 00 h 01
    if d == TODAY:
        return f"{TODAY.isoformat()} 00:00:{m % 60:02d}+00"
    return f"{d.isoformat()} {h:02d}:{m:02d}:00+01"


def q(s):
    return "NULL" if s is None else "'" + str(s).replace("'", "''") + "'"


out = []
emit = out.append

# ─── Les livres ────────────────────────────────────────────────────
# members : user -> (pages de son édition, format, éditeur, page actuelle ou None = fini)
BOOKS = [
    dict(key="bonjour", title="Bonjour tristesse", author="Françoise Sagan", pages=154,
         cover="https://is1-ssl.mzstatic.com/image/thumb/Publication211/v4/b9/4f/77/b94f7793-a3ef-6612-58d0-4b453590b709/9782234075979-001-x.jpeg/600x600bb.jpg",
         admin=THEO, created=165, end=None,
         members={ME: (154, "papier", "Pocket", "done", 164, 148),
                  THEO: (186, "papier", "Julliard", "done", 165, 150)}),
    dict(key="evelyn", title="Les Sept Maris d'Evelyn Hugo", author="Taylor Jenkins Reid", pages=480,
         cover="https://is1-ssl.mzstatic.com/image/thumb/Publication211/v4/34/66/25/34662591-f1ad-7ed9-cc77-8546ca17e7d5/9782811235949-001-x.jpeg/600x600bb.jpg",
         admin=ME, created=131, end=98,
         members={ME: (480, "papier", "Charleston", "done", 130, 99),
                  EMMA: (480, "papier", "Charleston", "done", 130, 104),
                  CHLOE: (512, "liseuse", None, "done", 129, 101)}),
    dict(key="menage", title="La Femme de ménage", author="Freida McFadden", pages=380,
         cover="https://is1-ssl.mzstatic.com/image/thumb/Publication112/v4/df/c6/61/dfc661fb-7824-9cd8-7601-26b94a6439fb/9782824637167-001-x.jpeg/600x600bb.jpg",
         palette='["#3159a2","#212e58","#8899bd"]',
         admin=EMMA, created=42, end=20,
         members={ME: (380, "papier", "City Éditions", "done", 41, 21),
                  EMMA: (380, "papier", "City Éditions", "done", 42, 24),
                  CHLOE: (404, "liseuse", None, "done", 40, 19),
                  LUCAS: (512, "papier", "J'ai lu", 389, 39, 3)}),
    dict(key="nuits", title="Les Nuits blanches", author="Fiodor Dostoïevski", pages=128,
         cover="https://is1-ssl.mzstatic.com/image/thumb/Publication126/v4/e0/a7/fd/e0a7fd89-a00a-d735-19cc-4c0206fac4f4/9782073037589.jpg/600x600bb.jpg",
         admin=CHLOE, created=18, end=None,
         members={ME: (128, "papier", "Folio", 79, 18, 4),
                  CHLOE: (112, "papier", "Le Livre de Poche", 81, 18, 2)}),
    dict(key="delicatesse", title="La délicatesse", author="David Foenkinos", pages=208,
         cover="https://is1-ssl.mzstatic.com/image/thumb/Publication118/v4/ce/79/04/ce790407-2ac3-a1ab-173b-8f2816d2087e/9782072422065.jpg/600x600bb.jpg",
         admin=ME, created=62, end=None,
         members={ME: (208, "liseuse", None, 86, 62, 6)}),
    dict(key="fourth", title="Fourth Wing", author="Rebecca Yarros", pages=650,
         cover="https://is1-ssl.mzstatic.com/image/thumb/Publication126/v4/14/cd/59/14cd594a-dd90-ec8f-ae3b-049575aa977b/9782755673081-001-x.jpeg/600x600bb.jpg",
         palette='["#f1d9a2","#d7a258","#bdb084"]',
         admin=ME, created=20, end=-21,
         members={ME: (650, "papier", "Hugo Publishing", 351, 20, 0),
                  EMMA: (712, "liseuse", None, 506, 20, 0),
                  LUCAS: (650, "papier", "Hugo Publishing", 312, 19, 1),
                  CHLOE: (726, "papier", "Hugo Poche", 283, 19, 0),
                  THEO: (680, "liseuse", None, 150, 17, 2)}),
    dict(key="iron", title="Iron Flame", author="Rebecca Yarros", pages=780,
         cover="https://is1-ssl.mzstatic.com/image/thumb/Publication116/v4/76/d3/38/76d3384e-61fd-908d-360a-461cd5a7f003/9782755673098-001-x.jpeg/600x600bb.jpg",
         admin=EMMA, created=2, end=None,
         members={ME: (780, "papier", "Hugo Publishing", 0, 2, None),
                  EMMA: (812, "liseuse", None, 0, 2, None)}),
]
# Le tuple d'un membre : (pages, format, éditeur, page actuelle | "done" | 0,
#                        rejoint il y a N jours, dernière lecture il y a N jours)

READ_HOURS = {ME: (7, 8, 21), EMMA: (22, 23), LUCAS: (12, 19), CHLOE: (21, 22), THEO: (18, 23)}

emit("BEGIN;")

# ─── Nettoyage ────────────────────────────────────────────────────
emit(f"""
DELETE FROM challenges WHERE id IN (
  SELECT challenge_id FROM challenge_participants WHERE user_id = '{ME}' AND challenge_id <> '{KEEP}'
);
DELETE FROM challenges WHERE id IN ({",".join(q(uid('book', b['key'])) for b in BOOKS)});
DELETE FROM annotation_reactions WHERE user_id = '{ME}' AND annotation_id NOT IN (SELECT id FROM annotations WHERE challenge_id = '{KEEP}');
DELETE FROM annotation_reads WHERE user_id = '{ME}' AND annotation_id NOT IN (SELECT id FROM annotations WHERE challenge_id = '{KEEP}');
""")
# Après les DELETE seulement : en mode replica, les clés étrangères ne cascadent plus
emit("SET LOCAL session_replication_role = replica;  -- triggers coupés : on pose tout à la main")

history_rows = []
progress_rows = []
for b in BOOKS:
    bid = uid("book", b["key"])
    b["id"] = bid
    b["code"] = str(int(uuid.UUID(bid)) % 900000 + 100000)  # stable : même code à chaque relance
    created = day(b["created"])
    end = None if b["end"] is None else day(b["end"])
    done_all = all(m[3] == "done" for m in b["members"].values())
    any_progress = any(m[3] != 0 for m in b["members"].values())
    status = "completed" if done_all else ("active" if any_progress else "pending")
    last_dates = [day(m[5]) for m in b["members"].values() if m[5] is not None]
    updated = max(last_dates) if last_dates else created
    started = ts(day(min(m[4] for m in b["members"].values()) - 1), 20) if any_progress else None
    completed = ts(max(last_dates), 22) if done_all else None

    pcts = []
    for user, (pages, fmt, pub, cur, joined, last) in b["members"].items():
        page = pages if cur == "done" else cur
        pcts.append(round(page / pages * 100, 2))
    emit(f"""INSERT INTO challenges (id, invite_code, invite_url, book_title, book_author, total_pages, cover_url, cover_palette,
  admin_id, status, created_at, started_at, target_end_date, completed_at, average_progress_percentage, participant_count, updated_at)
VALUES ('{bid}', '{b["code"]}', 'bestie-book-battle://join/{b["code"]}', {q(b['title'])}, {q(b['author'])}, {b['pages']}, {q(b['cover'])}, {q(b.get('palette'))},
  '{b['admin']}', '{status}', {q(ts(created, 19, 12))}, {q(started)}, {q(ts(end, 23, 59) if end else None)}, {q(completed)},
  {round(sum(pcts) / len(pcts), 2)}, {len(b['members'])}, {q(ts(updated, 8, 5) if b['key'] == 'fourth' else ts(updated, 21, 40))});
""")

    for user, (pages, fmt, pub, cur, joined, last) in b["members"].items():
        pid = uid("progress", b["key"], user)
        page = pages if cur == "done" else cur
        # Les jours de lecture : de l'arrivée à la dernière lecture, avec des jours sautés
        reading_days = []
        if page > 0:
            first, lastd = joined, last
            span = list(range(first, lastd - 1, -1))
            if b["key"] == "fourth" and user == ME:
                # Série de 17 jours qui brûle aujourd'hui : du J-18 à aujourd'hui, J-7 rattrapé
                # par un marque-page ; avant, deux jours puis une coupure
                reading_days = [20, 19] + [d for d in range(18, -1, -1) if d != 7]
            else:
                reading_days = [d for d in span if d in (first, lastd) or random.random() < 0.72]
            # pages par jour, au prorata
            weights = [random.uniform(0.6, 1.4) for _ in reading_days]
            tot = sum(weights)
            pages_by_day = [max(1, round(page * w / tot)) for w in weights]
            pages_by_day[-1] += page - sum(pages_by_day)
            while pages_by_day[-1] <= 0:  # rare : on rééquilibre
                i = max(range(len(pages_by_day) - 1), key=lambda k: pages_by_day[k])
                pages_by_day[i] -= 1
                pages_by_day[-1] += 1
            cum = 0
            for d, n in zip(reading_days, pages_by_day):
                cum += n
                h = random.choice(READ_HOURS[user])
                m = random.randint(0, 55)
                if b["key"] == "fourth" and user == ME and d == 0:
                    h, m = 7, 52
                history_rows.append(
                    f"('{uid('hist', b['key'], user, d)}','{pid}','{user}','{bid}',{cum},{n},'{ts(day(d), h, m)}','{day(d).isoformat()}')"
                )

        # série du livre
        streak, last_streak, bonus = 0, None, "'{}'"
        if reading_days:
            last_streak = day(reading_days[-1]).isoformat()
            if b["key"] == "fourth" and user == ME:
                streak, bonus = 17, f"ARRAY['{day(7).isoformat()}']::date[]"
            else:
                s, prev = 1, reading_days[-1]
                for d in reversed(reading_days[:-1]):
                    if d == prev + 1:
                        s, prev = s + 1, d
                    else:
                        break
                streak = s
        last_upd = ts(day(last), 8 if user == ME else 22, 4) if last is not None else ts(day(joined), 19, 20)
        if b["key"] == "fourth" and user == ME:
            last_upd = ts(TODAY, 7, 52)
        # Liseuse ou audio : on avance en %, la page vaut alors un % et le total 100 (comme l'app)
        pct = round(page / pages * 100, 2)
        row_page, row_total = (round(pct), 100) if fmt != "papier" else (page, pages)
        progress_rows.append(
            f"('{pid}','{bid}','{user}',{row_page},{pct},{streak},{q(last_streak)},{q(last_upd)},"
            f"{q(ts(day(joined), 19, 20))},{row_total},NULL,{q(pub)},{bonus},'{fmt}',NULL,NULL)"
        )
        emit(f"INSERT INTO challenge_participants (id, challenge_id, user_id, joined_at) VALUES "
             f"('{uid('member', b['key'], user)}','{bid}','{user}',{q(ts(day(joined), 19, 20))});")

emit("INSERT INTO user_progress (id, challenge_id, user_id, current_page, progress_percentage, streak_count, last_streak_date, "
     "last_updated_at, created_at, total_pages, cover_url, publisher, streak_bonus_dates, format, pages_per_day, target_end_date) VALUES\n"
     + ",\n".join(progress_rows) + ";")
emit("INSERT INTO progress_history (id, user_progress_id, user_id, challenge_id, page_number, pages_read, recorded_at, created_date) VALUES\n"
     + ",\n".join(history_rows) + ";")

B = {b["key"]: b for b in BOOKS}

# ─── Caps de Fourth Wing (pages de l'édition de référence, 650) ────
fw = B["fourth"]["id"]
emit(f"""INSERT INTO challenge_goals (id, challenge_id, type, target_pages, deadline, created_by, status, results, created_at, updated_at) VALUES
('{uid('goal', 1)}','{fw}','secondary',120,'{ts(day(13), 23, 59)}','{ME}','archived','{{"baseline":12}}','{ts(day(19), 21)}','{ts(day(12), 9)}'),
('{uid('goal', 2)}','{fw}','secondary',250,'{ts(day(5), 23, 59)}','{EMMA}','archived','{{"baseline":118}}','{ts(day(12), 9)}','{ts(day(4), 9)}'),
('{uid('goal', 3)}','{fw}','secondary',400,'{ts(day(-4), 23, 59)}','{ME}','active','{{"baseline":247}}','{ts(day(4), 9)}','{ts(day(4), 9)}');""")

# ─── Notes du carnet ──────────────────────────────────────────────
# (livre, auteur, page dans SON édition, jours, catégorie, emoji, texte, citation, chapitre, visibilité)
NOTES = [
    # Fourth Wing — derrière ma page
    ("fourth", EMMA, 23, 19, "larmes", "😭", "Le pont dès le début, j'avais les mains moites", None, "Chapitre 2", "club"),
    ("fourth", ME, 31, 18, "a_retenir", "📌", "Le Codex : règle à retenir pour la suite", None, "Chapitre 3", "club"),
    ("fourth", LUCAS, 52, 17, "theorie", "🤔", "Dain cache un truc, j'en suis sûr", None, None, "club"),
    ("fourth", CHLOE, 70, 16, "mdr", "😂", "Rhiannon meilleure amie de l'année", None, None, "club"),
    ("fourth", ME, 88, 15, "coup_de_coeur", "🫶", "Tairn et Andarna, je suis déjà attachée", None, "Chapitre 9", "club"),
    ("fourth", THEO, 74, 13, "spicy", "🌶️", "Euh… le regard de Xaden là", None, None, "club"),
    ("fourth", EMMA, 160, 12, "theorie", "🤔", "Pourquoi tout le monde parle de la rébellion à voix basse ?", None, None, "club"),
    ("fourth", ME, 142, 11, "spicy", "🔥", "Ok la scène de l'entraînement, j'ai rougi", None, None, "club"),
    ("fourth", LUCAS, 151, 10, "a_retenir", "📌", "Les marques de rébellion : à relire", None, "Chapitre 14", "club"),
    ("fourth", ME, 178, 9, "theorie", "🤔", "Ma théorie : Andarna n'est pas une dragonne normale", None, None, "private"),
    ("fourth", CHLOE, 205, 8, "coup_de_coeur", "🥹", "Violet qui tient tête à tout le monde, reine", None, None, "club"),
    ("fourth", ME, 236, 6, "larmes", "😭", None, "Ce n'est pas la force qui compte", "Chapitre 18", "club"),
    ("fourth", EMMA, 300, 5, "mdr", "💀", "Le cours de vol, j'ai hurlé", None, None, "club"),
    ("fourth", THEO, 140, 3, "coup_de_coeur", "🔥", "Les dragons qui se parlent dans la tête, trop stylé", None, None, "club"),
    ("fourth", LUCAS, 295, 2, "larmes", "😭", "Non pas lui…", None, None, "club"),
    ("fourth", CHLOE, 270, 1, "theorie", "🤔", "Je relis tout le début, il y avait des indices", None, None, "club"),
    ("fourth", ME, 322, 1, "a_retenir", "📌", "Penser à demander à Emma pour le prochain cap", None, None, "private"),
    ("fourth", ME, 349, 0, "coup_de_coeur", "😍", "Xaden. C'est tout.", None, "Chapitre 25", "club"),
    # Fourth Wing — devant ma page (verrouillées)
    ("fourth", EMMA, 455, 2, "larmes", "😭", "Préparez les mouchoirs", None, None, "club"),
    ("fourth", EMMA, 501, 0, "theorie", "🤯", "LE retournement, je ne m'en remets pas", None, None, "club"),
    ("fourth", LUCAS, 310, 1, "mdr", "😂", "Ridoc a les meilleures répliques", None, None, "club"),
    # Les Nuits blanches — duo avec Chloé
    ("nuits", CHLOE, 14, 16, "coup_de_coeur", "🥹", "Il parle aux maisons de la ville, c'est trop doux", None, "Première nuit", "club"),
    ("nuits", ME, 22, 15, "a_retenir", "📌", "La description de la nuit blanche, à relire", None, "Première nuit", "club"),
    ("nuits", ME, 47, 9, "mdr", "😂", "Il a répété son discours toute la journée et il bégaie", None, "Deuxième nuit", "club"),
    ("nuits", CHLOE, 51, 7, "theorie", "🤔", "Le locataire va revenir, j'en suis sûre", None, None, "club"),
    ("nuits", CHLOE, 66, 3, "larmes", "😭", "Nastenka épinglée à la robe de sa grand-mère 😭", None, "Histoire de Nastenka", "club"),
    ("nuits", ME, 76, 4, "coup_de_coeur", "🫶", None, "Un instant de bonheur, est-ce peu pour toute une vie ?", "Troisième nuit", "club"),
    # La Femme de ménage
    ("menage", EMMA, 30, 40, "theorie", "🤔", "Nina est trop gentille pour être honnête", None, None, "club"),
    ("menage", ME, 64, 37, "spicy", "🌶️", "Enzo le jardinier… je dis ça je dis rien", None, None, "club"),
    ("menage", CHLOE, 120, 33, "theorie", "🤔", "La porte du grenier, c'est louche", None, None, "club"),
    ("menage", ME, 190, 29, "mdr", "💀", "Andrew qui découvre la vérité, sa tête", None, None, "club"),
    ("menage", LUCAS, 240, 12, "larmes", "😱", "J'ai lu ce chapitre à 2h du mat, erreur", None, None, "club"),
    ("menage", ME, 331, 22, "coup_de_coeur", "🤯", "Le retournement de la fin, incroyable", None, None, "club"),
    ("menage", EMMA, 372, 24, "a_retenir", "📌", "On lit la suite ensemble ?", None, None, "club"),
    # Evelyn Hugo
    ("evelyn", CHLOE, 58, 125, "coup_de_coeur", "🫶", "Evelyn qui choisit tout, même ses scandales", None, None, "club"),
    ("evelyn", ME, 102, 121, "mdr", "😂", "Mari n°1, déjà un red flag géant", None, "Le pauvre Ernie Diaz", "club"),
    ("evelyn", EMMA, 210, 114, "larmes", "😭", "Celia. Juste Celia.", None, None, "club"),
    ("evelyn", ME, 296, 110, "coup_de_coeur", "😍", "Harry, le meilleur de tous", None, None, "club"),
    ("evelyn", ME, 455, 100, "larmes", "😭", "Fini en pleurs dans le train, merci Taylor", None, None, "club"),
    # Bonjour tristesse
    ("bonjour", THEO, 40, 160, "theorie", "🤔", "Cécile va tout gâcher, ça se sent", None, None, "club"),
    ("bonjour", ME, 61, 157, "a_retenir", "📌", "L'été, la mer, la chaleur : l'ambiance parfaite", None, None, "club"),
    ("bonjour", ME, 150, 148, "larmes", "🥹", "Cette fin, je ne m'y attendais pas", None, None, "club"),
    # La délicatesse — en solo
    ("delicatesse", ME, 18, 60, "larmes", "😭", "Le début m'a cueillie", None, None, "private"),
    ("delicatesse", ME, 44, 52, "coup_de_coeur", "🫶", "Markus est trop mignon", None, None, "private"),
    ("delicatesse", ME, 79, 6, "a_retenir", "📌", "Le baiser au bureau, à relire", None, None, "private"),
]

note_ids = {}
rows = []
for i, (k, user, page, d, cat, emoji, body, quote, chapter, vis) in enumerate(NOTES):
    b = B[k]
    ed = b["members"][user][0]
    nid = uid("note", i)
    note_ids[i] = nid
    h = random.choice(READ_HOURS[user])
    rows.append(
        # Une note, c'est un emoji seul OU un texte (comme dans l'app)
        f"('{nid}','{b['id']}','{user}',{page},{ed},{round(page / ed, 5)},{q(chapter)},{q(quote)},{q(body)},{q(None if body or quote else emoji)},"
        f"'{cat}','{vis}','{ts(day(d), h, random.randint(0, 59))}','{ts(day(d), h, 59)}')"
    )
emit("INSERT INTO annotations (id, challenge_id, user_id, page, edition_total_pages, position, chapter, quote, body, emoji, category, visibility, created_at, updated_at) VALUES\n"
     + ",\n".join(rows) + ";")


def my_pos(k):
    pages, _, _, cur, _, _ = B[k]["members"][ME]
    return 1.0 if cur == "done" else cur / pages


# Réactions : les amis réagissent à mes notes, je réagis aux leurs ; lectures : j'ai lu ce qui
# est derrière ma page, sauf les 3 dernières de Fourth Wing (les « nouvelles »)
REACT = ["🔥", "😭", "😂", "🫶", "😍", "🥹", "💀", "❤️"]
FRESH = {i for i, n in enumerate(NOTES) if n[0] == "fourth" and n[1] != ME and n[3] <= 3 and n[2] / B["fourth"]["members"][n[1]][0] < my_pos("fourth")}
reacts, reads = [], []
for i, (k, user, page, d, cat, emoji, body, quote, chapter, vis) in enumerate(NOTES):
    nid = note_ids[i]
    pos = page / B[k]["members"][user][0]
    members = [u for u in B[k]["members"] if u != user]
    created = day(d)
    if vis != "club":
        continue
    for other in members:
        other_pos = B[k]["members"][other]
        o_pos = 1.0 if other_pos[3] == "done" else other_pos[3] / other_pos[0]
        if o_pos < pos:
            continue  # pas encore arrivé à cette page : ne l'a pas vue
        if other == ME and i in FRESH:
            continue
        rd = min(created + dt.timedelta(days=random.randint(0, 2)), TODAY)
        reads.append(f"('{nid}','{other}','{ts(rd, 22, random.randint(0, 59))}')")
        p_react = 0.75 if user == ME else 0.45
        if random.random() < p_react:
            reacts.append(f"('{nid}','{other}','{random.choice(REACT)}','{ts(rd, 22, 30)}')")
            if random.random() < 0.25:
                reacts.append(f"('{nid}','{other}','{random.choice(REACT)}','{ts(rd, 22, 31)}')")
emit("INSERT INTO annotation_reads (annotation_id, user_id, read_at) VALUES\n" + ",\n".join(reads) + " ON CONFLICT DO NOTHING;")
emit("INSERT INTO annotation_reactions (annotation_id, user_id, emoji, created_at) VALUES\n" + ",\n".join(reacts) + " ON CONFLICT DO NOTHING;")

# ─── Profil ───────────────────────────────────────────────────────
emit(f"UPDATE users SET last_login_at = now() WHERE id = '{ME}';")
emit("COMMIT;")
print("\n".join(out))
