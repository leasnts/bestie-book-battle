/**
 * Logique de classement des participants.
 *
 * Ce fichier ne contient QUE du calcul (pas de JSX) : il est partagé entre
 * la section d'accueil (ProgressCard) et le classement complet (LeaderboardSheet),
 * ce qui garantit que les deux affichent exactement le même ordre et les mêmes rangs.
 *
 * Deux étapes :
 * 1. `rankParticipants` → trie tout le monde et attribue un rang (1, 2, 3…)
 * 2. `selectVisibleRows` → décide lesquels s'affichent sur l'accueil (top 3 + moi)
 */

// ─── Types ─────────────────────────────────────────────────────────

export interface LeaderboardParticipant {
  id: string;
  name: string;
  photoUrl: string | null;
  /** Page actuelle (= score brut) */
  score: number;
  /** Progression en %, tient compte du total_pages propre à chaque édition */
  percentage: number;
  /** Nombre de jours consécutifs de lecture */
  streak: number;
  /** true = a lu hier mais pas aujourd'hui, le streak va « mourir » sans lecture */
  streakAtRisk?: boolean;
}

/** Un participant enrichi de sa position dans le classement */
export interface RankedParticipant extends LeaderboardParticipant {
  /** Rang dans le classement, à partir de 1 */
  rank: number;
  /** Est en tête du classement (rang 1) */
  isLeader: boolean;
  /** Est l'utilisateur connecté */
  isMe: boolean;
}

/** Taille du podium affiché sur l'accueil : le reste s'ouvre dans le sheet */
export const PODIUM_SLOTS = 3;

// ─── Étape 1 : classer ─────────────────────────────────────────────

/**
 * Trie les participants par progression décroissante et leur attribue un rang.
 *
 * Le tri se fait sur le POURCENTAGE, pas sur le nombre de pages : deux personnes
 * peuvent lire des éditions différentes (400 pages vs 520 pages), et comparer
 * leurs pages brutes serait injuste.
 *
 * En cas d'égalité parfaite, on départage par le streak (celui qui lit le plus
 * régulièrement passe devant), puis par le prénom pour que l'ordre reste stable
 * d'un rendu à l'autre.
 */
export function rankParticipants(
  participants: LeaderboardParticipant[],
  myUserId: string,
): RankedParticipant[] {
  return [...participants]
    .sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage;
      if (b.streak !== a.streak) return b.streak - a.streak;
      return a.name.localeCompare(b.name);
    })
    .map((participant, index) => ({
      ...participant,
      rank: index + 1,
      isLeader: index === 0,
      isMe: participant.id === myUserId,
    }));
}

// ─── Étape 2 : sélectionner ce qui tient sur l'accueil ─────────────

export interface VisibleRows {
  /** Les lignes affichées en haut (podium ou classement complet si peu de monde) */
  rows: RankedParticipant[];
  /**
   * Ma ligne, affichée à part sous un séparateur quand je suis hors du podium.
   * null si je suis déjà dans `rows` (ou absente du challenge).
   */
  pinnedMe: RankedParticipant | null;
  /** true si des participants ne sont affichés nulle part → on montre le bouton */
  hasMore: boolean;
}

/**
 * Décide quoi afficher sur l'accueil : le top 3 du challenge, plus moi.
 *
 * Deux cas :
 * - Je suis dans le top 3 → le top 3, rien d'autre
 * - Je suis hors du top 3 → le top 3, puis MA ligne épinglée en dessous
 *
 * Le second cas est le plus important : sans lui, une personne classée 9e
 * ne se verrait jamais dans la section et n'aurait aucun repère sur sa progression.
 *
 * Le bouton vers le classement complet n'apparaît que si quelqu'un n'est
 * affiché nulle part.
 */
export function selectVisibleRows(ranked: RankedParticipant[]): VisibleRows {
  const rows = ranked.slice(0, PODIUM_SLOTS);
  const me = ranked.find((p) => p.isMe) ?? null;
  const pinnedMe = me && me.rank > PODIUM_SLOTS ? me : null;
  const shownCount = rows.length + (pinnedMe ? 1 : 0);

  return { rows, pinnedMe, hasMore: ranked.length > shownCount };
}

// ─── Helpers d'affichage ───────────────────────────────────────────

/**
 * Formate le score d'un participant.
 * Quand les participants lisent des éditions différentes, afficher « 142 » et
 * « 138 » côte à côte n'a aucun sens : on bascule alors sur le pourcentage.
 */
export function formatScore(
  participant: LeaderboardParticipant,
  showPercentage: boolean | undefined,
): number {
  return showPercentage ? Math.round(participant.percentage) : participant.score;
}

/** Libellé du compteur de participants : « 12 lectrices », « 1 lectrice » */
export function formatParticipantCount(count: number): string {
  return `${count} lectrice${count > 1 ? 's' : ''}`;
}
