# Bestie Book Battle 📚

Une application React Native (Expo) pour suivre une lecture commune entre amis. Chaque personne met à jour sa progression quotidienne et voit l'avancée des autres.

## Fonctionnalités

- 📖 **Projets de lecture partagés** - Créez un projet avec le titre du livre et le nombre de pages
- 👥 **Invitations par code** - Invitez vos amis avec un code unique à 6 caractères
- 📊 **Classement en temps réel** - Voyez qui est en tête avec la couronne 👑
- 🔥 **Streaks** - Suivez vos jours consécutifs de lecture
- 📈 **Graphiques** - Visualisez la progression sur 30 jours
- 🔔 **Notifications** - Rappels quotidiens et alertes quand quelqu'un vous dépasse

## Stack Technique

- **Framework:** Expo (React Native)
- **Language:** TypeScript
- **Navigation:** Expo Router
- **State:** Zustand
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **UI:** React Native Paper
- **Charts:** react-native-chart-kit

## Installation

### 1. Cloner le projet

```bash
cd bestie-book-battle
npm install
```

### 2. Configurer Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Créez un nouveau projet
3. Ajoutez une app Web
4. Copiez les credentials dans `services/firebase/config.ts`
5. Activez **Authentication** (Email/Password)
6. Créez une base **Firestore Database**
7. Activez **Storage**

### 3. Lancer l'application

```bash
# iOS
npm run ios
```

## Structure du Projet

```
bestie-book-battle/
├── app/                      # Écrans (Expo Router)
│   ├── (tabs)/               # Navigation par onglets
│   │   ├── index.tsx         # Home - Liste des projets
│   │   ├── activity.tsx      # Feed d'activité
│   │   └── profile.tsx       # Profil utilisateur
│   ├── auth/                 # Authentification
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── project/              # Gestion des projets
│   │   ├── [id].tsx          # Détail projet
│   │   ├── create.tsx        # Créer un projet
│   │   └── join.tsx          # Rejoindre un projet
│   └── progress/
│       └── update.tsx        # Mettre à jour sa progression
├── components/
│   ├── ui/                   # Composants UI
│   │   ├── ProgressBar.tsx
│   │   ├── ParticipantCard.tsx
│   │   ├── ProjectCard.tsx
│   │   └── StreakBadge.tsx
│   ├── charts/
│   │   └── ProgressChart.tsx
│   └── common/
│       ├── Avatar.tsx
│       └── Crown.tsx
├── services/
│   ├── firebase/             # Services Firebase
│   │   ├── config.ts
│   │   ├── auth.ts
│   │   ├── firestore.ts
│   │   └── storage.ts
│   └── notifications.ts
├── stores/                   # État global (Zustand)
│   ├── authStore.ts
│   ├── projectStore.ts
│   └── progressStore.ts
├── types/                    # Types TypeScript
│   └── index.ts
├── utils/                    # Utilitaires
│   ├── constants.ts          # Couleurs, espacements
│   ├── streak.ts             # Calcul des streaks
│   └── share.ts              # Partage et invitations
└── hooks/                    # Hooks personnalisés
    ├── useProject.ts
    └── useProgress.ts
```

## Design System

### Couleurs

| Couleur | Hex | Usage |
|---------|-----|-------|
| Primary | `#6366F1` | Couleur principale (indigo) |
| Secondary | `#EC4899` | Accents (pink) |
| Success | `#10B981` | Succès, progression |
| Crown | `#FCD34D` | Couronne du leader |
| Streak | `#F97316` | Badge de streak |

## Fonctionnement

### Création d'un projet
1. Cliquez sur "+" sur l'écran d'accueil
2. Entrez le titre du livre et le nombre de pages
3. Un code d'invitation unique est généré

### Rejoindre un projet
1. Allez dans Profil > "Rejoindre un projet"
2. Entrez le code à 6 caractères
3. Vous êtes automatiquement ajouté au projet

### Mise à jour de progression
1. Ouvrez un projet
2. Cliquez sur "Mettre à jour"
3. Entrez votre page actuelle
4. Célébration automatique pour les milestones !

## Améliorations futures

- [ ] Commentaires sur les progressions
- [ ] Badges et achievements
- [ ] Mode sombre
- [ ] Intégration Goodreads API
- [ ] Export des statistiques

## Licence

MIT

