# Bestie Book Battle — Contexte Projet

## Vue d'ensemble

Application mobile de **lecture partagée entre amis**. Les utilisateurs créent des challenges de lecture (un livre, un nombre de pages, une deadline), invitent leurs amis via un code, et suivent leur progression en temps réel avec un classement, des streaks et des graphiques.

- **Plateforme cible** : iOS (principal), Android (secondaire)
- **Langue de l'app** : Français
- **Bundle ID** : `com.leasantos.bestiebookbattle`
- **Deep link scheme** : `bestie-book-battle://`

---

## Stack technique

| Catégorie | Technologie | Version |
|---|---|---|
| Framework | Expo (managed → prebuild) | SDK 54 |
| Runtime | React Native | 0.81.5 |
| Langage | TypeScript (strict) | 5.9 |
| Navigation | Expo Router (file-based) | 6 |
| State management | Zustand | 5 |
| Backend / BaaS | Supabase (Auth, DB, Storage, Realtime) | 2.93 |
| UI Library | React Native Paper (Material Design 3) | 5 |
| Animations | react-native-reanimated + motion | 4.1 / 12 |
| Gestes | react-native-gesture-handler | 2.28 |
| Graphiques | @visx/* + react-native-chart-kit + d3-array | — |
| Icônes | lucide-react-native | — |
| Images | expo-image | 3 |
| Polices | Fraunces douce (titres, nombres), Nunito (corps) | — |
| Bottom Sheet | @gorhom/bottom-sheet | 5 |
| Utilitaires CSS | class-variance-authority, clsx, tailwind-merge | — |

**New Architecture** activée (`newArchEnabled: true`).

---

## Structure du projet

```
bestie-book-battle/
├── app/                        # Écrans (Expo Router file-based routing)
│   ├── _layout.tsx             # Layout racine (auth guard, splash, redirections)
│   ├── (tabs)/                 # Navigation par tabs
│   │   ├── index.tsx           # Home (livre en cours, sélecteur de page, top 3)
│   │   └── history.tsx         # Historique des challenges
│   ├── auth/login.tsx          # Apple Sign In
│   ├── onboarding/             # Wizard nouveau user (welcome → role → cover → pages → deadline → create/join → notifications → complete)
│   ├── project/                # Gestion de projet
│   │   ├── invite.tsx          # Invitation par code
│   │   └── [id].tsx            # Détail d'un challenge
│   ├── progress/update.tsx     # Modal mise à jour progression
│   ├── profile.tsx             # Profil utilisateur
│   └── activity.tsx            # Feed d'activité
│
├── components/
│   ├── ui/                     # Composants UI (ProgressBar, ActiveBookCard, BookLibrary…)
│   ├── charts/                 # Graphiques Visx (LineChart, Tooltip, XAxis)
│   ├── common/                 # Avatar, Crown
│   ├── icons/                  # Icônes SVG custom
│   ├── AnimatedSplash.tsx      # Splash animé
│   ├── Button3D.tsx            # Bouton 3D stylisé
│   ├── CoverPicker3D.tsx       # Sélecteur de couverture
│   └── PopEyes.tsx             # Mascotte de l'app
│
├── services/
│   └── supabase/
│       ├── auth.ts             # Auth Apple, CRUD users
│       ├── database.ts         # Challenges, participants, progression, historique
│       ├── storage.ts          # Upload photos profil et couvertures
│       └── realtime.ts         # Subscriptions temps réel
│   ├── notifications.ts        # Gestion des notifications locales
│   └── notificationTriggers.ts # Déclencheurs de notifications
│
├── stores/                     # Zustand stores
│   ├── authStore.ts            # User courant, login/logout, session
│   ├── projectStore.ts         # Challenges, challenge actif, CRUD
│   ├── progressStore.ts        # Progression, participants, historique
│   ├── goalStore.ts            # Objectifs personnalisés
│   ├── onboardingStore.ts      # État du wizard onboarding
│   └── notificationStore.ts    # Préférences notifications
│
├── hooks/
│   ├── useProject.ts           # Hook projet courant
│   ├── useSwipeBack.ts         # Geste retour par swipe
│   └── useNotificationScheduler.ts
│
├── types/                      # Types TypeScript (supabase.ts, etc.)
├── utils/                      # Constantes, streak logic, widget helpers
├── scripts/                    # Scripts utilitaires (upload covers, migrations)
├── assets/                     # Images, polices, icônes
│
├── ios/
│   ├── bestiebookbattle/       # App iOS native
│   ├── bbbWidget/              # Widget iOS SwiftUI (jauge + top 2)
│   └── WidgetRefreshModule/    # Module natif pour reloadAllTimelines
│
└── android/                    # Projet Android (expo prebuild)
```

---

## Base de données (Supabase / PostgreSQL)

### Tables principales

| Table | Description |
|---|---|
| `users` | Profil (Apple ID, email, nom, photo, préférences notif) |
| `challenges` | Projets de lecture (titre, auteur, pages, code invitation 6 chars, dates, couverture) |
| `challenge_participants` | Relation M:N users ↔ challenges |
| `user_progress` | Progression courante et streak par participant |
| `progress_history` | Historique des mises à jour de pages |
| `challenge_goals` | Objectifs personnalisés (deadlines, pages/jour) |

- **RLS** (Row Level Security) activé sur toutes les tables
- Triggers pour la génération automatique des codes d'invitation
- Buckets Storage : `profile-photos`, `book-covers`

---

## Authentification

- **Apple Sign In** uniquement (via `expo-apple-authentication` + Supabase Auth)
- Session persistée via `@react-native-async-storage/async-storage`
- Détection utilisateur existant vs nouveau → redirection onboarding si besoin
- Deep links pour callback OAuth

---

## State Management (Zustand)

Les stores sont synchronisés avec Supabase. Pattern typique :
1. L'action du store appelle le service Supabase
2. En cas de succès, le state local est mis à jour
3. Les subscriptions Realtime mettent à jour le state quand d'autres users agissent

Le `authStore` utilise `persist` avec AsyncStorage pour garder les données en attente d'onboarding.

---

## Navigation (Expo Router)

- **File-based routing** avec `unstable_settings.initialRouteName: '(tabs)'`
- **Typed routes** activées (`experiments.typedRoutes: true`)
- Auth guard dans le `_layout.tsx` racine → redirige vers `/auth/login` ou `/onboarding/role`
- Splash animé personnalisé (`AnimatedSplash`) avant affichage du contenu
- Transitions custom : slide from left (profile), slide from right (activity), modal (progress)

---

## Fonctionnalités clés

- **Challenges de lecture** : créer un challenge avec titre, auteur, nombre de pages, couverture, deadline
- **Invitations** : partager un code à 6 caractères pour rejoindre un challenge
- **Suivi de progression** : mettre à jour ses pages lues, voir le classement en temps réel
- **Classement** : leader avec couronne, comparaison entre participants
- **Streaks** : jours consécutifs de lecture, badges visuels
- **Graphiques** : courbes de progression sur 30 jours (Visx)
- **Notifications locales** : rappels quotidiens, alertes de dépassement, streaks en danger
- **Widget iOS** : widget SwiftUI affichant la jauge de progression et le top 2
- **Profil** : photo, nom, statistiques personnelles

---

## Modules natifs (iOS)

- **Widget SwiftUI** (`ios/bbbWidget/`) : affiche une jauge de progression et le top 2 participants
- **App Group** : `group.com.leasantos.bestiebookbattle` pour partager les données entre l'app et le widget
- **WidgetRefreshModule** : module natif Swift/ObjC pour appeler `WidgetCenter.shared.reloadAllTimelines()`
- **react-native-shared-group-preferences** : écriture des données vers l'App Group depuis React Native

---

## Build & Déploiement

- **EAS Build** : profils `development`, `preview`, `production`
- **App version source** : `remote` (gérée par EAS)
- **Auto-increment** du build number en production
- Variables d'environnement Supabase injectées par profil EAS
- Soumission App Store via `eas submit`

---

## Conventions de code

- **TypeScript strict** avec paths alias `@/*` → `./*`
- Composants fonctionnels React avec hooks
- Styles inline via `StyleSheet.create()` (pas de Tailwind natif, mais `tailwind-merge` + `clsx` + `cva` pour la composition de classes)
- Services séparés dans `services/supabase/` — jamais d'appels Supabase directs dans les composants
- Stores Zustand dans `stores/` — les composants consomment les stores, pas les services directement
- Babel : `babel-preset-expo` + `react-native-reanimated/plugin` (toujours en dernier)

---

## Scripts utilitaires

| Script | Commande | Description |
|---|---|---|
| Upload couvertures | `npm run upload-covers` | Upload des images de couvertures vers Supabase Storage |
| Migration notifs | `npm run migrate-notifications` | Migration des préférences de notifications |
| Fix search path | `npm run fix-search-path` | Correction du search path Supabase |
| Storybook | `npm run storybook-generate` | Génération des stories Storybook |

---

## Storybook

Configuration Storybook React Native (`.rnstorybook/`) avec stories pour les composants UI principaux (ProgressBar, StreakBadge, ParticipantCard, Avatar, Crown, Button3D…). Activable via Metro avec `withStorybook`.

---

## Notes importantes

- L'app utilise **Supabase** (pas Firebase) — le README peut mentionner Firebase par erreur
- L'orientation est **portrait uniquement**
- L'app ne supporte **pas les tablettes** (`supportsTablet: false`)
- Le `userInterfaceStyle` est en mode `automatic` (supporte light/dark)
