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
 * Palette « chocolat sur papier blanc » (charte Lowki, #131) : chocolat chaud,
 * plaid, lumière tamisée.
 *
 * L'encre est le chocolat Lowki, le papier un blanc à peine chaud. Aucun
 * noir pur ni blanc pur dans l'app : même les ombres et les reflets partent de
 * ces deux teintes, sinon ils ressortent gris et refroidissent tout.
 *
 * Les canaux RGB bruts servent à composer des transparences qui restent dans la
 * teinte (voir inkAlpha, shadowAlpha, creamAlpha plus bas).
 */
const INK_RGB = '72,43,36';     // #482b24 — chocolat Lowki foncé
const SHADOW_RGB = '46,27,22';  // #2e1b16 — chocolat profond
const CREAM_RGB = '253,252,250'; // #fdfcfa

/** Encre chocolat transparente : teintes de fond, bordures, séparateurs sur fond clair */
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

/**
 * Voile crème des commandes en verre (`GlassButton`, barre d'onglets). Sans lui,
 * le verre vire au gris plat sur un fond clair comme celui d'un sheet.
 */
export const glassControlVeil = 0.25;

/**
 * Les boutons ronds à icône, partout dans l'app (`RoundButton`, `GlassButton`) :
 * UNE seule taille, jamais d'exception (règle de Lea, 2026-10-02). 44 pt, la
 * taille tactile minimale de la HIG ; l'icône au même corps dans les deux.
 */
export const ROUND_BUTTON_SIZE = 44;
export const ROUND_BUTTON_ICON = 19;
/** L'icône pleine (■ arrêter) paraît plus grosse : un peu plus petite */
export const ROUND_BUTTON_ICON_FILLED = 15;

/**
 * La charte officielle Lowki (Lea, 2026-10-08) : quatre tons, chacun en paire
 * clair → foncé. Une paire est déjà un dégradé (clair en haut, foncé en bas).
 *
 * Ton sur ton : sur un fond `light`, la forme ou le titre prend le `dark` de la
 * même paire, avec un liseré clair dessous (gravé). Contraste faible voulu : le
 * texte qu'il faut lire (sous-titre, corps) passe en chocolat `dark` sur beurre
 * et beige, en beurre `light` sur rouge et chocolat (≥ 5,3:1, mesuré).
 *
 * Branchée sur l'app (#131) : l'encre (`colors.textPrimary`, `inkGradient`) est
 * le chocolat, l'accent (`colors.accent`, `accentGradient`) le rouge.
 */
export const lowki = {
  butter: { light: '#F5E6A8', dark: '#D6C36F' },
  beige: { light: '#C5A47E', dark: '#9F7C59' },
  red: { light: '#A62F43', dark: '#7C2031' },
  chocolate: { light: '#633D32', dark: '#482B24' },
} as const;

export const colors = {
  // Dark colors (onboarding, boutons principaux)
  dark950: '#2e1b16',          // Chocolat profond : bas des dégradés d'encre, ombres
  dark900: '#482b24',          // Boutons principaux, texte principal — chocolat Lowki foncé
  dark800: '#3a231d',          // Fond carte livre

  // Light colors (backgrounds)
  white: '#fdfcfa',            // Background inputs, cartes — blanc à peine chaud, pas blanc pur
  black: '#2e1b16',            // Uniquement pour les ombres portées, jamais pour du texte ni un fond
  bgSecondary: '#faf8f5',      // Background cartes non-sélectionnées
  bgLight: '#f5f3ef',          // Bouton back, bouton secondaire, fonds de sheet
  bgApp: '#ede8e0',            // Fond des écrans (onglets, activité) : un cran sous les cadres pour qu'ils ressortent

  // Text colors — contrastes WCAG mesurés sur bgLight / bgSecondary / white
  textPrimary: '#482b24',      // Texte principal (900) — chocolat Lowki foncé — 11,5 / 12,0 / 12,4
  textSecondary: '#633d32',    // Texte secondaire (700) — chocolat Lowki clair — 8,4 / 8,8 / 9,1
  textTertiary: '#775046',     // Texte tertiaire (600) — 6,3 / 6,6 / 6,8
  textPlaceholder: '#8a5d51',  // Placeholders (500) — 5,0 / 5,3 / 5,4
  textSubtle: '#e5e0d9',       // Texte subtle (300) — lisible uniquement sur fond sombre (11,1 sur dark800)

  // Accent rouge Lowki, pour les traits (cf. accentGradient pour les surfaces) — 6,1 / 6,4 / 6,6
  accent: '#a62f43',

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

/**
 * L'accent rouge Lowki : la seule couleur d'accent de l'app, pour ce qui dit
 * « état » ou « choisi » (progression, sélection, interrupteur, signets). La
 * navigation (onglets, +, bibliothèque) reste en encre. Les boutons d'action restent en encre : l'encre agit, l'accent dit
 * où l'on en est. Un seul emplacement, pour qu'une couleur de club puisse un
 * jour le remplacer (DESIGN.md › Colors).
 *
 * - `accentGradient` pour toute surface remplie (jamais d'aplat), clair en haut →
 *   foncé en bas ; crème dessus : 6,6:1 sur le clair ;
 * - `colors.accent` pour les traits : bordures, points, icônes, interrupteur.
 */
export const accentGradient = [lowki.red.light, lowki.red.dark] as const;

/**
 * Le rouge des suppressions (glisser pour supprimer) : le seul rouge de l'app,
 * réservé à ce geste, comme sur iOS. Blanc dessus : 4,9:1 au plus clair.
 */
export const dangerGradient = ['#d4453f', '#a92f2a'] as const;

/** L'encre en surface (boutons d'action) : chocolat Lowki, clair en haut → foncé en bas ; crème dessus : 9,1:1 */
export const inkGradient = [lowki.chocolate.light, lowki.chocolate.dark] as const;

/** Le papier beige des cadres posés dans un sheet (GlassSection `paper`) */
export const paperFrameGradient = ['#f1ebe2', '#e7dfd2'] as const;

/**
 * Les six post-it du carnet — tirés de la charte Lowki (Lea, 2026-10-08).
 *
 * Chacune vient d'un ton de la charte : le rouge pâli en vieux rose, la terre
 * cuite entre rouge et chocolat, le beurre, le beurre foncé en olive, le beige.
 * Seul le bleu de Snif sort de la charte (les larmes), gardé grisé pour rester
 * de la famille.
 *
 * Une couleur = une catégorie, la même pour tout le club. L'encre `ink` garde
 * au moins 6:1 sur chacune (mesuré), donc le texte d'une note reste lisible
 * quelle que soit la catégorie. La couleur n'est jamais la seule information :
 * le nom de la catégorie s'affiche toujours (DESIGN.md › Carnet).
 */
export const postIt = {
  rose: '#e3a4a9',    // J’adore — rouge Lowki pâli
  peche: '#e5b096',   // Spicy — terre cuite, entre rouge et chocolat
  bleu: '#c1d3da',    // Snif — bleu grisé, hors charte
  jaune: '#ecd990',   // Ahahah — beurre Lowki
  sauge: '#d6d1a6',   // Théorie — olive, beurre foncé pâli
  sable: '#d6b896',   // Note — beige Lowki
};

/**
 * Le ton sur ton de chaque post-it (DESIGN.md › Charte Lowki) : la même teinte
 * un peu moins saturée, un cran plus foncée, posée pleine. Chaque ton est à la même distance de sa
 * note (≈ 9 % de clarté pour le filigrane, 15 % pour la couture), pour qu'aucun
 * ne ressorte plus qu'un autre. En dessous, le voile sombre du bas de la note
 * (`NoteSticker`) avale le filigrane. Le numéro de page aussi, plus foncé
 * (≈ 37 %) pour se lire : au moins 4:1 sur sa note (texte gras). Le texte reste à l'encre.
 */
export const postItDeep: Record<keyof typeof postIt, { mark: string; stitch: string; page: string }> = {
  rose: { mark: '#c18a8f', stitch: '#ae787d', page: '#673c41', },
  peche: { mark: '#c4957f', stitch: '#b0836d', page: '#6a4634', },
  bleu: { mark: '#a6b6bc', stitch: '#94a3a9', page: '#556266', },
  jaune: { mark: '#cdbc7c', stitch: '#b9a96a', page: '#756731', },
  sauge: { mark: '#b8b48e', stitch: '#a6a17c', page: '#646041', },
  sable: { mark: '#b79c7f', stitch: '#a48a6d', page: '#604c34', },
};

/** Le ton sur ton d'une couleur de post-it, `null` si ce n'en est pas une */
export function postItDeepOf(color: string | null | undefined) {
  const key = (Object.keys(postIt) as (keyof typeof postIt)[]).find((k) => postIt[k] === color);
  return key ? postItDeep[key] : null;
}

/**
 * La matière des autocollants de notes (`NoteSticker`), hors couleur de
 * catégorie : le papier nu d'une note verrouillée, et le dos du coin décollé.
 * Changer le thème des autocollants = changer `postIt` et ceci, rien d'autre :
 * tout l'app lit les couleurs d'ici (via `ANNOTATION_CATEGORIES`).
 */
export const stickerMaterial = {
  locked: '#efe9df',
  flap: ['#fdfbf8', '#d8d1c6'] as const,
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
 * Polices : Martian Grotesk partout, et un seul mot d'accent par titre en
 * Welcome Valentines (voir AccentTitle).
 *
 * Chaque valeur est un nom de fichier chargé dans app/_layout.tsx (useFonts) :
 * sur iOS, la graisse vient du fichier, pas de `fontWeight`. Pour mettre du gras,
 * changer de police (body → bodyBold), jamais ajouter `fontWeight`.
 *
 * Les Martian sont des instances maison (assets/fonts) du fichier variable
 * (licence OFL) :
 * - display* : largeur 112, plus large et plus franche, pour les titres et nombres
 * - body* : largeur 100, pour tout ce qui se lit vraiment
 *
 * Welcome Valentines : licence « usage personnel » pour l'instant, la licence
 * commerciale est à acheter avant la sortie (#129).
 */
export const fonts = {
  display: 'MartianGroteskWide_800ExtraBold',     // Titres, scores, numéros
  displayRegular: 'MartianGroteskWide_700Bold',   // Logo « bestie book battle »
  displayBold: 'MartianGroteskWide_900Black',     // Saisies de nombres, toast, lettres « b » du logo
  displayHero: 'MartianGroteskWide_700Bold',      // Numéro de page géant, splash
  accent: 'WelcomeValentines_400Regular',         // Le mot d'accent d'un titre, jamais plus
  body: 'MartianGrotesk_400Regular',              // Texte courant, champs
  bodyMedium: 'MartianGrotesk_500Medium',         // Libellés discrets
  bodySemiBold: 'MartianGrotesk_600SemiBold',     // Prénoms, titres de ligne, libellés
  bodyBold: 'MartianGrotesk_700Bold',             // Boutons, valeurs mises en avant
  bodyExtraBold: 'MartianGrotesk_800ExtraBold',   // Mon prénom dans le classement
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

