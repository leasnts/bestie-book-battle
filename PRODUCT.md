# Product

<!-- impeccable:product-schema 1 -->

## Platform

ios

## Users

Des **book clubs nés sur BookTok** : 20 à 200 lectrices réunies autour d'une
créatrice, qui lisent aujourd'hui le même livre en s'organisant tant bien que mal
sur Discord ou en commentaires Instagram.

Elles ne se connaissent pas toutes. Elles ne lisent pas au même rythme, ni dans
la même édition. L'usage est court et quotidien : trente secondes le soir après
avoir lu, ou le matin pour voir où en sont les autres. Jamais une session longue.

Le travail à accomplir : **savoir où en est le groupe, et se situer dedans, sans
avoir à demander.**

Langue de l'app : français.

## Product Purpose

Donner à une lecture collective un endroit à elle, au lieu d'un fil Discord qui
défile.

Le succès ne se mesure pas au nombre de pages enregistrées, mais au fait que le
club **finisse le livre ensemble** — que les plus lentes ne décrochent pas et que
les plus rapides attendent. Une app qui ferait lire plus vite en laissant la
moitié du club derrière aurait échoué.

## Positioning

BBB suit **une lecture en cours avec des gens précis**, là où les catalogues
littéraires suivent des livres et des avis. Il n'y a pas de bibliothèque, pas de
note sur 5, pas de critique : l'objet du produit est le groupe pendant qu'il lit,
pas le livre une fois lu.

Deux mécaniques que le codebase porte déjà et qu'un concurrent catalogue ne peut
pas copier sans changer de nature : la **progression par page synchronisée entre
participantes**, et la **normalisation entre éditions** — deux lectrices avec un
poche et un grand format sont comparées en pourcentage, pas en pages brutes.

## Operating Context

- Recrutement du club hors de l'app (TikTok, Instagram, Discord), puis entrée par
  **code d'invitation à 6 caractères**.
- Un challenge = un livre, un nombre de pages, une deadline. Des objectifs
  intermédiaires facultatifs.
- Saisie manuelle de la page atteinte ; pas de synchronisation liseuse.
- Consultation possible sans ouvrir l'app via un **widget iOS** sur l'écran
  d'accueil.
- Notifications push : rappels quotidiens, streak en danger, échéances
  d'objectifs.

## Capabilities and Constraints

**En place** : auth Sign in with Apple, challenges multi-participantes,
progression par page avec historique horodaté, classement et rangs, streaks de
jours consécutifs, objectifs intermédiaires de groupe, recherche de livres via
l'API Google Books, upload de couvertures, widget iOS, notifications, graphiques
de progression.

**Contraintes techniques** : Expo SDK 55 / React Native 0.83, iOS uniquement
(Android est généré par prebuild mais pas supporté). Supabase en backend, sur le
**plan gratuit** — le projet se met en pause après environ une semaine sans
requête.

**Direction tranchée le 2026-09-11 : BBB est un club, pas une battle.**

L'app a été construite autour de la compétition — classement, couronne du
leader, streaks, écarts affichés en gros. Ce n'est plus la direction. Le
collectif passe devant : le classement recule au rang d'information secondaire,
et ce qui est mis en avant c'est **où en est le groupe** — les caps franchis
ensemble, la deadline commune, qui lit quoi.

La raison est arithmétique : la compétition entre copines est amusante à 4, elle
devient excluante à 80, où il n'y a qu'une gagnante et soixante-dix-neuf
perdantes. Un produit qui vise 200 lectrices ne peut pas faire de la défaite
l'expérience majoritaire.

Conséquence assumée : le nom porte « Battle ». Il devra probablement changer.
Ce n'est pas urgent, mais ce n'est plus cohérent avec le produit.

Ce qui reste à faire de cette décision, écran par écran : l'accueil met encore la
couronne et les scores au premier plan, et la route `/leaderboard` s'appelle
toujours « Classement ».

**Non décidé** : modération d'un club de 200 personnes, rôle de la créatrice
(simple participante ou animatrice avec des pouvoirs), modèle économique.

## Brand Commitments

**Nom** : Bestie Book Battle (BBB). Bundle `com.leasantos.bestiebookbattle`,
scheme `bestie-book-battle://`.

