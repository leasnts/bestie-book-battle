---
name: Bestie Book Battle
description: Le carnet de lecture partagé — cosy fait main (papier, aquarelle, maille), encre noyer en dégradé sur papier blanc chaud, animé par des réactions taquines
colors:
  ink: "#33231a"
  ink-deep: "#1e140e"
  ink-panel: "#2a1c14"
  paper: "#f5f3ef"
  surface: "#fdfcfa"
  surface-raised: "#faf8f5"
  text-primary: "#33231a"
  text-secondary: "#5a4536"
  text-tertiary: "#6b5546"
  text-placeholder: "#7a6453"
  text-subtle: "#e5e0d9"
  rule: "#e5e0d9"
  rule-light: "#eeebe6"
  crown: "#FCD34D"
  crown-deep: "#F59E0B"
  streak: "#F97316"
  success: "#10B981"
  warning: "#F59E0B"
  danger: "#EF4444"
  lowki-butter: "#F5E6A8"
  lowki-butter-deep: "#D6C36F"
  lowki-beige: "#C5A47E"
  lowki-beige-deep: "#9F7C59"
  lowki-red: "#A62F43"
  lowki-red-deep: "#7C2031"
  lowki-chocolate: "#633D32"
  lowki-chocolate-deep: "#482B24"
typography:
  hero:
    fontFamily: "MartianGroteskWide_700Bold, system-ui, sans-serif"
    fontSize: "108px"
    fontWeight: 600
    letterSpacing: "-1.6px"
  display:
    fontFamily: "MartianGroteskWide_800ExtraBold, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: "36px"
    letterSpacing: "-0.3px"
  headline:
    fontFamily: "MartianGroteskWide_800ExtraBold, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: "28px"
  score:
    fontFamily: "MartianGroteskWide_800ExtraBold, system-ui, sans-serif"
    fontSize: "21px"
    fontWeight: 600
  title:
    fontFamily: "MartianGrotesk_600SemiBold, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: "24px"
  body:
    fontFamily: "MartianGrotesk_400Regular, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
  label:
    fontFamily: "MartianGrotesk_500Medium, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: "20px"
  button:
    fontFamily: "MartianGrotesk_700Bold, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: "24px"
  caption:
    fontFamily: "MartianGrotesk_600SemiBold, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "16px"
gradients:
  # Jamais d'aplat : toute surface remplie est un dégradé vertical, clair en haut, foncé en bas
  ink:
    from: "#5a4536"
    to: "#1e140e"
    direction: "top-to-bottom"
rounded:
  xs: "2px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "32px"
  4xl: "48px"
  6xl: "64px"
components:
  button-primary:
    backgroundColor: "{gradients.ink}"
    textColor: "{colors.surface}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "20px 24px"
  button-primary-pressed:
    backgroundColor: "{gradients.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.xl}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "20px 24px"
  button-compact:
    backgroundColor: "{gradients.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "16px 20px"
  badge-streak:
    backgroundColor: "rgba(51,35,26,0.1)"
    textColor: "{colors.text-tertiary}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    padding: "3px 7px"
  avatar:
    rounded: "{rounded.sm}"
    size: "28px"
  sheet:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
---

# Design System: Bestie Book Battle

## Overview

**North Star : le carnet de lecture partagé.**

Un cahier dans lequel plusieurs personnes écrivent. Encre noyer sur papier blanc chaud
grené, titres à empattements, marges généreuses, aucune décoration gratuite.
L'ambiance visée : automne, chocolat chaud, plaid, lumière tamisée. Le système
est quasi monochrome par choix : la couleur n'apparaît que lorsqu'elle porte du
sens — une couronne, une flamme, une alerte.

La chaleur vient de trois endroits : la **palette** elle-même (marron et blanc chaud,
jamais de noir ni de blanc purs), les **illustrations maison** (PopEyes,
couronne, crâne), et le **mouvement** — le
compteur qui roule, la feuille qui tombe quand on enregistre des pages, les
lignes du classement qui glissent quand quelqu'un en double une autre. Le
système est sobre à l'arrêt et taquin en action.

Anti-référence contraignante : **Goodreads et Babelio**. Pas de fiche produit,
pas de note sur 5, pas de densité de catalogue.

**Lexique des notes** (Lea, 2026-09-29), le même partout, à l'écran comme pour
VoiceOver :
- le geste, c'est **annoter** un livre, une page (« Annoter la page ») ;
- ce qu'on ajoute, c'est une **note** : une pensée, un avis ou un élément à
  retenir, écrite, dite (note vocale), citée ou en emoji ;
- les notes vivent dans le **carnet de notes**. On y **ajoute** une note.
Jamais « post-it », « noter », « coller » ni « p. 157 » seul là où il faut dire
ce que fait le bouton.

Plateforme : **iOS uniquement**. La HIG gouverne la structure, la navigation et
l'interaction ; la marque s'exprime dans ce que la plateforme laisse ouvert —
typographie, mouvement, illustration, matières.

### Direction artistique

**Règle non négociable, posée par Lea le 2026-09-17, valable pour toute l'app.**

**Cosy fait main, mais pas trop.** L'app a la chaleur d'un objet fait main — un
carnet, un plaid, une écharpe tricotée — posé dans une app iOS 26 nette et
moderne. Les **matières** apportent la douceur ; la **structure** (navigation,
grilles, composants, verre natif) reste précise et actuelle.

Les matières de l'app :
- **Le papier** : la texture grenée du fond, jamais un blanc lisse et numérique.
- **L'aquarelle** : lavis translucides, bords légèrement chargés de pigment,
  couleurs qui se fondent l'une dans l'autre. Pour les fonds, les taches de
  couleur, les zones d'accent.
- **La maille — crochet, tricot** : points, rangs, fils, pour des motifs et des
  textures ponctuels (bords, séparateurs, états, illustrations). À explorer.

**D'où vient la couleur** : d'une couverture **seulement quand l'écran parle d'un
livre précis** (sa fiche, son accueil, son carnet). Ailleurs — bibliothèque,
profil, réglages, écrans qui mélangent plusieurs livres — aucun livre ne justifie
une couleur : aquarelle et fonds restent dans des **tons neutres chauds** (papier,
sable, noyer clair).

Ce que « pas trop » veut dire, concrètement :
- les matières sont **discrètes** et servent l'écran ; elles ne deviennent jamais
  le sujet ;
- une matière par zone, pas un collage : pas de papier + aquarelle + tricot au même
  endroit ;
- pas de clichés fait-main (washi tape, boutons cousus, coutures en pointillés
  partout, phrases en police manuscrite, fleurs séchées) ; seule exception, le
  **mot d'accent** d'un titre (voir Typography) ;
- **garde-fou** : si un écran évoque une boutique de loisirs créatifs, un
  scrapbook, un blog DIY ou une carte de vœux, il a dérivé.

**Dégradés, jamais d'aplat** — voir Colors › Dégradés, jamais d'aplat.

## Colors

**Stratégie : restrained.** Neutres teintés + **une seule couleur d'accent, le lie
de vin**, et des couleurs uniquement porteuses de sens. Décidé par Lea le
2026-09-24 (#73) : avant, chaque écran prenait sa teinte (noyer, encre, lie de
vin…) et ça partait dans tous les sens.

### Charte Lowki

**La charte officielle de la marque** (Lea, 2026-10-08, `color palette lowki.png`).
Quatre tons, chacun en **paire clair → foncé** : la paire est le dégradé tout
prêt. Tokens : `lowki` dans `utils/constants.ts`.

| Ton | Clair (haut) | Foncé (bas) |
|---|---|---|
| Beurre | `#F5E6A8` | `#D6C36F` |
| Beige | `#C5A47E` | `#9F7C59` |
| Rouge | `#A62F43` | `#7C2031` |
| Chocolat | `#633D32` | `#482B24` |

