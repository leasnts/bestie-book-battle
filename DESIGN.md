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
typography:
  hero:
    fontFamily: "FrauncesSoftDisplay_600SemiBold, Georgia, serif"
    fontSize: "108px"
    fontWeight: 600
    letterSpacing: "-1.6px"
  display:
    fontFamily: "FrauncesSoft_600SemiBold, Georgia, serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: "36px"
    letterSpacing: "-0.3px"
  headline:
    fontFamily: "FrauncesSoft_600SemiBold, Georgia, serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: "28px"
  score:
    fontFamily: "FrauncesSoft_600SemiBold, Georgia, serif"
    fontSize: "21px"
    fontWeight: 600
  title:
    fontFamily: "Nunito_600SemiBold, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: "24px"
  body:
    fontFamily: "Nunito_400Regular, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
  label:
    fontFamily: "Nunito_500Medium, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: "20px"
  button:
    fontFamily: "Nunito_700Bold, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: "24px"
  caption:
    fontFamily: "Nunito_600SemiBold, system-ui, sans-serif"
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
  partout, polices manuscrites, fleurs séchées) ;
- **garde-fou** : si un écran évoque une boutique de loisirs créatifs, un
  scrapbook, un blog DIY ou une carte de vœux, il a dérivé.

**Dégradés, jamais d'aplat** — voir Colors › Dégradés, jamais d'aplat.

## Colors

**Stratégie : restrained.** Neutres teintés + couleur uniquement porteuse de sens.
Aucune couleur de marque primaire n'existe, et c'est délibéré.

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
| `ink` | `#33231a` | Encre noyer foncé. Texte principal, boutons primaires, barres de progression remplies. |
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
Le système reste monochrome pour que cette couleur ait de la place, et c'est elle
qui signe l'identité d'un club donné.

Conséquences sur la construction : réserver un emplacement d'accent unique,
paramétrable par challenge, plutôt que de disséminer des couleurs codées en dur.
Tout ce qui pourrait un jour porter la couleur du club — barres de progression,
états actifs, accents de classement — doit lire cet emplacement dès maintenant.
L'accent ne doit jamais être la seule information : le club daltonien existe.

### Fond de l'accueil : les couleurs de la couverture

En attendant la couleur du club, c'est **la couverture du livre en cours** qui
colore l'accueil (`CoverBackdrop`) : sans rien derrière, le verre des cadres ne
se voit pas. Quatre taches radiales douces sur `paper`, placées comme sur la
maquette, texture noise par-dessus.

- **Extraction** (`utils/coverPalette.ts`) : vignette de 48 px de large, pixels
  regroupés par teinte, les **3 couleurs dominantes** gardées. Gris, noirs et
  blancs ignorés : une couverture noire ne donne jamais un fond noir.
- **Stockage** : `challenges.cover_palette`, calculée une fois (à la création,
  au changement de couverture, ou au premier affichage pour les anciennes). Même
  fond pour tout le club, affiché sans attente.
- **Dosage** : chaque tache monte au plus à 62 / 42 / 32 / 22 % d'opacité, **moins
  si la couleur est sombre** : `text-tertiary` doit garder 5:1 dans un cadre en
  verre posé dessus (voile `glassVeil` à 56 %). Les couleurs sont stockées brutes
  et dosées à l'affichage : l'intensité se règle sans migration.
- **Repli noyer** (ambre, noyer, sable) : pas de couverture, couverture en noir et
  blanc, ou palette pas encore calculée.
- **Changement de livre** : fondu de 400 ms, sauté avec « Réduire les animations ».

## Typography

**Deux voix, une ambiance plaid** : Fraunces douce (serif old-style aux
terminaisons arrondies) pour tout ce qui se lit d'un coup d'œil, Nunito
(sans-serif aux extrémités arrondies) pour tout ce qui se lit vraiment. Space
Mono est chargé mais inutilisé.

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

**Règle de partage** : Fraunces porte les **titres et les nombres**, Nunito tout
le reste. Deux exceptions assumées : les prénoms restent en Nunito (on scanne une
liste, on ne lit pas un titre), et **sous 13 px les nombres passent en Nunito**
(pourcentage de l'anneau d'objectif) — un serif aussi petit s'empâte.

