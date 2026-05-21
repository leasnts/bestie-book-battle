# Bestie Book Battle

Application iOS pour suivre une lecture commune entre amis. Chaque participant met à jour sa progression et voit en temps réel celle des autres, avec classement, streaks et graphiques.

> Voir [`CONTEXT.md`](./CONTEXT.md) pour le détail complet du contexte projet, et [`ROADMAP.md`](./ROADMAP.md) pour les évolutions prévues.

## Fonctionnalités

- Challenges de lecture partagés (livre, nombre de pages, deadline)
- Invitations par code à 6 caractères
- Classement en temps réel avec couronne pour le leader
- Streaks de jours consécutifs de lecture
- Graphiques de progression
- Notifications push (rappels quotidiens, alertes de dépassement)
- Widget iOS sur l'écran d'accueil
- Recherche de livres via l'API Google Books

## Stack technique

| Catégorie | Techno | Version |
|---|---|---|
| Framework | Expo (managed → prebuild) | SDK 55 |
| Runtime | React Native | 0.83 |
| Langage | TypeScript (strict) | 5.9 |
| Navigation | Expo Router (file-based) | 55 |
| State | Zustand (persist) | 5 |
| Backend | Supabase (Auth, Postgres, Storage, Realtime) | 2.93 |
| Auth | Sign in with Apple | — |
| UI | React Native Paper (Material Design 3) | 5 |
| Animations | react-native-reanimated + motion | 4 / 12 |
| Graphiques | @visx + react-native-chart-kit + d3-array | — |
| OTA Updates | expo-updates | 55 |
| Storybook | @storybook/react-native | 10 |

Plateforme cible : **iOS**. Android est généré via prebuild mais pas activement supporté.

## Installation

### 1. Cloner et installer

```bash
git clone https://github.com/leasnts/bestie-book-battle.git
cd bestie-book-battle
npm install
```

### 2. Configurer Supabase

1. Crée un projet sur [supabase.com](https://supabase.com)
2. Récupère les credentials dans **Settings → API**
3. Copie `.env.example` vers `.env` et remplis :
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<ton-ref>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
4. Active **Apple Sign In** dans Authentication → Providers
5. Exécute le script de setup SQL : `scripts/supabase-setup.sql` dans le SQL Editor

### 3. Lancer l'app

```bash
# iOS (nécessite Xcode)
npm run ios

# Storybook on-device
npm run storybook-generate && npm run ios
```

## Structure

```
bestie-book-battle/
├── app/                  # Écrans (Expo Router file-based)
│   ├── (tabs)/           # Navigation par onglets
│   ├── auth/             # Authentification
│   ├── onboarding/       # Premier lancement
│   ├── progress/         # Mise à jour de progression
│   └── project/          # Création/détail challenge
├── components/           # Composants réutilisables (UI, charts, icons)
├── stores/               # State global Zustand (auth, projects, progress…)
├── services/             # Supabase, notifications, API livres
├── hooks/                # Hooks personnalisés
├── utils/                # Helpers (streak, dates, formatage…)
├── types/                # Types TypeScript partagés
├── scripts/              # Migrations SQL, seed, scripts ops
├── supabase/             # Migrations et config Supabase
├── ios/                  # Projet natif iOS (prebuild) + widget
└── assets/               # Fonts, images, icônes
```

## Scripts utiles

| Script | Description |
|---|---|
| `npm run ios` | Lance l'app sur simulateur iOS |
| `npm run upload-covers` | Upload de couvertures de livres vers Supabase Storage |
| `npm run migrate-notifications` | Migration des préférences de notifications |

## Licence

Projet personnel — tous droits réservés.