**Ton sur ton** : sur le clair d'une paire, la forme ou le titre prend
**exactement le foncé de la même paire**, avec un liseré clair dessous (gravé
dans le papier), comme le logo. Jamais deux tons qui contrastent l'un sur
l'autre (beurre sur rouge, rouge sur beurre…) pour la forme.

**Ce qui doit se lire** (sous-titre, corps de texte) sort du ton sur ton :
chocolat `#482B24` sur beurre et beige, beurre `#F5E6A8` sur rouge et chocolat
(5,3:1 au moins, mesuré).

Elle remplace la palette du 2026-10-05 (rouge `#9c1f27`, beige `#c0a283`,
chocolat `#6b351d`). Déjà utilisée : les captures App Store. **L'app n'est pas
encore passée dessus** : basculer l'encre, l'accent et le papier vers ces tons
est l'issue #131, à comparer sur 2-3 écrans avant de trancher. D'ici là, les
trois tons ci-dessous restent ceux de l'app.

### Trois tons, pas plus

La palette de l'app tient en **trois tons** (Lea, 2026-09-24) :

1. **Lie de vin** — l'accent : états et choix (`accent`, `accentGradient`) ;
2. **Chocolat foncé** — l'encre : texte, actions, boutons (`ink` `#33231a`, dégradé
   `#5a4536` → `#1e140e`). Le marron reste central, il n'est pas remplacé ;
3. **Beige / blanc** — le papier : fonds, surfaces, écru des signets, aquarelle
   (`paper`, `surface`, crème).

Tout nouvel élément prend l'un des trois. Exceptions : les couleurs d'une
couverture quand l'écran parle de ce livre, et les couleurs porteuses de sens
ci-dessous (à ramener un jour vers ces tons).

### L'accent lie de vin

| Token | Valeur | Rôle |
|---|---|---|
| `accentGradient` | `#8c3b4c` → `#5e1f2e` | Toute surface remplie d'accent, toujours en dégradé. Crème dessus : 7,9:1. |
| `colors.accent` | `#7a2e3e` | Traits d'accent : bordures, points, icônes, filets, interrupteur. |