**Personnalité confirmée : complice, vivante, taquine.** On parle comme entre
copines — direct, tutoiement, phrases courtes. L'app charrie gentiment mais ne
culpabilise jamais : un streak perdu est une vanne, pas un échec. L'humour passe
par les illustrations maison (les PopEyes, la couronne, le crâne) plutôt que par
le texte, qui reste sobre. Chaleureuse sans être mièvre.

**Référence rendue contraignante : BeReal, pour le moment partagé.** Ce qu'on lui
prend précisément, c'est le **rendez-vous synchronisé** : tout le monde vit la
même chose en même temps, et c'est ça qui crée le lien — pas l'accumulation, pas
la course. Ce qu'on ne lui prend pas : la contrainte, la notification impérative,
la fenêtre de deux minutes.

**Anti-référence rendue contraignante : Goodreads et Babelio.** Une base de
données littéraire — dense, froide, des étoiles et des critiques partout, un
catalogue plus qu'un lieu. Si un écran commence à ressembler à une fiche produit
ou à un tableau de notes, il a dérivé. Corollaire : pas de note sur 5, pas de
critique longue, pas de bibliothèque exhaustive.

## Evidence on Hand

- **Illustrations propriétaires** : mascotte PopEyes, `crown.png`, icônes SVG
  maison dans `components/icons/`, texture de fond.
- **Design system partiel** : tokens dans `utils/constants.ts` (palette,
  spacing 4→64, radius, ombres, motion), Storybook on-device avec des stories
  existantes.
- **Système de classement extrait** : `utils/leaderboard.ts` +
  `hooks/useLeaderboardParticipants.ts`, partagés entre l'accueil et
  `/leaderboard`.
- **Données réelles** : un projet Supabase actif avec un challenge de test à 5
  participantes.

**Absences à ne pas combler par de l'invention** : aucun book club réel n'a
encore été onboardé, aucun témoignage, aucune donnée d'usage, aucune recherche
utilisateur. Les créatrices BookTok citées en exemple sont une **observation de
marché, pas des partenaires** — ne jamais les présenter comme telles.

## Product Principles

**1. Le groupe est l'interface, le score est du contexte.**
Ce qu'on voit en premier, c'est où en est le club — pas qui gagne. Un rang isolé
ne veut rien dire ; « 12 lectrices sur 40 ont dépassé le chapitre 7 » en dit plus
qu'une couronne.

**2. Un rendez-vous, pas une course.**
Privilégier ce qui est synchrone et commun (la deadline partagée, l'objectif
intermédiaire du groupe, le moment où tout le monde franchit un cap) à ce qui
s'accumule individuellement.

**3. Personne ne doit se sentir dernière.**
À 200 participantes, le bas du classement est peuplé. Toute mise en scène de la
performance doit avoir une réponse à « et si je suis 187e ? ». Montrer la
progression propre et les voisines de rang — jamais l'écart avec la première.

**4. Taquiner, jamais culpabiliser.**
La rétention passe par l'envie de retrouver les autres, pas par la peur de perdre
quelque chose. Aucun élément de design ne doit punir l'absence.

**5. Trente secondes suffisent.**
Enregistrer sa page doit tenir en un geste depuis l'ouverture. Tout le reste est
consultable, rien d'autre n'est obligatoire.

## Accessibility & Inclusion

**Contraste WCAG AA** est l'exigence retenue : 4.5:1 sur le texte courant, 3:1
sur le texte large (≥18 px, ou gras ≥14 px).

Point d'attention connu : la palette est très grise. `textTertiary` (`#535862`)
et surtout `textPlaceholder` (`#717680`) servent à du petit texte sur fonds
clairs (`#f5f5f5`, `#ffffff`) — labels, sous-titres, compteurs. Zone à vérifier
en priorité.

Non retenu comme exigence pour l'instant, mais ouvert vu le public et la
plateforme : Dynamic Type (la palette de tailles est aujourd'hui en points figés,
hors système), VoiceOver, et Dark Mode — aucune apparence sombre n'existe, alors
que la HIG la traite comme une apparence de premier rang. Le réglage « Réduire
les animations » est respecté dans `ProgressCard`, `LeaderboardList` et
`PressableScale`, mais pas ailleurs.
