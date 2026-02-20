# Correction des avertissements Security Advisor

## Option 1 : SQL Editor (le plus simple)

1. Ouvre [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionne ton projet
3. Va dans **SQL Editor** (menu de gauche)
4. Clique sur **New query**
5. Copie-colle tout le contenu du fichier `fix-function-search-path.sql`
6. Clique sur **Run** (ou Cmd+Enter)

Les 10 avertissements "Function Search Path Mutable" devraient disparaître.

---

## Option 2 : Script npm (si tu as DATABASE_URL)

1. Dans Supabase → **Settings** → **Database**, copie le **Connection string** (mode Transaction)
2. Ajoute-le dans ton `.env` : `DATABASE_URL=postgresql://...`
3. Lance : `npm run fix-search-path`

---

## Leaked Password Protection (1 avertissement)

Ton app utilise **Apple Sign In** (pas de mot de passe) → cet avertissement n'a pas d'impact pour toi.

Si tu veux l'activer quand même : Supabase → **Authentication** → **Providers** → **Email** → active " leak protection".