**La règle : l'encre agit, l'accent dit où l'on en est.**
- **Accent** : ce qui dit un **état** ou un **choix** — progression (piste de
  l'accueil, ma barre au classement, caps passés, signets de la bibliothèque),
  sélection (filtres, chips du carnet, cartes et catégories choisies, réaction
  choisie), interrupteur activé.
- **Encre** : les **actions** (boutons primaires, + en verre), la **navigation**
  (onglet actif, bouton bibliothèque : la même encre que le chiffre de ma page),
  le texte, les repères à atteindre (cap en cours, fin du livre).
- **Neutre** : le décor (étagères, aquarelle, papier).

L'accent est un **emplacement unique** : c'est lui qu'une couleur de club
remplacera un jour (cf. « La couleur appartient au club »).

### Dégradés, jamais d'aplat

**Règle non négociable, posée par Lea le 2026-09-17.** Un aplat de couleur fait
daté. Toute surface **remplie** de couleur est un **dégradé vertical** : la
teinte un peu plus claire en haut, la même teinte un peu plus foncée en bas,
comme éclairée par-dessus.

| Dégradé | Haut | Bas | Pour |
|---|---|---|---|
| `ink` | `#5a4536` (`text-secondary`) | `#1e140e` (`ink-deep`) | Boutons primaires, pastilles et disques encre, capsules, remplissages de progression |

- **Concerne** : boutons, boutons ronds, pastilles, disques, capsules, badges,
  barres et anneaux de progression, puces pleines.
- **Ne concerne pas** : le texte, les icônes, les filets, les bordures fines, les
  fonds de page (papier) et de sheet — ils restent unis.
- **Une autre couleur** suit le même principe : deux valeurs **de la même
  teinte**, du clair au foncé. Pas un arc-en-ciel.
- **L'écart reste doux** : on doit sentir le volume, pas voir une bande claire et
  une bande sombre.
- En code : `LinearGradient` (expo-linear-gradient) ou un `LinearGradient` SVG,
  vertical (`start {x:0,y:0}` → `end {x:0,y:1}`). Déjà appliqué : la pastille
  « terminé » de la bibliothèque. Les aplats restants sont à convertir (issue
  dédiée sur le BBB Roadmap).

### Encres et papiers

| Token | Valeur | Rôle |
|---|---|---|
| `ink` | `#33231a` | Encre noyer foncé. Texte principal, boutons primaires. |
| `ink-deep` | `#1e140e` | Fond du splash. Base de toutes les ombres. |
| `ink-panel` | `#2a1c14` | Fond des cartes livre. |
| `paper` | `#f5f3ef` | Fond d'app. Porte une texture noise à 5% d'opacité. |
| `surface` | `#fdfcfa` | Cartes, champs, sheets. Blanc à peine chaud, ni `#ffffff` ni crème. |
| `surface-raised` | `#faf8f5` | Cartes non sélectionnées. |

Les neutres ne sont pas des gris : ils tirent vers le marron noyer. **Aucun noir
ni blanc pur dans l'app**, ombres et reflets compris — un `rgba(0,0,0,…)` ressort
gris sur le papier et refroidit tout. Les transparences passent par trois helpers
de `utils/constants.ts` : `inkAlpha()` (teintes et bordures sur fond clair),
`shadowAlpha()` (ombres, voiles), `creamAlpha()` (reflets et bordures claires sur
fond sombre). Les illustrations PNG sont passées en duotone noyer/crème.
Toute extension de la palette doit rester sur cette teinte chaude.

### Texte

`text-primary` `#33231a` → `text-secondary` `#5a4536` → `text-tertiary` `#6b5546`
→ `text-placeholder` `#7a6453` → `text-subtle` `#e5e0d9`.

**Contraste mesuré** (ratios WCAG calculés, pas estimés) :

| Texte | sur `paper` #f5f3ef | sur `surface` #fdfcfa | sur `surface-raised` #faf8f5 |
|---|---|---|---|
| `text-primary` | 13,57 ✅ | 14,67 ✅ | 14,19 ✅ |
| `text-secondary` | 8,10 ✅ | 8,76 ✅ | 8,47 ✅ |
| `text-tertiary` | 6,29 ✅ | 6,80 ✅ | 6,57 ✅ |
| `text-placeholder` | 5,02 ✅ | 5,43 ✅ | 5,25 ✅ |
| `text-subtle` | 1,18 ❌ | 1,28 ❌ | 1,24 ❌ |

**`text-subtle` (`#e5e0d9`) n'est lisible que sur fond sombre.** À 1,2:1 sur fond
clair il est invisible ; sur les cartes `ink-panel` (`#2a1c14`) il atteint
12,6:1. C'est donc un token à double emploi : bordure sur fond clair, **texte sur
fond sombre**. Les auteurs de livres sur les cartes sombres de l'onboarding et de
l'invitation l'utilisent correctement. Ne jamais le poser sur `paper`,
`surface` ou `surface-raised`.

**Les couleurs porteuses de sens ne portent pas de texte.** `crown` (`#FCD34D`,
1,32:1) et `streak` (`#F97316`, 2,57:1) sur fond clair sont invisibles en texte
et insuffisants en icône seule. Ils fonctionnent en aplat ou en illustration ;
l'information doit être doublée par une forme ou un libellé.

### Couleurs porteuses de sens

| Token | Valeur | Quand |
|---|---|---|
| `crown` / `crown-deep` | `#FCD34D` / `#F59E0B` | Le leader du classement. |
| `streak` | `#F97316` | Jours consécutifs de lecture. |
| `success` `warning` `danger` | `#10B981` `#F59E0B` `#EF4444` | États système. |

**Décision ouverte.** Les trois couleurs d'état sont les valeurs par défaut de
Tailwind, arrivées avec un template et jamais choisies pour ce projet. Elles
fonctionnent et sont universellement lues, mais elles n'appartiennent pas
visuellement à l'encre. À reteinter vers la teinte du système, ou à assumer comme
telles — non tranché.

### La couleur appartient au club, pas à l'app

Feature à venir, et principe directeur : **chaque book club choisit sa couleur**.
Le système reste sobre pour que cette couleur ait de la place, et c'est elle
qui signe l'identité d'un club donné. En attendant, l'emplacement d'accent porte
le lie de vin (`accent`, `accentGradient`).

Conséquences sur la construction : réserver un emplacement d'accent unique,
paramétrable par challenge, plutôt que de disséminer des couleurs codées en dur.
Tout ce qui pourrait un jour porter la couleur du club — barres de progression,
états actifs, accents de classement — doit lire cet emplacement dès maintenant.
L'accent ne doit jamais être la seule information : le club daltonien existe.

### Fond de l'accueil : neutre

L'accueil a un fond **neutre** (`CoverBackdrop` sans palette) : quatre taches
radiales douces sur `paper`, placées comme sur la maquette, en beige, sable et
chocolat clair (`NEUTRAL_BACKDROP` `#cdb8a3` / `#a88f7b` / `#e2d4c4`), texture
noise par-dessus. Sans rien derrière, le verre des cadres ne se verrait pas.

Avant, les taches prenaient **les couleurs de la couverture** du livre en cours.
Retiré le 2026-09-24 : ça faisait une couleur de plus sur l'écran, hors des
trois tons. La couverture elle-même suffit à dire de quel livre on parle.

La mécanique reste disponible pour un écran qui parlerait d'un seul livre
(`<CoverBackdrop palette={…} />`) :
- **Extraction** (`utils/coverPalette.ts`) : vignette de 48 px, les **3 couleurs
  dominantes**, gris, noirs et blancs ignorés ;
- **Stockage** : `challenges.cover_palette`, calculée une fois, même fond pour
  tout le club ;
- **Dosage** : 62 / 42 / 32 / 22 % d'opacité au plus, moins si la couleur est
  sombre (`text-tertiary` garde 5:1 dans un cadre en verre posé dessus) ;
- **Changement de palette** : fondu de 400 ms, sauté avec « Réduire les animations ».

## Typography

**Une voix nette, un mot qui chante** : Martian Grotesk (grotesque géométrique,
licence OFL) pour tout, en version large et grasse pour les titres et les
nombres. Dans un titre, **un seul mot d'accent** peut passer en Welcome
Valentines (feutre manuscrit), **de la couleur du titre** (jamais `accent`),
1,25× plus grand : l'œil glisse sur la phrase et s'arrête sur lui (« Carnet de
*notes* »).

**Mot d'accent, les règles** :
- un mot, jamais une phrase, et un seul par écran ;
- dans un titre (`SheetPage` / `SheetPageHeader` prop `accent`, ou `AccentWord`
  dans un `<Text>`), jamais en texte courant, bouton ou libellé ;
- le mot qui porte le sens de l'écran, pas un mot au hasard.

**Licence** : Welcome Valentines est en « usage personnel » ; la licence
commerciale est à acheter avant la sortie (#129). Plan B gratuit : Delicious
Handrawn (Google Fonts, OFL).

Les noms de police vivent dans `fonts` (`utils/constants.ts`) ; ne jamais écrire
un nom de fichier de police en dur dans un style.

| Rôle | Token | Taille | Usage |
|---|---|---|---|
| hero | `fonts.displayHero` | 108 px, -1.6 | Numéro de page géant (60 px pour les voisins), splash |
| display | `fonts.display` | 30 px / 36, -0.3 | Titres d'écran de l'onboarding, codes d'invitation |
| headline | `fonts.display` | 22 px / 28 | En-têtes d'écran et de sheet, état vide |
| book | `fonts.display` | 18–21 px | Titre du livre mis en avant |
| score | `fonts.display` | 21 px (accueil), 18 px (listes) | Scores, rangs, objectif |
| title | `fonts.bodySemiBold` | 18 px / 24 | Prénoms, titres de ligne |
| body | `fonts.body` | 16 px / 24 | Texte courant, champs |
| label | `fonts.bodyMedium` | 14 px / 20 | Libellés, sous-titres, auteurs |
| button | `fonts.bodyBold` | 16 px / 24 | Boutons |
| caption | `fonts.bodySemiBold` | 11–12 px / 16 | Badges, compteurs |
| accent | `fonts.accent` | 1,25× le titre | Le mot d'accent d'un titre, jamais plus |

**Règle de partage** : la version large (`display*`) porte les **titres et les
nombres**, la version normale (`body*`) tout le reste.

**La graisse vient du fichier, pas de `fontWeight`.** Sur iOS, une police chargée
par alias ignore `fontWeight` : pour du gras, changer de token
(`body` → `bodyBold`). Ma ligne du classement passe en `bodyExtraBold` pour
trancher nettement avec les autres prénoms en `bodySemiBold`.

**Martian Grotesk est une instance maison.** Le fichier variable (axes `wght`
100–1000 et `wdth` 75–200) est figé dans `assets/fonts` : largeur 112 pour les
titres et nombres (`MartianGroteskWide_*`), 100 pour le texte (`MartianGrotesk_*`).
Pour régénérer une graisse, repartir du fichier variable avec
`fontTools.varLib.instancer` et donner à chaque instance un nom PostScript unique —
expo-font mappe chaque alias sur ce nom.

**Tailles** : reprises telles quelles de l'ancienne paire Fraunces / Nunito, à
réajuster écran par écran (#128).

**Dette connue** : l'échelle est en points figés, hors du système de tailles
d'iOS. Dynamic Type n'est pas suivi.

## Layout

Écran mobile unique, pas de breakpoints. Le rythme vertical fait la hiérarchie.

Échelle d'espacement : `4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 · 64`. Le pas de 4 px
est réservé aux paires icône-texte ; en dessous de 8 px, rien ne respire.

- **Marge d'écran** : 16 px (`lg`) horizontal.
- **Entre lignes d'une liste** : 12 px (`md`).
- **Entre sections** : 24 px (`2xl`) minimum.
- **Padding interne de carte** : 16 à 20 px.

**Varier le rythme.** Groupes serrés, séparations généreuses. Un espacement
uniforme partout aplatit la hiérarchie — c'est le défaut le plus courant sur les
écrans denses de cette app.

**Zones sûres** : respecter `useSafeAreaInsets()` en haut et en bas. Rien sous la
Dynamic Island ni sous l'indicateur d'accueil.

**Cibles tactiles** : 44 × 44 pt minimum. Les lignes de classement et les avatars
tappables sont sous cette limite en hauteur nue — compenser par du padding ou du
`hitSlop`.

## Elevation & Depth

**Profondeur structurelle et assumée : l'ombre dit ce qui est actionnable.**

Ce n'est pas de l'ambiance. Un élément qui porte une ombre marquée se touche ; un
élément plat s'observe. La hiérarchie du reste passe par l'espacement et le
poids typographique, jamais par des ombres décoratives.

| Ombre | Valeur | Porte |
|---|---|---|
| `button` | `0 4px 6px rgba(30,20,14,0.25)` | Boutons primaires. Franc, assumé. |
| `buttonLight` | `0 0 6px rgba(30,20,14,0.1)` | Boutons secondaires. |
| `cardSelected` | `0 4px 20px rgba(30,20,14,0.09)` | Carte active parmi plusieurs. |
| `xs` | `0 1px 2px rgba(30,20,14,0.05)` | Champs de saisie. |

Le `Button3D` pousse la logique jusqu'au bout : ombre portée + ombres internes,
et l'élément s'enfonce à l'appui. C'est la signature tactile du système.

Les sheets sont natifs iOS : leur profondeur, leur flou et leur ombre viennent du
système. Ne pas les redessiner.

## Shapes

Plus l'élément est grand ou important, plus le rayon est large.

| Token | Valeur | Sur |
|---|---|---|
| `xs` | 2 px | Couvertures de livre (imite le papier coupé) |
| `sm` | 8 px | Avatars, badges |
| `md` | 12 px | Boutons compacts, lignes de liste |
| `lg` | 20 px | Champs de saisie |
| `xl` | 24 px | Boutons principaux, cartes, sheets |
| `full` | 9999 px | Pastilles, barres de progression |

Les bordures sont fines et discrètes : 1 px, en `rule-light` (`#eeebe6`) ou en
alpha (`inkAlpha(0.1)`). Les bordures claires sur fond sombre passent par
`alphaWhite30`.

**Le rayon d'un sheet natif iOS ne se spécifie pas** : laissé vide, iOS 26
applique son propre rayon, concentrique avec la courbure de l'écran.

## Components

### Boutons — `Button3D`

Deux variantes. **Primaire** : encre pleine, bordure blanc chaud à 30%, rayon 24,
padding 24h/20v, ombre franche. **Secondaire** : `paper`, bordure encre à 10%,
ombre légère. Version `compact` en rayon 12 pour les boutons icône.

L'appui enfonce le bouton — pas une simple opacité.

### Lignes de participante

Accueil (`LeaderboardSection`) : `[rang] [avatar 30] [prénom] … [score %]`, sur
quatre colonnes fixes, lignes de 36 pt. **Le rang est toujours affiché**, 1-2-3
compris : le classement complet en montre d'autres, et l'œil doit retrouver les
mêmes repères. Classement complet (`LeaderboardList`) : mêmes colonnes, plus la
barre de progression, la couronne et le badge de série.

Le score est en `display` aligné à droite, **toujours en %** (cf. Pages ou %),
avec compteur roulant à la mise à jour et glissement des lignes quand l'ordre
change — les deux se coupent avec « Réduire les animations ».

La ligne « moi » se distingue par un fond teinté (`inkAlpha(0.06)`) et un
prénom en gras — jamais par une couleur. Hors du top 3, elle est rappelée sous
un trait pointillé, avec son rang réel.

Dans le classement complet, **toucher une ligne ouvre le journal de lecture** de
la personne (route `/participant/[id]`, sheet natif posé sur celui du
classement). « Ma page » ouvre le même écran, avec mon identifiant. Aucun chevron › sur les trois cadres de l'accueil : toucher suffit, on comprend au premier essai (Lea, 2026-09-24).

Sur l'accueil, **les lignes ne se touchent pas une par une** : c'est le cadre
entier qui ouvre le classement complet. Deux cibles imbriquées rendaient le
geste incertain.

### Accueil et bibliothèque

L'accueil tient en un en-tête et **trois blocs**, sans scroll : le livre en
cours (`ActiveBookCard`), le sélecteur de page, le classement du club — rangs
1-2-3 plus ta ligne si tu n'y es pas (`LeaderboardSection`). Refonte en cours (#30) : chaque bloc
devient un **cadre en verre** `GlassSection` (rayon 24, padding 16, bord crème,
voile crème à 56 %, tout le cadre touchable à 0,97 quand il ouvre un écran),
posé sur le fond neutre.

Le cadre **Le livre** (`BookSection`) ouvre la fiche du livre d'un toucher :
la couverture à gauche, **toujours de la hauteur du texte** à côté (mesurée) ; à
droite le titre (`display` 20), l'autrice, puis **juste dessous** la
**piste** (`GoalTrack`) de 0 à 100 % du livre, avec **deux remplissages
superposés**, comme la barre d'une vidéo (lu / chargé) : devant, en lie de vin,
**ma** progression jusqu'à ma photo ; derrière, en lie de vin clair, la
**médiane** du club (pas la moyenne : trois lectrices rapides fausseraient le
repère). Une seule barre pour le club faisait croire que j'avais atteint des
étapes que seul le club avait dépassées. **Étapes** (caps et fin du livre) en
ronds pleins de 9 pt, un peu plus gros que la barre, qui est **découpée** de
2 pt tout autour (masque SVG) : un vrai vide où l'on voit le fond, qui détache le
point. Pas de liseré blanc : il ressortait sur le verre, qui n'est pas blanc : lie de
vin si **je** les ai dépassées, lie de vin clair (la même couleur que la barre
du club) si seul le club les a dépassées, gris de la barre, opaque, sinon, cap en cours en
drapeau daté, date de fin au bout — et **sur la ligne de la
date de fin**, à gauche sous le départ de la piste, `👥 26 %`, le club (la date
d'un cap en cours sous 30 % ne s'écrit pas, pour ne pas le chevaucher). Plus de « J-27 » / « Prolongations » ni de ligne de repères
(Lea, 2026-09-24) : la date de fin suffit, et l'accueil doit tenir sans défiler.
Le nombre de membres au cap vit dans la fiche du livre. Un objectif
intermédiaire s'appelle un **cap** partout dans l'UI.

Le cadre **Ma page** (`PageSection`) porte le geste principal : le sélecteur qui
défile (pas de − / +), ma page en pages de mon édition, ma série en **jours**
(dans le coin), et une **rangée du bas à hauteur fixe** (52 pt). **Sans titre**
(Lea, 2026-09-29) : le cadre sort de sous « Le livre » (28 pt glissés dessous),
son haut s'efface en fondu, coins droits en haut ; le bas garde l'arrondi et le
bord d'un cadre (`GlassSection` `fadeTop`).
- au repos, la rangée est vide : ✎ et ☺ sont les **intercalaires du carré
  Carnet** (`NoteTabs`, Lea 2026-10-05), deux onglets en encre chocolat (`inkGradient`),
  ferrés à droite, qui sortent du haut de la note à la une, le bas glissé dessous. Tout annote ma
  page **enregistrée**, sans quitter l'accueil. ☺ : une réaction en un geste, sans
  note ; l'intercalaire se tire d'un cran, la liste à la mode (`TRENDING_EMOJIS`)
  sort au-dessus, sur toute la largeur du bento, et défile ; « + » (`GlassButton`, secondaire) ouvre tous les emojis (/emoji-note,
  `EmojiGrid`). Un brouillon laissé met un point lie de vin sur ✎ (`badge`).
  ✎ ouvre la feuille (`NoteComposer`), où **tout se fait** : elle monte au-dessus
  du clavier, l'accueil s'assombrit. Ligne du haut : ✕, la page (« p. 157 »,
  une gélule en verre qu'on touche pour la changer au pavé numérique), ↗ pleine page,
  ✓ — **une seule taille, 44 pt**, celle de tous les boutons ronds. Le
  thème se choisit en **intercalaires sous la note** (`CategoryPicker`
  `tabs`) : l'illustration aquarelle de chaque thème, sans mot, en masque teinté
  de sa couleur ; la choisie dépasse plus et se tient droite. La note
  (`NoteDraft` `tools`) est **courte au départ**, grandit avec le texte jusqu'à
  sept lignes puis défile ; sans coin corné. En bas à droite, 🎙 et ❝ (le thème en filigrane, en bas à gauche)
  (`GlassButton`, 44 pt comme tous les boutons-icônes) : 🎙 n'ouvre l'enregistreur qu'au toucher (✕ pour le
  retirer), ❝ photographie la page — texte lu **sur le téléphone** (module maison
  `modules/page-text`, Vision d'Apple, en français), `QuotePicker` : on touche
  les lignes, surlignées en jaune stabilo, et le passage arrive en tête de la
  note, **modifiable**. ✕ ou le fond gardent le brouillon ;
- pendant un défilement, ↺ annuler, « +14 », ✓ enregistrer (encre pleine). La
  barre s'efface : jamais de doute sur la page notée.

**Un seul enregistreur vocal** (`VoiceRecorder`, Lea, 2026-09-29) : le même dans
la barre, dans la note qu'on écrit (`NoteDraft`, éditeur et feuille rapide).
Une gélule `inkAlpha(0.06)`, le bouton rond à gauche (🎙, ■, ↺), le temps ferré
à droite en gras. Au toucher elle passe **aussitôt** en dégradé lie de vin ;
barres de 4 pt arrondies qui glissent vers leur niveau (140 ms), en crème.
Enregistré : ▶ réécouter (`VoicePlayer`) et 🗑.

**Une note s'écrit dans l'autocollant** (`NoteDraft`, Lea, 2026-09-29) : jamais
de feuille de cahier à part. Mêmes boutons partout : `GlassButton` (verre),
`RoundButton` (plein), jamais un rond redessiné.

**Le bento** (Lea, 2026-09-29, #97) : sous « Ma page », deux carrés côte à côte,
12 pt d'écart. À gauche le **classement** (`LeaderboardSection square`) : lignes
de 27 pt posées en bas du carré, avatar 22, score en `display` 16. À droite le
**carnet** (`NoteTile`) : **uniquement la note à la une**, un `NoteSticker` de la
taille du carré, sans cadre en verre derrière, coin corné en bas à droite (il
invite à tourner la page). En haut la catégorie (toujours écrite) et la page ;
au milieu le texte, la citation en `display` italique, l'emoji seul en grand ou
le vocal (onde + durée) ; en bas l'autrice et « 1 / 3 » en lie de vin s'il y a
des nouvelles. À la une : la première des nouvelles, sinon la plus récente.
Sans note lisible : papier nu, un cadenas et le nombre de notes plus loin. Tout
le carré ouvre `/carnet`. L'ancienne porte du carnet (`NotesDoor`) a disparu.

**Aucun défilement** (Lea, 2026-09-24) : l'accueil tient sur un seul écran, sur
tous les iPhone. Plus de ScrollView : le livre, « Ma page » et le classement sont
posés dans une vue fixe. Pour gagner la place, retirés : le filigrane « PAGE »
derrière le chiffre et la ligne de repères du cadre livre (« Club · 30 % du
livre », « Cap · 2/5 ») ; le % du club est passé **à droite de la piste**
(`👥 30 %`), le nombre de membres au cap reste dans la fiche du livre.

**Petits écrans**, pour tenir quand même (hauteur de fenêtre) :
- sous 830 pt (SE, mini) : chiffre du sélecteur à 52 pt au lieu de 68 ;
- sous 700 pt (SE) : classement réduit à **deux lignes**, le 1er puis moi (les
  deux premiers si je suis 1re ou 2e), et marges resserrées (12 pt dans les
  cadres, 8 entre eux).

**Grands écrans** (830 pt et plus : 17 Pro, Pro Max) : la place en trop sert à
respirer. 16 pt entre les cadres, 24 au-dessus de la barre d'onglets, chiffre du
sélecteur à 80 pt (88 à partir de 900 pt), et « Ma page » prend la place qui
reste, le chiffre et son « / 624 » centrés dedans.

**Texte agrandi** (réglages d'accessibilité) : le texte grandit librement, et
l'accueil **défile seulement dans ce cas**, quand le contenu dépasse vraiment
l'écran (`scrollEnabled` calculé). À taille normale, rien ne bouge jamais.

Dans les cadres, les hauteurs de ligne sont des `minHeight`, jamais des
`height`. Les repères posés à un endroit précis d'un dessin (dates de la piste,
% du club, chiffre du sélecteur) bornent leur agrandissement
(`maxFontSizeMultiplier`), sinon ils se chevauchent et ne désignent plus rien.

Plus de glissement depuis le bord droit vers Activité : il chevauchait le
sélecteur.

L'en-tête porte un seul bouton, la **bibliothèque** (`library-big`) à gauche,
en `GlassButton` 44 pt (le même rond en verre que le +), et PopEyes au centre.
**Verre translucide** (bouton bibliothèque, barre d'onglets, +) : le verre d'iOS
26 né dans une vue qui apparaît **en fondu** reste transparent ; né à pleine
opacité, il est blanc et laiteux sur le papier. Les écrans ont leur fondu
(`PageTransition`), la barre d'onglets aussi (`FadeIn`). Constaté sur iOS 26.2,
à revérifier aux mises à jour d'iOS.
Pas de cloche : les notifications ne servent pas au quotidien, elles vivent
dans **Profil › Notifications** (route `/activity`).

Tout ce qui se règle sur un livre vit dans la **fiche du livre** (route `/book`,
sheet natif) : la fin et ses jours restants, les caps (celui en cours marqué « en
cours », les passés avec combien de membres les avaient atteints **à leur date**),
le club et son code d'invitation, modifier ou quitter le livre. Les pages des caps
s'affichent dans **mon** édition — un cap est enregistré en %. Plus de menu ⋮ sur
l'accueil.

**Hauteur des sheets à contenu** (fiche du livre, classement, journal,
bibliothèque ; Lea, 2026-09-24) : le sheet s'ouvre **à la hauteur de tout son
contenu** (`fitToContents` + `useFitSheet`). S'il y en a trop, il monte au plus
**jusque sous l'en-tête de l'accueil** — bouton bibliothèque et mascotte restent
visibles au-dessus — et l'on fait défiler dedans. Les sheets de saisie (note,
réactions, recherche) et le carnet gardent leurs hauteurs d'arrêt.

Tous les sheets ont un titre dans leur en-tête (`SheetPage`) : celui de la
fiche du livre est le titre du livre, avec l'auteur en dessous.

Changer de livre ou en ajouter un se fait dans la **bibliothèque**, route
`/library` en sheet natif titré **Mes lectures**, avec le **+** en verre
(`GlassButton`) à droite du titre (même parcours que le + de la barre d'onglets).
Dessous, quatre capsules de filtre (`FilterChips`) : **Tout**, **En cours**,
**Non lus**, **Lus**, une toujours sélectionnée (Tout par défaut). Carrés arrondis
(8 pt), pas des pilules. Sélectionnée : **lie de vin** en dégradé (`accentGradient`,
la couleur d'accent, la même que les signets), texte crème ; sinon contour sur
fond blanc. Les filtres passent
**par-dessus** l'aquarelle du coin (elle est dans l'en-tête de la liste, dessous). Le filtre n'est pas retenu et le sheet ne rétrécit pas quand on
filtre. Plus de « Trier par » : l'ordre est fixe, la dernière activité (la
mienne ou celle du club) en premier. Les
livres sont rangés trois par trois sur l'étagère historique de l'accueil — barre
en verre flouté **teinté noyer grisé**, en dégradé (noyer grisé clair → plus foncé,
45 → 55 %, bordure crème à 35 %) avec ses vis, posée **par-dessus** le bas des
couvertures. Noir, elle grisait ; noyer profond, elle pesait trop ; noyer à pleine
saturation, trop beige/marron : saturation divisée par deux.

**Aquarelle** (`WatercolorCorner`) : un lavis léger dans le coin haut droit du
sheet, qui passe **sous le + en verre** pour que le verre se voie, et que le bord
du sheet coupe net. **Tons neutres** (sable et noyer clair, `NEUTRAL_WASH`) : la
bibliothèque ne parle d'aucun livre précis, elle n'a donc pas de couleur de
couverture. Les couleurs d'une couverture (`coverWash`, `utils/watercolor.ts`)
sont réservées aux écrans qui parlent de ce livre. Textures blanches teintées à l'affichage
(`assets/images/watercolor/corner-*.png`, `scripts/generate-watercolor.py`). Il
s'arrête avant la première étagère. Rendu **après** la liste, jamais avant ni en
`zIndex` négatif : iOS repère la liste en suivant le premier enfant de l'écran,
et perd sinon sa marge sous la barre.

**Hauteur** : le sheet prend la hauteur exacte de ses étagères
(`fitToContents`), sans blanc sous la dernière ; passé 72 % de l'écran il
arrête de grandir et la liste défile.

**État de lecture** : un **signet brodé** (`RibbonBookmark`) qui pend du haut de
chaque couverture, calculé sur **ma** progression, jamais sur celle du club :
- **pas commencé** : rien ;
- **nouveau** : seul le dernier livre ajouté, tant qu'il n'est pas commencé —
  ruban écru, surpiqûre et étincelle Lucide (`sparkle`) lie de vin ;
- **en cours** : ruban écru que le **lie de vin de « terminé » imprègne depuis le
  bout du V, à mon %** (10 % au moins, sinon on ne le voit pas), comme une
  teinture qui monte dans le tissu : à 100 %, c'est le signet « terminé ». Une
  seule couleur d'accent pour les états (le noyer faisait une couleur de plus).
  Front **ondulé et net** (le fondu faisait flou), avec une ligne à peine plus
  foncée là où la teinture s'accumule (comme le bord d'une aquarelle). Dans la
  partie teinte, la surpiqûre passe en crème ;
- **terminé** : ruban lie de vin, surpiqûre crème, coche Lucide (`check`) crème.

Essais écartés : pastille en pourcentage « 58 % », anneau de progression sur flou
dépoli, autocollant rond.

Vocabulaire : on parle de **lectures** et de **livres**, jamais de
« challenges ». Un groupe qui lit un livre ensemble n'est pas un challenge (le
renommage de l'app suit, #29).

### Vocaux du carnet

Un vocal s'enregistre comme on écrit : **un toucher pour démarrer, un pour
arrêter** (jamais d'appui long). Rangée à places fixes sous le post-it de la
note : 🎙 démarrer → ■ arrêter (onde en direct + `0:12 / 2:00`) → ↺ refaire,
`0:24`, 🗑 supprimer. 2 minutes au maximum.

Le lecteur (`VoicePlayer`) est le même dans l'écran d'écriture et dans le
carnet : pastille `creamAlpha(0.55)` posée sur le post-it, rond ▶ encre de
30 pt, 40 barres d'onde qui se remplissent à l'écoute, durée en chiffres
tabulaires. Un seul vocal parle à la fois, et il s'entend en mode silencieux.

### Réactions du carnet

Sous une note du club : une pastille par emoji avec son compte (`😭 7`), les
plus partagées d'abord, **ma réaction cerclée d'encre** — un toucher l'ajoute
ou la retire. Au bout, `smile-plus` ouvre les six emojis rapides à la place de
la rangée (`😭 🫶 😂 🔥 😱 👀`), puis `…` le sélecteur complet en sheet natif,
et ✕ referme. Pastilles de 30 pt de haut au minimum. Pas de réactions sur une
note privée.

### Icônes

**Une seule banque : [Lucide](https://lucide.dev/icons/)** (`lucide-react-native`),
partout, sans exception. Jamais d'Ionicons, de SF Symbols, de Material ni d'icône
redessinée à la main : les styles de trait jurent entre eux. Si Lucide n'a pas le
pictogramme voulu, prendre le plus proche dans Lucide.

- Importer le composant suffixé `Icon` (`ChevronLeftIcon`, `ShareIcon`…) : il
  n'entre jamais en conflit avec un composant React Native du même nom (`Share`,
  `Image`).
- `Button3D` reçoit le composant, pas un nom : `icon={ChevronLeftIcon}`.
- Une icône « pleine » s'obtient avec `fill={color}` (flamme des séries), à
  réserver aux pictogrammes dont le tracé reste lisible une fois rempli.
- Seule exception, et ce n'est pas une icône : le logo Apple du bouton « Se
  connecter avec Apple » (`components/brand/AppleLogo.tsx`), logo de marque
  imposé par Apple et absent de Lucide par principe.
- Les illustrations maison (PopEyes, couronne, crâne) sont des images, pas des
  icônes.

### Onglet Explorer

Trouver la prochaine lecture du club (`app/(tabs)/explore.tsx`). Même
habillage que l'accueil (fond neutre en taches, texture, titre centré). Un champ
de recherche (titre, auteur, saga), puis des **étagères** qui défilent de côté,
posées sur la barre en verre de la bibliothèque (`ExploreShelf`, `ShelfBar`) :
**Mes envies** d'abord, puis En ce moment et les genres. Les étagères sont
choisies à la main et figées dans `constants/exploreCatalog.json`
(`scripts/build-explore-catalog.mjs`) : elles s'affichent sans réseau.
Pendant une recherche : des silhouettes de lignes, jamais de spinner.

La fiche d'un livre (`/explore-book`, sheet sans titre) : couverture, titre,
autrice (la toucher cherche ses livres), `518 p. · 2023`, puis trois places
fixes : **Lancer une lecture** (ou **Ouvrir** s'il est déjà dans ma
bibliothèque), ♥ envie (lie de vin quand gardé), partager. Pas de note, pas
d'avis, pas de résumé.

### Barre d'onglets

**Sur mesure, en verre iOS 26** (`components/ui/GlassTabBar.tsx`) : pilule
flottante de 190 pt **centrée** en bas, matériau `GlassView` d'expo-glass-effect
(vrai UIGlassEffect, repli expo-blur avant iOS 26). Trois onglets, icônes sans
libellé : **Lecture en cours** (`book-open`), **Explorer** (`search`),
**Profil** (`circle-user`). **Pas de pastille derrière l'onglet actif** : trait
fin `ink` à 50 % d'opacité au repos (3,05:1 sur le verre, ne pas descendre plus
bas), trait épais `ink` à pleine opacité une fois actif, en fondu (200 ms). Lucide
n'existe qu'en contour : pas d'icône pleine pour l'état actif. Les icônes sont posées
**par-dessus** le verre, jamais dedans : iOS 26 réadapte la couleur du contenu
d'un verre avec retard. Pas de verre interactif pour la même raison.

À droite de la barre, à 12 pt, un **bouton rond « + »** de même hauteur et même
verre ajoute un challenge. Une cale invisible de même largeur à gauche garde la
barre au centre de l'écran.

La barre native `NativeTabs` a été essayée puis abandonnée : iOS 26 fixe sa
largeur (~274 pt pour 3 icônes) et ignore `itemWidth`/`itemPositioning`.

- Icônes Lucide à 22 pt, trait 1,75 au repos et 2,25 actif.
- Chaque onglet a un `tabBarAccessibilityLabel` : c'est le nom lu par VoiceOver.
- La barre flotte au-dessus du contenu : réserver sa place en bas de chaque
  écran d'onglet avec `useTabBarInset()`, jamais une valeur fixe.
- Un écran d'onglet n'a pas de bouton retour : c'est une racine.

### Sheets

**Un seul type de sheet dans l'app** (Lea, 2026-09-25). Plus de sheet fait
maison (`BottomSheet`, `<Modal>`) : tout ce qui monte du bas est un **sheet iOS
natif**, présenté en route `formSheet` (`sheetScreenOptions()` dans
`app/_layout.tsx`). Poignée, paliers de hauteur, glissement élastique, coins et
fond assombri viennent du système.

**Le squelette : `SheetPage`** (`components/ui/SheetPage.tsx`), la mise en page
de la fiche du livre, pour tous :
- **en-tête** `SheetPageHeader` : retour (si posé sur un autre sheet), titre en
  `display` 26 **ferré à gauche, jamais centré**, sous-titre éventuel, actions à
  droite en `GlassButton` (44 pt, comme tous les ronds) ;
- **marges de 16 pt** (`SHEET_GUTTER`) sur les côtés ;
- **action principale** en bas du contenu (`SheetFooter` + `Button3D`
  primaire, « Enregistrer ») ; une suppression en lien rouge en dessous ;
- pas de croix : on ferme en glissant vers le bas.
- **espacements** (échelle de Layout) : sous-titre **à la ligne** sous le
  retour (jamais à côté), 16 pt sous la ligne retour + titre ; en-tête ↔ contenu 24 pt ;
  entre deux champs 24 pt, libellé ↔ son champ 8 pt ; action principale
  24 pt sous ce qui précède ;
- **contenu ferré sur la marge** : le premier élément d'une ligne (le rang du
  classement) s'aligne sur le retour et le titre ; seul un fond de ligne (ma
  ligne) déborde dans la marge.
Un sheet qui est une liste (classement, bibliothèque, carnet) pose
`SheetPageHeader` en en-tête de sa FlatList, avec `useSheetScroll()`.

Deux conditions pour qu'un formSheet se mette bien en page : une **route** (pas
un composant montant un `ScreenStack`), et la liste en **enfant direct de
l'écran**, sans `View` intermédiaire. `SheetPage` EST la ScrollView de l'écran.
Un formulaire qui a besoin d'une donnée la lit dans les stores ; un sheet qui
rend un résultat le dépose dans un store (ex. `bookPick` de la recherche).

Ne pas activer `featureFlags.experiment.synchronousScreenUpdatesEnabled` : ce
flag expérimental de react-native-screens a une contrepartie native et rend
l'app entièrement blanche sur un binaire fraîchement compilé.

**L'en-tête reste en haut quand un sheet défile**, avec un **fondu** dessous
(`SheetStickyHeader`, qui n'apparaît qu'une fois le contenu défilé). C'est fait
par `SheetPage` / `useSheetScroll`.

**Sheet ouvert depuis un autre sheet : toujours un retour** (`?from=…`, rond en
verre `ChevronLeftIcon` à gauche du titre, prop `onBack`). Et s'il sert à
consulter (fiche du livre › carnet), il reste **indicatif** : pas d'actions
(écrire, réagir, modifier).

### Signets brodés — `RibbonBookmark`

Un signet en ruban qui sort du haut du livre et pend devant la couverture, bout
coupé en V, **surpiqûre brodée sur tout le tour**. C'est la direction « maille » :
du textile réaliste.

- **Ruban** : gros-grain (côtes horizontales, chaîne fine), lisière un peu plus
  claire, haut plat sans pli dessiné (le bourrelet alourdissait), dégradé clair en
  haut → foncé en bas, ombre portée
  douce sur la couverture. **Matière discrète** : trop de relief, de trame et
  d'ombre faisait « old school » (skeuomorphisme des débuts de l'iPhone).
