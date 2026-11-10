/**
 * notice — le seul modèle d'erreur de l'app (#205).
 *
 *    oops('Page pas enregistrée', error, { retry: save })
 *    nudge('Choisis une page', 'Entre 1 et 320')
 *
 * Un bandeau en verre descend en haut de l'écran, au-dessus de tout (sheets
 * compris) : ce qui s'est passé, quoi faire, et « Réessayer » quand on peut.
 * Il remplace la fenêtre grise d'iOS (`Alert.alert('Erreur', …)`), qui ne dit
 * jamais quoi faire et sort de la direction artistique.
 *
 * - `oops` : une action a échoué. Le conseil se déduit de l'erreur : sans réseau,
 *   « réessaie quand ça capte », sinon « réessaie dans un instant ».
 * - `nudge` : une saisie à corriger, plus doux (une vibration, pas de son).
 * - `notePing` : pas une erreur, la seule nouvelle qui mérite un signe app
 *   ouverte (#178) — une pote vient de déposer une note. Bandeau papier, le
 *   toucher ouvre le carnet.
 *
 * Restent des `Alert` natifs : les confirmations (supprimer, se déconnecter) et
 * les autorisations qui renvoient vers les Réglages. Ce sont des choix, pas des
 * erreurs, et iOS les dessine.
 *
 * Le bandeau lui-même : `components/ui/NoticeHost.tsx`, monté une fois dans
 * `app/_layout.tsx`.
 */

import { create } from 'zustand';
import { buzz, feel } from './feel';

export type NoticeKind = 'error' | 'offline' | 'hint' | 'note';

export interface Notice {
  id: number;
  kind: NoticeKind;
  /** Ce qui s'est passé, en quelques mots, sans point final */
  title: string;
  /** Quoi faire */
  hint?: string;
  /** Relance l'action ratée : affiche « Réessayer » */
  retry?: () => unknown;
  /** Le toucher ouvre quelque chose (une note déposée → le carnet) */
  open?: () => unknown;
}

interface NoticeState {
  current: Notice | null;
  show: (notice: Omit<Notice, 'id'>) => void;
  hide: (id?: number) => void;
}

let nextId = 1;

export const useNoticeStore = create<NoticeState>((set, get) => ({
  current: null,
  show: (notice) => set({ current: { ...notice, id: nextId++ } }),
  // Avec un id, ne ferme que ce bandeau-là : un plus récent reste affiché
  hide: (id) => {
    if (id === undefined || get().current?.id === id) set({ current: null });
  },
}));

const OFFLINE_PATTERNS = [
  'network request failed',
  'failed to fetch',
  'networkerror',
  'network error',
  'internet connection appears to be offline',
  'timed out',
  'timeout',
  'fetch failed',
  'load failed',
];

/** L'erreur vient-elle du réseau (pas de connexion, délai dépassé) ? */
export function isOffline(error: unknown): boolean {
  if (!error) return false;
  const text = [
    typeof error === 'string' ? error : '',
    (error as { message?: unknown }).message,
    (error as { details?: unknown }).details,
    (error as { name?: unknown }).name,
  ]
    .filter((part): part is string => typeof part === 'string')
    .join(' ')
    .toLowerCase();
  return OFFLINE_PATTERNS.some((pattern) => text.includes(pattern));
}

export const OFFLINE_HINT = 'Pas de réseau, réessaie quand ça capte';
export const LATER_HINT = 'Réessaie dans un instant';

interface OopsOptions {
  /** Relance l'action : affiche « Réessayer » */
  retry?: () => unknown;
  /** Remplace le conseil déduit de l'erreur, sauf sans réseau */
  hint?: string;
  /** Le son d'erreur a déjà été joué (ex. par le store) */
  felt?: boolean;
}

/** Une action a échoué : le dire, et dire quoi faire */
export function oops(title: string, error?: unknown, options: OopsOptions = {}) {
  const offline = isOffline(error);
  if (!options.felt) feel('erreur');
  useNoticeStore.getState().show({
    kind: offline ? 'offline' : 'error',
    title,
    hint: offline ? OFFLINE_HINT : options.hint ?? LATER_HINT,
    retry: options.retry,
  });
}

/** Une saisie à corriger : ce qui ne va pas, et comment le corriger */
export function nudge(title: string, hint?: string) {
  buzz();
  useNoticeStore.getState().show({ kind: 'hint', title, hint });
}

/** Une note vient d'être déposée, app ouverte : un bandeau papier, le toucher ouvre le carnet */
export function notePing(title: string, hint: string | undefined, open: () => unknown) {
  feel('lue');
  useNoticeStore.getState().show({ kind: 'note', title, hint, open });
}