**La graisse vient du fichier, pas de `fontWeight`.** Sur iOS, une police chargée
par alias ignore `fontWeight` : pour du gras, changer de token
(`body` → `bodyBold`). Ma ligne du classement passe en `bodyExtraBold` pour
trancher nettement avec les autres prénoms en `bodySemiBold`.

**Fraunces est une instance maison.** Le fichier variable Google Fonts est figé
dans `assets/fonts` sur SOFT 100 (terminaisons rondes) et WONK 0 (pas de lettres
penchées), à deux tailles optiques : 24 pour l'interface, 72 pour les nombres
géants, plus fins et plus contrastés. Pour régénérer une graisse, repartir du
fichier variable avec `fontTools.varLib.instancer` et donner à chaque instance
un nom PostScript unique — expo-font mappe chaque alias sur ce nom.

**Pourquoi ces tailles.** À corps égal, Fraunces a une capitale 20 % plus haute
que Rokkitt, et des chiffres 30 % plus larges. Les titres ont donc été réduits
d'environ 15 % (36 → 30, 24 → 22, 128 → 108) pour garder la même présence sans
écraser la hiérarchie. Nunito et Work Sans ont une hauteur d'x équivalente : le
texte courant garde ses tailles, mais perd le tracking négatif — une police ronde
serrée s'étouffe.

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

Le score est en Fraunces aligné à droite, **toujours en %** (cf. Pages ou %),
avec compteur roulant à la mise à jour et glissement des lignes quand l'ordre
change — les deux se coupent avec « Réduire les animations ».

La ligne « moi » se distingue par un fond teinté (`inkAlpha(0.06)`) et un
prénom en gras — jamais par une couleur. Hors du top 3, elle est rappelée sous
un trait pointillé, avec son rang réel.

Dans le classement complet, **toucher une ligne ouvre le journal de lecture** de
la personne (route `/participant/[id]`, sheet natif posé sur celui du
classement). « Ma page › » ouvre le même écran, avec mon identifiant.

Sur l'accueil, **les lignes ne se touchent pas une par une** : c'est le cadre
entier qui ouvre le classement complet. Deux cibles imbriquées rendaient le
geste incertain.

### Accueil et bibliothèque

L'accueil tient en un en-tête et **trois blocs**, sans scroll : le livre en
cours (`ActiveBookCard`), le sélecteur de page, le classement du club — rangs
1-2-3 plus ta ligne si tu n'y es pas (`LeaderboardSection`). Refonte en cours (#30) : chaque bloc
devient un **cadre en verre** `GlassSection` (rayon 24, padding 16, bord crème,
voile crème à 56 %, tout le cadre touchable à 0,97 quand il ouvre un écran),
posé sur le fond aux couleurs de la couverture.

Le cadre **Le livre** (`BookSection`) ouvre la fiche du livre d'un toucher :
couverture, titre, autrice, **J-27** (ou « Prolongations » passée la date, sans
reproche), puis la **piste** (`GoalTrack`) de 0 à 100 % du livre — remplissage à
la **médiane** du club (pas la moyenne : trois lectrices rapides fausseraient le
repère), ma photo posée à mon %, caps passés en points neutres, cap en cours en
drapeau daté, fin en rond au bout. Dessous, deux repères : `Club · 26 % du livre`
et `Cap · 9/38` (un cap se compte en **membres**). Un objectif intermédiaire
s'appelle un **cap** partout dans l'UI.

Le cadre **Ma page** (`PageSection`) porte le geste principal : le sélecteur qui
défile (pas de − / +), ma page en pages de mon édition, ma série en **jours**, et
une **rangée du bas à hauteur fixe** — trois places qui ne bougent jamais,
seules les icônes changent : au repos la porte du carnet et le post-it, pendant
un défilement ↺ annuler, « +14 », ✓ enregistrer. Les boutons ronds font 42 pt,
encre pleine pour l'action principale (post-it au repos, ✓ pendant un
défilement), `inkAlpha(0.07)` pour les autres.