- **Broderie, effet marqué** (demande de Lea : « pousser l'effet brodé ») :
  - fils en relief : deux brins visibles, reflet soyeux du fil à broder, ombre
    des fils sur le ruban ;
  - **surpiqûre au point avant sur tout le tour** du ruban — haut, côtés et le long
    du V —, à 2,2 pt du bord : c'est elle qui dit « fait main »
    au premier coup d'œil.
- Ruban de 23 pt de large, pour que la broderie se lise à taille réelle.
- **Images calculées** par `scripts/generate-ribbon-bookmarks.py` (@2x, @3x) : pour
  une nouvelle couleur, ajouter une variante au script, ne pas
  dessiner de ruban dans le code.

| Variante | Ruban | Surpiqûre | Icône Lucide | Pour |
|---|---|---|---|---|
| `done` | lie de vin `#8c3b4c` → `#5e1f2e` | crème | `check` crème | livre terminé |
| `reading` | écru, imprégné de lie de vin `#8c3b4c` → `#5e1f2e` à mon % | lie de vin / crème | — | livre en cours |
| `new` | écru `#f3e9df` → `#e1cfbf` | lie de vin | `sparkle` lie de vin, **pleine** | dernier livre ajouté |

**Pictogrammes : icônes Lucide posées sur le ruban**, jamais brodées ni dessinées
dans l'image (règle « Lucide uniquement » ; la coche brodée faisait grossière). Le
ruban brodé porte la matière, l'icône porte le sens.

`reading` superpose deux images calculées avec la même graine — `progress-track`
(écru, avec ombre) et `progress-fill` (noyer, sans ombre pour ne pas la doubler) — et révèle la seconde sous le front (masque SVG : vagues + fondu). Les
tissus et la surpiqûre coïncident au pixel.

Le lie de vin est un **essai de couleur d'accent** (issue dédiée sur le BBB
Roadmap), pas encore adopté pour le reste de l'app. Premier essai en noyer et
sable : terne, « pas ouf ».

