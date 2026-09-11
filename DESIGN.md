---
name: Bestie Book Battle
description: Le carnet de lecture partagé — encre noire sur papier, animé par des réactions taquines
colors:
  ink: "#181d27"
  ink-deep: "#0a0d12"
  ink-panel: "#13161b"
  paper: "#f5f5f5"
  surface: "#ffffff"
  surface-raised: "#fafafa"
  text-primary: "#181d27"
  text-secondary: "#414651"
  text-tertiary: "#535862"
  text-placeholder: "#696e78"
  text-subtle: "#d5d7da"
  rule: "#d5d7da"
  rule-light: "#e9eaeb"
  crown: "#FCD34D"
  crown-deep: "#F59E0B"
  streak: "#F97316"
  success: "#10B981"
  warning: "#F59E0B"
  danger: "#EF4444"
typography:
  display:
    fontFamily: "Rokkitt_700Bold, Georgia, serif"
    fontSize: "36px"
    fontWeight: 700
    lineHeight: "44px"
    letterSpacing: "-0.72px"
  headline:
    fontFamily: "Rokkitt_700Bold, Georgia, serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: "30px"
  score:
    fontFamily: "Rokkitt_600SemiBold, Georgia, serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "32px"
  title:
    fontFamily: "WorkSans_600SemiBold, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: "24px"
  body:
    fontFamily: "WorkSans_400Regular, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "22px"
  label:
    fontFamily: "WorkSans_500Medium, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: "20px"
  caption:
    fontFamily: "WorkSans_600SemiBold, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "16px"
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
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "20px 24px"
  button-primary-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.xl}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "20px 24px"
  button-compact:
    backgroundColor: "{colors.ink}"
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
    backgroundColor: "rgba(0,0,0,0.1)"
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

Un cahier dans lequel plusieurs personnes écrivent. Encre noire sur papier grené,
titres à empattements, marges généreuses, aucune décoration gratuite. Le système
est quasi monochrome par choix : la couleur n'apparaît que lorsqu'elle porte du
sens — une couronne, une flamme, une alerte.

La chaleur ne vient pas de la palette mais de deux autres endroits : les
**illustrations maison** (PopEyes, couronne, crâne), et le **mouvement** — le
compteur qui roule, la feuille qui tombe quand on enregistre des pages, les
lignes du classement qui glissent quand quelqu'un en double une autre. Le
système est sobre à l'arrêt et taquin en action.

Anti-référence contraignante : **Goodreads et Babelio**. Pas de fiche produit,
pas de note sur 5, pas de densité de catalogue.

Plateforme : **iOS uniquement**. La HIG gouverne la structure, la navigation et
l'interaction ; la marque s'exprime dans ce que la plateforme laisse ouvert —
typographie, mouvement, illustration.

## Colors

**Stratégie : restrained.** Neutres teintés + couleur uniquement porteuse de sens.
Aucune couleur de marque primaire n'existe, et c'est délibéré.

### Encres et papiers

| Token | Valeur | Rôle |
|---|---|---|
| `ink` | `#181d27` | Encre. Texte principal, boutons primaires, barres de progression remplies. |
| `ink-deep` | `#0a0d12` | Fond du splash. |
| `ink-panel` | `#13161b` | Fond des cartes livre. |
| `paper` | `#f5f5f5` | Fond d'app. Porte une texture noise à 5% d'opacité. |
| `surface` | `#ffffff` | Cartes, champs, sheets. |
| `surface-raised` | `#fafafa` | Cartes non sélectionnées. |

Les neutres ne sont pas des gris purs : ils tirent vers le bleu-ardoise
(`#181d27` est un bleu très sombre désaturé, pas un noir). Toute extension de la
palette doit rester sur cette teinte plutôt que de dériver vers le chaud.

### Texte

`text-primary` `#181d27` → `text-secondary` `#414651` → `text-tertiary` `#535862`
→ `text-placeholder` `#696e78` → `text-subtle` `#d5d7da`.

**Contraste mesuré** (ratios WCAG calculés, pas estimés) :

| Texte | sur `paper` #f5f5f5 | sur `surface` #ffffff | sur `surface-raised` #fafafa |
|---|---|---|---|
| `text-primary` | 15,49 ✅ | 16,88 ✅ | 16,17 ✅ |
| `text-secondary` | 8,68 ✅ | 9,46 ✅ | 9,06 ✅ |
| `text-tertiary` | 6,55 ✅ | 7,14 ✅ | 6,84 ✅ |
| `text-placeholder` | 4,70 ✅ | 5,12 ✅ | 4,90 ✅ |
| `text-subtle` | 1,32 ❌ | 1,44 ❌ | 1,38 ❌ |

