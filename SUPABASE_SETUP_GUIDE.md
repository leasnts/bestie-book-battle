# 🚀 Guide de Setup Supabase - Bestie Book Battle

Bienvenue ! Ce guide va te guider pas à pas pour configurer ton application avec Supabase. C'est très simple, suis juste les étapes une par une. 😊

## ✅ Ce qui a déjà été fait

Tout le code de ton application a été migré de Firebase vers Supabase ! Voici ce qui a été créé :

- ✅ Script SQL complet pour créer toutes les tables
- ✅ Services Supabase (auth, database, storage, realtime)
- ✅ Stores mis à jour (authStore, projectStore, progressStore)
- ✅ Types TypeScript générés
- ✅ Configuration Supabase prête

## 📋 Ce que TU dois faire (30 minutes max)

### Étape 1 : Configurer la base de données Supabase (10 min)

1. **Ouvre ton dashboard Supabase**
   - Va sur https://supabase.com/dashboard
   - Connecte-toi
   - Clique sur ton projet

2. **Exécute le script SQL**
   - Dans la sidebar à gauche, clique sur **"SQL Editor"**
   - Clique sur **"New query"**
   - Ouvre le fichier `scripts/supabase-setup.sql` depuis VS Code
   - **Copie TOUT le contenu** du fichier
   - **Colle-le** dans le SQL Editor de Supabase
   - Clique sur **"Run"** (le bouton vert en bas à droite)
   - ⏳ Attends quelques secondes
   - ✅ Tu devrais voir "Success. No rows returned" (c'est normal !)

3. **Vérifie que tout est créé**
   - Dans la sidebar, clique sur **"Table Editor"**
   - Tu devrais voir 5 tables :
     - `users`
     - `challenges`
     - `challenge_participants`
     - `user_progress`
     - `progress_history`
   - Si tu les vois, c'est parfait ! ✨

### Étape 2 : Créer les buckets Storage (5 min)

1. **Créer le bucket pour les photos de profil**
   - Dans la sidebar, clique sur **"Storage"**
   - Clique sur **"New bucket"**
   - Nom : `profile-photos`
   - Public : **Activé** ✅
   - File size limit : `2 MB`
   - Allowed MIME types : `image/jpeg, image/png, image/webp`
   - Clique sur **"Save"**

2. **Créer le bucket pour les couvertures de livres**
   - Clique encore sur **"New bucket"**
   - Nom : `book-covers`
   - Public : **Activé** ✅
   - File size limit : `5 MB`
   - Allowed MIME types : `image/jpeg, image/png, image/webp`
   - Clique sur **"Save"**

### Étape 3 : Récupérer tes clés Supabase (2 min)

1. **Trouve tes credentials**
   - Dans la sidebar, clique sur **"Settings"** (icône engrenage en bas)
   - Clique sur **"API"**
   - Tu vas voir deux informations importantes :

2. **Copie ces deux valeurs**
   - **Project URL** : quelque chose comme `https://xxxxx.supabase.co`
   - **anon public key** : une longue chaîne de caractères qui commence par `eyJ...`

3. **Ajoute-les dans ton code**
   - Crée un fichier `.env` à la racine de ton projet
   - Ajoute ces lignes (remplace les valeurs) :
   
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxxxxxxxxx
   ```

   **Important** : Remplace les valeurs avec TES vrais credentials !

### Étape 4 : Configurer Apple Sign In (5 min)

1. **Dans Supabase Dashboard**
   - Va dans **"Authentication"** → **"Providers"**
   - Cherche **"Apple"** dans la liste
   - Active Apple Sign In
   
2. **Ajoute tes credentials Apple**
   - Tu dois avoir configuré Apple Sign In dans ton compte Apple Developer
   - Entre :
     - **Services ID**
     - **Team ID**
     - **Key ID**
     - **Private Key**
   
3. **Configure le Redirect URL**
   - Note l'URL de callback : `{YOUR_PROJECT_URL}/auth/v1/callback`
   - Tu devras l'ajouter dans Apple Developer Console

### Étape 5 : Tester ton app (5 min)

1. **Nettoie et redémarre**
   ```bash
   npm install
   npm start
   ```

2. **Lance l'app sur ton iPhone**
   - Scanne le QR code avec l'app Expo Go
   - Ou connecte ton téléphone et fais `npm run ios`

3. **Teste la connexion**
   - Tu devrais voir l'écran de login
   - Clique sur "Sign in with Apple"
   - Connecte-toi avec ton Apple ID
   - ✅ Tu devrais être connecté !

## 🎯 Prochaines étapes (optionnel)

### Deep Links (pour les invitations)

1. **Configure le scheme dans app.json**
   - C'est déjà fait ! Le scheme est `bestiebookbattle://`

2. **Test du deep link**
   - Crée un challenge
   - Partage le code d'invitation
   - Clique sur le lien partagé
   - L'app devrait s'ouvrir directement sur l'écran de join

### Real-time (déjà configuré!)

Les mises à jour en temps réel sont déjà activées ! Quand quelqu'un met à jour sa progression, tu verras le changement immédiatement. 🔥

## 🆘 Problèmes ?

### "Aucun token d'identité reçu d'Apple"
- Vérifie que tu as bien configuré Apple Sign In dans Supabase
- Vérifie que ton Service ID Apple est correct

### "PGRST116" ou "Not found"
- Vérifie que tu as bien exécuté le script SQL
- Vérifie que les tables existent dans Table Editor

### Les images ne s'affichent pas
- Vérifie que les buckets Storage sont bien créés
- Vérifie qu'ils sont bien "Public"

### L'app crash au démarrage
- Vérifie que tu as bien ajouté le fichier `.env`
- Vérifie que les clés dans `.env` sont correctes
- Redémarre l'app : `npm start` puis scanne à nouveau le QR code

## 📝 Notes importantes

1. **Ne commit JAMAIS le fichier `.env`** - Il contient tes credentials
2. Les anciens fichiers Firebase seront supprimés automatiquement
3. Toutes tes données Firebase existantes doivent être migrées (on peut le faire ensemble si besoin)
4. Supabase est GRATUIT jusqu'à 500MB de base de données et 1GB de fichiers

## 🎉 C'est tout !

Une fois que tu as suivi toutes ces étapes, ton app devrait fonctionner parfaitement avec Supabase !

Si tu as le moindre problème, n'hésite pas à me demander de l'aide. Je suis là pour ça ! 😊

---

**Créé avec ❤️ pour Bestie Book Battle**
