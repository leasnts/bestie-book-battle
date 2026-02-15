# Upload des couvertures de livres

Les images des 4 livres sont dans `assets/images/covers/` :
- `a_little_life.png`
- `sapiens.png`
- `le_petit_prince.png`
- `educated.png`

Pour les envoyer vers Supabase Storage et mettre à jour la base de données :

1. **Ajoute la clé service_role** dans ton fichier `.env` :
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJ...ta_clé...
   ```
   Tu la trouves dans **Supabase Dashboard** → **Settings** → **API** → **Project API keys** → **service_role** (clé secrète).

2. **Exécute le script** :
   ```bash
   npm run upload-covers
   ```

Le script upload les 4 images dans le bucket `book-covers` et met à jour `cover_url` dans la table `challenges`.