`text-placeholder` valait `#717680` et tombait à 4,18:1 sur le fond d'app, sous
le seuil. Il a été assombri à `#696e78` — même teinte exactement, huit crans plus
sombre — et passe désormais partout avec de la marge.

**`text-subtle` (`#d5d7da`) n'est lisible que sur fond sombre.** À 1,3:1 sur fond
clair il est invisible ; sur les cartes `ink-panel` (`#13161b`) il atteint
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

## Typography

**Appariement sur axe de contraste** : Rokkitt (serif à empattements égyptiens)
pour l'affichage, Work Sans (sans-serif humaniste) pour l'interface. Space Mono
est chargé mais quasi inutilisé.

| Rôle | Famille | Taille | Usage |
|---|---|---|---|
| display | Rokkitt Bold | 36 px / 44, -0.72px | Titres d'écran, nombres de page géants |
| headline | Rokkitt Bold | 24 px / 30 | Titres de section, en-têtes de sheet |
| score | Rokkitt SemiBold | 24 px / 32 | Scores du classement (chiffres alignés à droite) |
| title | Work Sans SemiBold | 18 px / 24 | Prénoms des participantes, titres de ligne |
| body | Work Sans Regular | 16 px / 22 | Texte courant |
| label | Work Sans Medium | 14 px / 20 | Libellés, sous-titres |
| caption | Work Sans SemiBold | 12 px / 16 | Badges, compteurs |

**Règle de partage** : Rokkitt porte les **nombres et les titres** — tout ce qui
se lit d'un coup d'œil. Work Sans porte **tout ce qui se lit vraiment**. Ne pas
inverser : Rokkitt en texte courant fatigue, Work Sans en score perd l'impact.

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
| `button` | `0 4px 6px rgba(0,0,0,0.25)` | Boutons primaires. Franc, assumé. |
| `buttonLight` | `0 0 6px rgba(0,0,0,0.1)` | Boutons secondaires. |
| `cardSelected` | `0 4px 20px rgba(0,0,0,0.09)` | Carte active parmi plusieurs. |
| `xs` | `0 1px 2px rgba(10,13,18,0.05)` | Champs de saisie. |

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

Les bordures sont fines et discrètes : 1 px, en `rule-light` (`#e9eaeb`) ou en
alpha (`rgba(0,0,0,0.1)`). Les bordures claires sur fond sombre passent par
`alphaWhite30`.

**Le rayon d'un sheet natif iOS ne se spécifie pas** : laissé vide, iOS 26
applique son propre rayon, concentrique avec la courbure de l'écran.

## Components

### Boutons — `Button3D`

Deux variantes. **Primaire** : encre pleine, bordure blanche à 30%, rayon 24,
padding 24h/20v, ombre franche. **Secondaire** : `paper`, bordure noire à 10%,
ombre légère. Version `compact` en rayon 12 pour les boutons icône.

L'appui enfonce le bouton — pas une simple opacité.

### Lignes de participante

`[rang] [avatar + couronne si leader] [prénom] … [badge streak] [score]`

Le rang ne s'affiche que lorsqu'il porte de l'information (ligne épinglée hors
podium) ; dans un podium, l'ordre vertical suffit. Le score est en Rokkitt aligné
à droite, avec compteur roulant à la mise à jour.

La ligne « moi » se distingue par un fond teinté (`rgba(24,29,39,0.06)`) et un
prénom en gras — jamais par une couleur.

### Sheets

**Sheets iOS natifs**, présentés en route `formSheet`. Poignée, paliers de
hauteur, glissement élastique, fond assombri et barre de navigation en verre
viennent du système. Trois conditions non négociables, détaillées dans
`app/leaderboard.tsx` : une route (pas un composant), le flag
`synchronousScreenUpdatesEnabled`, et la `ScrollView` en enfant direct de l'écran.

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
  tout, compteur roulant compris. Respecté dans `ProgressCard`,
  `LeaderboardList` et `PressableScale` — **à propager au reste de l'app**.

## Do's and Don'ts

**À faire**

- Laisser iOS dessiner ce qui lui appartient : sheets, barres de navigation,
  transitions, contrôles système.
- Faire porter la chaleur par les illustrations et le mouvement, pas par la
  palette.
- Varier l'espacement pour créer du rythme.
- Réserver l'accent unique paramétrable pour la future couleur de club.
- Utiliser `text-tertiary` dès qu'un texte gris doit rester lisible sur le fond
  d'app.

**À ne pas faire**

- Pas de `text-subtle` (`#d5d7da`) en couleur de texte. C'est une bordure.
- Pas de couleur décorative. Chaque couleur non neutre doit répondre à « qu'est-ce
  qu'elle signifie ».
- Pas de carte dans une carte.
- Pas de rayon codé en dur sur un sheet natif : iOS 26 gère la concentricité.
- Pas de Rokkitt en texte courant, pas de Work Sans en score.
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