Essai écarté : l'autocollant rond (bord blanc découpé), « pas réaliste, pas
intéressant ».

### Autocollants brodés — `NoteSticker`

**L'image d'une note du carnet, partout dans l'app.** Validé par Lea le
2026-09-25 (« magnifique ») : on ne redessine jamais une note autrement ;
toute nouvelle vue qui parle de notes reprend ce composant.

- **Forme** : carré au grand arrondi (26 % du côté), **coin en haut à gauche
  qui se décolle**. Le rabat garde l'arrondi du coin d'origine, la pliure
  s'incurve un peu (le coin se roule) et les jonctions sont adoucies : aucun
  angle droit, nulle part.
- **Couture** : points ronds tout autour (`STITCH`, partout dans l'app : cadres, notes, fil des pistes, règle de pages — plus de tirets, demandé par Lea le 2026-10-05), à 7 % du bord (près du bord, demandé par Lea le 2026-09-28), encre à 32 % (20 % sur
  une note verrouillée ; sur une note, le foncé de sa catégorie, voir Couleur) — c'est elle qui dit « brodé, fait main ».
- **Couleur** : celle de la catégorie de la note (`postIt`, via
  `ANNOTATION_CATEGORIES`), tirée de la charte Lowki (2026-10-08) : rouge pâli,
  terre cuite, beurre, olive, beige ; seul le bleu grisé de Snif sort de la
  charte. **Ton sur ton** : le filigrane et la couture prennent la même teinte un
  cran plus foncée, pleine (`postItDeep`), à la même distance pour chaque
  couleur (≈ 9 % de clarté le filigrane, 15 % la couture, un peu moins saturé que la note ; en dessous, le
  voile sombre du bas avale le filigrane). Le numéro de page aussi, plus foncé
  (≈ 37 %, au moins 4:1, en gras). Le texte reste à l'encre. Un voile clair en haut et plus sombre en bas
  (jamais d'aplat). Une note **verrouillée** est en papier nu `#efe9df` : on voit
  qu'elle est là, rien de plus (règle du carnet).
- **Rabat** : dégradé crème `#fdfbf8` → `#d8d1c6`, petite ombre dessous.
- **Pourquoi à gauche** : en pile (autocollants qui se chevauchent vers la
  droite), c'est le coin qui reste visible.
- **Usage déco** (tuile Carnet de la fiche du livre) : 3-4 gros autocollants
  (46 pt), pivotés, qui débordent du cadre et que ses bords coupent. Placement
  et inclinaison fixes (`STICKER_SPOTS`) : la déco ne bouge pas d'une ouverture
  à l'autre.

**Couleurs = variables, une seule source.** Le thème des autocollants vit dans
`utils/constants.ts` : `postIt` (une couleur par catégorie) et
`stickerMaterial` (papier des notes verrouillées, dos du rabat). Tout l'app les
lit via `ANNOTATION_CATEGORIES` (`utils/annotations.ts`) : autocollants, carnet,
fiche d'une note, piste des notes, accueil. **Jamais une couleur de catégorie en
dur ailleurs** : changer de thème = changer ces deux objets, rien d'autre.

Référence visuelle : autocollants en cuir surpiqué au coin décollé (capture de
Lea). Essais écartés : une frise d'autocollants placés à leur page (« fouillis,
on comprend pas »), une rangée serrée de petits autocollants, des autocollants-
étiquettes pour les dates du journal (« pas beau »).