Le **post-it** note toujours la page enregistrée. La **porte du carnet**
(`NotesDoor`, → /notes) est une pastille `inkAlpha(0.07)` de 42 pt de haut,
toujours touchable, qui montre ce qui compte :
- rien de nouveau : icône `notebook` + `23 notes` ;
- des notes plus loin : avatars **grisés + cadenas** + `3 plus loin` ;
- juste après « Enregistrer » : les notes que je viens de dépasser **deviennent
  des post-it** (avatar + page de mon édition, `≈ 158` si l'édition diffère),
  couleur de leur catégorie, en éventail, trois au maximum puis un nombre, et
  `🔒 1` pour ce qui reste. Ils arrivent pendant que la feuille « +14 » tombe
  et se rangent dès que j'ouvre le carnet (ou que je les ai lus).

**Gros corps de texte** : les trois cadres vivent dans une ScrollView. À taille
normale rien ne défile (la règle de l'accueil tient), et au réglage
`accessibility-extra-large` les cadres poussent au lieu d'être écrasés — sans
elle, chaque cadre se faisait comprimer et les lettres étaient coupées. Dans les
cadres, les hauteurs de ligne sont des `minHeight`, jamais des `height`. Seuls
les repères posés à un endroit précis d'un dessin (dates de la piste, chiffre du
sélecteur) bornent leur agrandissement (`maxFontSizeMultiplier`), sinon ils se
chevauchent et ne désignent plus rien.

Plus de glissement depuis le bord droit vers Activité : il chevauchait le
sélecteur. La cloche de l'en-tête suffit.

L'en-tête porte deux `HeaderIconButton` 40 pt autour de PopEyes :
**bibliothèque** (`library-big`) à gauche, **activité** (`bell`) à droite.

Tout ce qui se règle sur un livre vit dans la **fiche du livre** (route `/book`,
sheet natif) : la fin et ses jours restants, les caps (celui en cours marqué « en
cours », les passés avec combien de membres les avaient atteints **à leur date**),
le club et son code d'invitation, modifier ou quitter le livre. Les pages des caps
s'affichent dans **mon** édition — un cap est enregistré en %. Plus de menu ⋮ sur
l'accueil.

Changer de livre ou en ajouter un se fait dans la **bibliothèque**, route
`/library` en sheet natif : les challenges rangés trois par trois, sans titre,
sur l'étagère historique de l'accueil — barre en verre flouté (noyer à 30 %,
bordure blanc chaud à 40 %) avec ses vis, posée **par-dessus** le bas des
couvertures. Trois états de couverture : **en cours** (le livre de l'accueil)
bordure encre de 2 pt détachée de 3 pt, **pas commencé** filet `inkAlpha(0.15)`,
**terminé** cadre sombre + marque-page ✓ (`BookCover`).

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

### Barre d'onglets

**Sur mesure, en verre iOS 26** (`components/ui/GlassTabBar.tsx`) : pilule
flottante de 190 pt **centrée** en bas, matériau `GlassView` d'expo-glass-effect
(vrai UIGlassEffect, repli expo-blur avant iOS 26). Trois onglets, icônes sans
libellé : **Lecture en cours** (`book-open`), **Inspiration** (`search`),
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

**Sheets iOS natifs**, présentés en route `formSheet`. Poignée, paliers de
hauteur, glissement élastique, fond assombri et barre de navigation en verre
viennent du système. Deux conditions, détaillées dans `app/leaderboard.tsx` :
une **route** (pas un composant montant un `ScreenStack`), et la liste en
**enfant direct de l'écran**, sans `View` intermédiaire — sinon UIKit ne lui
applique pas l'encart sous la barre de navigation et le contenu passe dessous.

Ne pas activer `featureFlags.experiment.synchronousScreenUpdatesEnabled` : ce
flag expérimental de react-native-screens a une contrepartie native et rend
l'app entièrement blanche sur un binaire fraîchement compilé.

Sheets de consultation : poignée seule. Sheets de formulaire : garder une croix,
qui sert d'affordance « annuler ».

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
- Pas de clichés fait-main (washi tape, coutures en pointillés, police
  manuscrite) ni de collage de matières : ça tourne au scrapbook.
- Pas de `text-subtle` (`#e5e0d9`) en couleur de texte. C'est une bordure.
- Pas de `#000`, `#fff` ni `rgba(0,0,0,…)` / `rgba(255,255,255,…)` en dur : passer
  par les tokens et les helpers alpha.
- Pas de couleur décorative. Chaque couleur non neutre doit répondre à « qu'est-ce
  qu'elle signifie ».
- Pas de carte dans une carte.
- Pas de rayon codé en dur sur un sheet natif : iOS 26 gère la concentricité.
- Pas de Fraunces en texte courant, pas de Nunito en score (sauf sous 13 px).
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
