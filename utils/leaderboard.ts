/**
 * Logique de classement des participants.
 *
 * Ce fichier ne contient QUE du calcul (pas de JSX) : il est partagé entre
 * la section d'accueil (ProgressCard) et le classement complet (LeaderboardSheet),
 * ce qui garantit que les deux affichent exactement le même ordre et les mêmes rangs.
 *
 * Deux étapes :
 * 1. `rankParticipants` → trie tout le monde et attribue un rang (1, 2, 3…)
 * 2. `selectVisibleRows` → décide lesquels tiennent dans les 4 lignes de l'accueil
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

/** Nombre de lignes affichées sur l'accueil avant de basculer sur le sheet */
export const VISIBLE_SLOTS = 4;

/** Nombre de places du podium gardées quand on épingle la ligne « moi » */
const PODIUM_SLOTS = VISIBLE_SLOTS - 1;

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
 * Décide quoi afficher dans les 4 emplacements de l'accueil.
 *
 * Trois cas :
 * - 4 participants ou moins  → on affiche tout le monde, pas de bouton
 * - Je suis dans le top 3    → on affiche le top 4 d'affilée
 * - Je suis hors du top 3    → on affiche le top 3, puis MA ligne épinglée en dessous
 *
 * Le troisième cas est le plus important : sans lui, une personne classée 9e
 * ne se verrait jamais dans la section et n'aurait aucun repère sur sa progression.
 */
export function selectVisibleRows(ranked: RankedParticipant[]): VisibleRows {
  if (ranked.length <= VISIBLE_SLOTS) {
    return { rows: ranked, pinnedMe: null, hasMore: false };
  }

  const me = ranked.find((p) => p.isMe) ?? null;

  // Je suis hors du podium → top 3 + ma ligne épinglée
  if (me && me.rank > PODIUM_SLOTS) {
    return {
      rows: ranked.slice(0, PODIUM_SLOTS),
      pinnedMe: me,
      hasMore: true,
    };
  }

  // Je suis sur le podium (ou introuvable) → simplement le top 4
  return {
    rows: ranked.slice(0, VISIBLE_SLOTS),
    pinnedMe: null,
    hasMore: true,
  };
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