### Boutons ronds à icône : secondaire et primaire, jamais un troisième

**Règle de Lea (2026-09-30), non négociable.** Tout bouton rond qui porte une
icône est l'un de ces deux, et rien d'autre :

- **Secondaire, par défaut : `GlassButton`**, le rond en verre. C'est celui de
  la feuille de note (✕ ↗ 🎙 ❝), des en-têtes (📚), du « + » des emojis, du + de
  la barre d'onglets. En cas de doute, c'est lui ;
- **Primaire : `RoundButton` `dark`**, l'encre chocolat en dégradé, **réservé
  aux actions vraiment importantes** : ✓ enregistrer ma page, ✓ ajouter la note,
  ■ / 🎙 de l'enregistreur, ✎ ☺ de « Ma page » (choix de Lea). Rare par
  construction : s'il y en a partout, plus rien n'est important.

Dans le contenu, `RoundButton` garde aussi `ghost` (↺ 🗑) et `light` (sur la
gélule lie de vin).

**Une seule taille, partout, sans exception : 44 pt** (`ROUND_BUTTON_SIZE` dans
`utils/constants.ts`, icône 19 pt). Règle de Lea (2026-10-02) : un bouton rond
à icône fait la même taille sur tous les écrans — en-têtes, feuilles, barre
d'onglets, lecteur de vocal. Les deux composants n'ont **pas** de prop `size` :
on ne peut pas en faire un plus petit « juste ici ». Une gélule qui contient un
rond (l'enregistreur compact, le lecteur de vocal) se cale sur lui, pas
l'inverse.

Jamais de `PressableScale` + `borderRadius: taille / 2` + icône écrit à la main,
même « juste pour ici » : le « + » de la liste d'emojis l'était, il ne
ressemblait à aucun autre bouton. Il manque une variante ? On l'ajoute au
composant, pour tous.

### Bouton en verre — `GlassButton`

Le seul bouton rond en verre de l'app : icône Lucide sur `GlassMaterial`, voile
crème `glassControlVeil` (25 % : assez pour ne pas griser sur fond clair, assez
peu pour laisser passer la couleur de dessous) et **liseré** (`rim`) — filet d'encre à 8 % qui
dessine la forme même sur fond blanc, doublé d'un reflet crème en diagonale —,
ombre douce. Le reflet passe par `stopOpacity` : react-native-svg ignore l'alpha
d'un `rgba()` dans `stopColor`, et le liseré devenait un anneau blanc uniforme.
44 pt partout, comme `RoundButton` (le + de la barre d'onglets compris).
La barre d'onglets porte le même voile et le même liseré. Ne jamais redessiner
ce verre ailleurs : le fond gris plat qu'iOS 26 met derrière les boutons de
barre est retiré (`hidesSharedBackground`) au profit de ce composant.

### Retour au toucher — `PressableScale`

Tout élément tappable s'enfonce à `0,97` en 150 ms. Sur mobile il n'y a pas de
survol : l'état pressé est le seul retour possible, et son absence rend
l'interface morte.

## Motion

**Vivant et taquin.** Le mouvement est le principal porteur de personnalité d'un
système par ailleurs sobre.

- **Courbe par défaut** : `ease-out-quart` `cubic-bezier(0.25, 1, 0.5, 1)`.
  Jamais de bounce ni d'elastic — un objet réel ne rebondit pas, il décélère.
- **Durées** : 150 ms appui · 200 ms changement d'état · 300 ms layout ·
  400 ms entrée. Cascade de 60 ms entre éléments, plafonnée.
- **Signatures** : le compteur qui roule vers sa nouvelle valeur, la feuille qui
  tombe en diagonale quand on enregistre des pages, les lignes qui glissent
  quand le classement se réordonne (`LinearTransition`).
- **Transformer, pas re-layouter** : n'animer que `transform` et `opacity`. Les
  barres de progression se compressent en `scaleX` avec `transformOrigin: left`,
  jamais en `width`.
- **Reduce Motion est non négociable** : `useReducedMotion()` de Reanimated coupe
  tout, compteur roulant compris. Respecté dans `LeaderboardSection`,
  `LeaderboardList` et `PressableScale` — **à propager au reste de l'app**.

## Do's and Don'ts

**À faire**

- Tenir la direction artistique : cosy fait main mais pas trop — papier,
  aquarelle, maille — dans une structure iOS 26 nette (Overview › Direction
  artistique).
- Remplir toute surface colorée d'un dégradé vertical, clair en haut, foncé en bas.
- Laisser iOS dessiner ce qui lui appartient : sheets, barres de navigation,
  transitions, contrôles système.
- Faire porter la chaleur par la palette noyer/blanc chaud, les illustrations et le
  mouvement.
- Varier l'espacement pour créer du rythme.
- Réserver l'accent unique paramétrable pour la future couleur de club.
- Utiliser `text-tertiary` dès qu'un texte gris doit rester lisible sur le fond
  d'app.

**À ne pas faire**

- Pas d'aplat de couleur sur un bouton, une pastille, un disque ou une capsule.
- Pas de clichés fait-main (washi tape, coutures en pointillés, phrase en police
  manuscrite) ni de collage de matières : ça tourne au scrapbook. Le manuscrit,
  c'est un seul mot d'accent par écran.
- Pas de `text-subtle` (`#e5e0d9`) en couleur de texte. C'est une bordure.
- Pas de `#000`, `#fff` ni `rgba(0,0,0,…)` / `rgba(255,255,255,…)` en dur : passer
  par les tokens et les helpers alpha.
- Pas de couleur décorative. Chaque couleur non neutre doit répondre à « qu'est-ce
  qu'elle signifie ».
- Pas de carte dans une carte.
- Pas de rayon codé en dur sur un sheet natif : iOS 26 gère la concentricité.
- Pas de titre de sheet centré : toujours ferré à gauche (`SheetHeader`).
- Pas de Welcome Valentines hors du mot d'accent d'un titre.
- Pas de `fontWeight` pour faire du gras : changer de token `fonts`.
- Pas de bounce, pas d'elastic, pas d'animation de `width` ou de `height`.
- Pas de fiche produit ni de note sur 5 — c'est Goodreads, l'anti-référence.
- Pas d'affordance dépendant du survol : il n'y en a pas sur mobile.

**Dettes ouvertes, à ne pas prendre pour des choix**

1. Dynamic Type : les hauteurs de ligne figées ont été retirées de l'accueil,
   mais 54 `lineHeight` en points subsistent ailleurs dans l'app et rogneront
   le texte de la même façon.
2. Aucune apparence sombre n'existe. L'app déclare désormais
   `userInterfaceStyle: "light"` plutôt que `"automatic"`, ce qui est cohérent
   mais reste un renoncement : la HIG traite le sombre comme une apparence de
   premier rang.
3. Les couleurs d'état sont des défauts Tailwind non teintés.
4. Reduce Motion n'est respecté que dans trois composants.
5. `components/common/Avatar.tsx` référence des tokens inexistants
   (`colors.primary`, `colors.surfaceVariant`, `colors.textOnPrimary`) — composant
   mort ou cassé, à trancher.
