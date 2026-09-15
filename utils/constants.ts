/**
 * Constantes de l'application Bestie Book Battle
 * 
 * Ce fichier centralise toutes les valeurs constantes :
 * - Couleurs du thème (design system Figma)
 * - Espacements alignés avec Figma
 * - Tailles de police et polices personnalisées
 * - Styles de boutons réutilisables
 */

/**
 * Palette "noyer sur papier blanc" : chocolat chaud, plaid, lumière tamisée.
 *
 * L'encre est un marron noyer foncé, le papier un blanc à peine chaud. Aucun
 * noir pur ni blanc pur dans l'app : même les ombres et les reflets partent de
 * ces deux teintes, sinon ils ressortent gris et refroidissent tout.
 *
 * Les canaux RGB bruts servent à composer des transparences qui restent dans la
 * teinte (voir inkAlpha, shadowAlpha, creamAlpha plus bas).
 */
const INK_RGB = '51,35,26';     // #33231a
const SHADOW_RGB = '30,20,14';  // #1e140e
const CREAM_RGB = '253,252,250'; // #fdfcfa

/** Encre noyer transparente : teintes de fond, bordures, séparateurs sur fond clair */
export const inkAlpha = (alpha: number) => `rgba(${INK_RGB},${alpha})`;
/** Ombre marron très sombre transparente : ombres portées, ombres internes, voiles */
export const shadowAlpha = (alpha: number) => `rgba(${SHADOW_RGB},${alpha})`;
/** Blanc chaud transparent : reflets et bordures claires sur fond sombre */
export const creamAlpha = (alpha: number) => `rgba(${CREAM_RGB},${alpha})`;

/**
 * Voile crème posé sur le verre des cadres de l'accueil (`GlassSection`). Le fond
 * tiré de la couverture (`utils/coverPalette.ts`) se règle dessus pour garder
 * `text-tertiary` lisible dans les cadres : changer l'un, c'est recalculer l'autre.
 */
export const glassVeil = 0.56;

export const colors = {
  // Dark colors (onboarding, boutons principaux)
  dark950: '#1e140e',          // Fond splash screen
  dark900: '#33231a',          // Boutons principaux, texte principal — noyer foncé
  dark800: '#2a1c14',          // Fond carte livre

  // Light colors (backgrounds)
  white: '#fdfcfa',            // Background inputs, cartes — blanc à peine chaud, pas blanc pur
  black: '#1e140e',            // Uniquement pour les ombres portées, jamais pour du texte ni un fond
  bgSecondary: '#faf8f5',      // Background cartes non-sélectionnées
  bgLight: '#f5f3ef',          // Fond d'app, bouton back, bouton secondaire

  // Text colors — contrastes WCAG mesurés sur bgLight / bgSecondary / white
  textPrimary: '#33231a',      // Texte principal (900) — 13,6 / 14,2 / 14,7
  textSecondary: '#5a4536',    // Texte secondaire (700) — 8,1 / 8,5 / 8,8
  textTertiary: '#6b5546',     // Texte tertiaire (600) — 6,3 / 6,6 / 6,8
  textPlaceholder: '#7a6453',  // Placeholders (500) — 5,0 / 5,3 / 5,4
  textSubtle: '#e5e0d9',       // Texte subtle (300) — lisible uniquement sur fond sombre (12,6 sur dark800)

  // Border colors
  border: '#e5e0d9',           // Bordure inputs
  borderLight: '#eeebe6',      // Bordure secondaire

  // Alpha colors (pour les ombres et overlays)
  alphaBlack10: inkAlpha(0.1),
  alphaBlack02: inkAlpha(0.02),
  alphaWhite10: creamAlpha(0.1),
  alphaWhite20: creamAlpha(0.2),
  alphaWhite30: creamAlpha(0.3),
  alphaWhite90: creamAlpha(0.9),
  
  // Couleurs sémantiques (conservées de l'ancien)
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  
  // Couleurs spéciales
  crown: '#FCD34D',
  crownDark: '#F59E0B',
  streak: '#F97316',
  
  // Overlay
  overlay: shadowAlpha(0.5),
};

// Espacements alignés avec Figma (tokens spacing-*)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
  '6xl': 64,   // Pour les paddings top
};

// Rayons de bordure alignés avec Figma (tokens radius-*)
export const borderRadius = {
  xs: 2,       // Radius pour cover image
  sm: 8,
  md: 12,      // Bouton back, bouton upload
  lg: 20,      // Inputs
  xl: 24,      // Boutons principaux, cartes
  full: 9999,
};

/**
 * Polices : Fraunces douce pour les titres et les nombres, Nunito pour tout le reste.
 *
 * Chaque valeur est un nom de fichier chargé dans app/_layout.tsx (useFonts) :
 * sur iOS, la graisse vient du fichier, pas de `fontWeight`. Pour mettre du gras,
 * changer de police (body → bodyBold), jamais ajouter `fontWeight`.
 *
 * Les Fraunces sont des instances maison (assets/fonts) du fichier variable
 * Google Fonts, figées sur SOFT 100 (terminaisons arrondies) et WONK 0.
 * - display* : taille optique 24, pour les titres et scores jusqu'à ~40 px
 * - displayHero : taille optique 72, plus fine, réservée aux nombres géants (≥ 56 px)
 *
 * Fraunces est plus grande que Rokkitt à taille égale (hauteur de capitale +20 %) :
 * les tailles de titres ont été réduites d'environ 15 % pour garder la même présence.
 * Sous 13 px, les nombres passent en Nunito : un serif aussi petit devient illisible.
 */
export const fonts = {
  display: 'FrauncesSoft_600SemiBold',            // Titres, scores, numéros
  displayRegular: 'FrauncesSoft_400Regular',      // Logo « bestie book battle »
  displayBold: 'FrauncesSoft_700Bold',            // Saisies de nombres, toast, lettres « b » du logo
  displayHero: 'FrauncesSoftDisplay_600SemiBold', // Numéro de page géant, splash
  body: 'Nunito_400Regular',                      // Texte courant, champs
  bodyMedium: 'Nunito_500Medium',                 // Libellés discrets
  bodySemiBold: 'Nunito_600SemiBold',             // Prénoms, titres de ligne, libellés
  bodyBold: 'Nunito_700Bold',                     // Boutons, valeurs mises en avant
  bodyExtraBold: 'Nunito_800ExtraBold',           // Mon prénom dans le classement
};

// Tailles de police Figma
export const fontSize = {
  xs: 12,        // text-xs
  sm: 14,        // text-sm
  md: 16,        // text-md
  lg: 18,        
  xl: 20,
  '2xl': 24,     // display-xs
  '3xl': 36,     // display-md
  '4xl': 48,     // display-lg
  '5xl': 60,     // display-xl
  '6xl': 72,     // display-2xl (splash)
};

// Poids de police
export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Ombres Figma
export const shadows = {
  // Shadow-xs (inputs)
  xs: {
    shadowColor: shadowAlpha(0.05),
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  // Ombre bouton principal
  button: {
    shadowColor: shadowAlpha(0.25),
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  // Ombre bouton secondaire
  buttonLight: {
    shadowColor: shadowAlpha(0.1),
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  // Ombre carte sélectionnée
  cardSelected: {
    shadowColor: shadowAlpha(0.09),
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 4,
  },
};

// Styles de boutons réutilisables (depuis Figma)
// Convention : primary = bouton principal (sombre), secondary = bouton secondaire (blanc/clair)
// Le bouton "retour" est un Button3D variant="secondary" en mode icon-only (size="compact")
export const buttonStyles = {
  // Bouton primaire (bouton "nir" / principal) - dark avec inner shadows
  primary: {
    backgroundColor: colors.dark900,
    borderWidth: 1,
    borderColor: colors.alphaWhite30,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.xl,
    ...shadows.button,
  },
  // Bouton secondaire (blanc/clair) - utilisé pour Retour, Annuler, actions secondaires
  secondary: {
    backgroundColor: colors.bgLight,
    borderWidth: 1,
    borderColor: colors.alphaBlack10,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.xl,
    ...shadows.buttonLight,
  },
};

// Durées d'animation (en ms)
export const animationDuration = {
  fast: 150,
  normal: 300,
  slow: 500,
};

/**
 * Tokens de motion (design system Santos Studio).
 *
 * Les courbes sont stockées en points de contrôle bruts plutôt qu'en objets
 * Easing : ça évite d'importer Reanimated dans ce fichier de constantes, qui est
 * chargé absolument partout. Côté composant : `Easing.bezier(...motion.easeOutQuart)`.
 *
 * Règle : jamais de bounce ni d'elastic. Un objet réel ne rebondit pas quand il
 * s'arrête, il décélère.
 */
export const motion = {
  duration: {
    /** Feedback immédiat : appui bouton, toggle, changement de couleur */
    instant: 150,
    /** Changement d'état : ouverture de menu, hover, tooltip */
    standard: 200,
    /** Changement de layout : accordéon, modal, tiroir */
    slow: 300,
    /** Animation d'entrée : apparition d'écran, révélation de contenu */
    entrance: 400,
  },
  /** Décalage entre deux éléments d'une même entrée en cascade */
  stagger: 60,
  easing: {
    /** Doux et raffiné — la courbe par défaut */
    easeOutQuart: [0.25, 1, 0.5, 1] as const,
    /** Légèrement plus vif */
    easeOutQuint: [0.22, 1, 0.36, 1] as const,
    /** Affirmé, décidé */
    easeOutExpo: [0.16, 1, 0.3, 1] as const,
    /** Pour les éléments qui sortent */
    easeInQuart: [0.5, 0, 0.75, 0] as const,
  },
};

// Milestones pour les célébrations
export const milestones = [10, 25, 50, 100, 150, 200, 250, 300, 400, 500];

// Messages de célébration
export const celebrationMessages = [
  '🎉 Bravo ! Continue comme ça !',
  '📚 Tu avances bien !',
  '🌟 Excellent travail !',
  '🔥 Tu es en feu !',
  '💪 Impressionnant !',
  '🚀 Inarrêtable !',
];

// Clés AsyncStorage
export const storageKeys = {
  USER: '@bestie_book_battle/user',
  PROJECTS: '@bestie_book_battle/projects',
  PROGRESS: '@bestie_book_battle/progress',
  NOTIFICATIONS: '@bestie_book_battle/notifications',
};

// Préférences de notifications par défaut (cohérent avec la DB)
// Format aligné avec notification_preferences JSONB dans users
export const DEFAULT_NOTIFICATION_PREFERENCES = {
  enabled: true,
  daily_reminder: true,
  daily_reminder_time: '20:00',
  competitive_alerts: true,
  milestone_alerts: true,
  streak_alerts: true,
  goal_reminders: true,
  friend_activity: true,
  inactivity_alerts: true,
  other_finished_book: true,
} as const;

