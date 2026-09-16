/**
 * Store Zustand du carnet.
 *
 * Deux listes pour un livre :
 * - `notes` : ce que j'ai le droit de lire (la base a déjà écarté le reste) ;
 * - `ahead` : ce qui m'attend plus loin, réduit à « qui » et « à quelle page ».
 *
 * Pas de filtrage anti-spoil ici : il est en base. Le store ne fait que garder
 * ce que le serveur a bien voulu envoyer.
 */

import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';
import {
  addReaction,
  createAnnotation,
  deleteAnnotation,
  deleteVoice,
  getAnnotations,
  getAnnotationsAhead,
  getReadAnnotationIds,
  markAnnotationRead,
  removeReaction,
  updateAnnotation,
  uploadVoice,
  voicePath,
  type AnnotationAhead,
  type AnnotationWithAuthor,
} from '../services/supabase/annotations';
import type { Annotation, AnnotationInsert, AnnotationUpdate } from '../types/supabase';

/** Un vocal tout juste enregistré sur le téléphone, pas encore envoyé */
export interface VoiceClip {
  /** Le fichier local, en cache */
  uri: string;
  seconds: number;
  /** L'onde : `VOICE_BARS` niveaux de 0 à 100 */
  levels: number[];
}

interface AnnotationStore {
  // ═══ État ═══
  /** Les notes lisibles du livre affiché, dans l'ordre du livre */
  notes: AnnotationWithAuthor[];
  /** Les notes encore verrouillées : autrice et page seulement */
  ahead: AnnotationAhead[];
  /** Les notes que j'ai déjà ouvertes */
  readIds: string[];
  /**
   * Les notes que ma dernière page enregistrée vient d'ouvrir : les post-it de
   * l'accueil. Elles s'y montrent jusqu'à ce que j'ouvre le carnet ou que je
   * les lise.
   */
  revealedIds: string[];
  /** Quand elles ont été révélées : l'animation ne se joue qu'à ce moment-là */
  revealedAt: number | null;
  /** Le livre actuellement chargé, pour ne pas mélanger deux carnets */
  challengeId: string | null;
  isLoading: boolean;
  error: string | null;

  // ═══ Actions ═══
  /** Charge le carnet d'un livre (notes lisibles + ce qui attend plus loin) */
  loadAnnotations: (challengeId: string, userId?: string) => Promise<void>;
  /**
   * Après « Enregistrer » : recharge le carnet et retient les notes des autres
   * qui viennent de s'ouvrir — celles entre mon ancienne page et la nouvelle.
   */
  revealAfterSave: (challengeId: string, userId: string) => Promise<void>;
  /** Les post-it ont fait leur travail : ils se rangent dans le carnet */
  dismissRevealed: () => void;
  /** Publie une note, avec son vocal s'il y en a un */
  addNote: (note: AnnotationInsert, voice?: VoiceClip | null) => Promise<Annotation>;
  /**
   * Modifie ma note. `voice` : `undefined` garde le vocal tel quel, `null` le
   * supprime, un nouvel enregistrement le remplace.
   */
  editNote: (id: string, patch: AnnotationUpdate, voice?: VoiceClip | null) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
  /** Ajoute ou retire ma réaction, selon qu'elle existe déjà */
  toggleReaction: (annotationId: string, userId: string, emoji: string) => Promise<void>;
  markRead: (annotationId: string, userId: string) => Promise<void>;
  reset: () => void;
}

export const useAnnotationStore = create<AnnotationStore>((set, get) => ({
  notes: [],
  ahead: [],
  readIds: [],
  revealedIds: [],
  revealedAt: null,
  challengeId: null,
  isLoading: false,
  error: null,

  loadAnnotations: async (challengeId, userId) => {
    // Pas de spinner : on garde l'ancien carnet à l'écran pendant le
    // rafraîchissement, comme le reste de l'app.
    set({ isLoading: true, error: null });
    try {
      const [notes, ahead, readIds] = await Promise.all([
        getAnnotations(challengeId),
        getAnnotationsAhead(challengeId),
        userId ? getReadAnnotationIds(userId) : Promise.resolve<string[]>([]),
      ]);
      set((state) => {
        // Un autre livre : ses post-it n'ont rien à faire ici. Même livre : on
        // ne garde que ceux qui sont encore lisibles (page enregistrée en arrière).
        const revealedIds =
          state.challengeId === challengeId
            ? state.revealedIds.filter((id) => notes.some((note) => note.id === id))
            : [];
        return { notes, ahead, readIds, revealedIds, challengeId, isLoading: false };
      });
    } catch (error: any) {
      console.error('[Carnet] chargement impossible', error);
      set({ error: error.message, isLoading: false });
    }
  },

  revealAfterSave: async (challengeId, userId) => {
    // Ce que je pouvais déjà lire avant d'avancer. Sans carnet chargé pour ce
    // livre, impossible de savoir ce qui est nouveau : on ne révèle rien.
    const before =
      get().challengeId === challengeId ? new Set(get().notes.map((note) => note.id)) : null;

    await get().loadAnnotations(challengeId, userId);
    if (!before) return;

    const { notes, readIds, revealedIds } = get();
    const crossed = notes
      .filter(
        (note) =>
          !before.has(note.id) &&
          note.user_id !== userId &&
          !readIds.includes(note.id) &&
          !revealedIds.includes(note.id),
      )
      .map((note) => note.id);
    if (crossed.length === 0) return;

    // Deux pages enregistrées sans ouvrir le carnet : les post-it s'additionnent
    set({ revealedIds: [...revealedIds, ...crossed], revealedAt: Date.now() });
  },

  dismissRevealed: () => {
    if (get().revealedIds.length > 0) set({ revealedIds: [], revealedAt: null });
  },

  addNote: async (note, voice) => {
    // L'identifiant est choisi ici : le vocal part AVANT la note, et une note
    // qui n'a qu'un vocal ne passerait pas la règle « une note dit quelque chose »
    // sans son chemin.
    const id = note.id ?? randomUUID();
    const path = voice ? voicePath(note.challenge_id, id) : null;
    if (voice && path) await uploadVoice(voice.uri, path);

    try {
      const created = await createAnnotation({
        ...note,
        id,
        ...(voice && path
          ? { audio_path: path, audio_seconds: voice.seconds, audio_levels: voice.levels }
          : {}),
      });
      // On recharge pour récupérer l'autrice et les réactions du même coup
      await get().loadAnnotations(note.challenge_id, note.user_id);
      return created;
    } catch (error) {
      // Pas de vocal orphelin dans le bucket
      if (path) await deleteVoice(path);
      throw error;
    }
  },

  editNote: async (id, patch, voice) => {
    const current = get().notes.find((note) => note.id === id);
    const oldPath = current?.audio_path ?? null;
    let full: AnnotationUpdate = patch;
    let newPath: string | null = null;

    if (voice === null) {
      full = { ...patch, audio_path: null, audio_seconds: null, audio_levels: null };
    } else if (voice && current) {
      newPath = voicePath(current.challenge_id, id);
      await uploadVoice(voice.uri, newPath);
      full = { ...patch, audio_path: newPath, audio_seconds: voice.seconds, audio_levels: voice.levels };
    }

    try {
      await updateAnnotation(id, full);
    } catch (error) {
      if (newPath) await deleteVoice(newPath);
      throw error;
    }

    // L'ancien vocal ne sert plus qu'une fois la note à jour
    if (voice !== undefined && oldPath) await deleteVoice(oldPath);

    set((state) => ({
      notes: state.notes.map((note) => (note.id === id ? { ...note, ...full } : note)),
    }));
  },

  removeNote: async (id) => {
    const audioPath = get().notes.find((note) => note.id === id)?.audio_path;
    await deleteAnnotation(id);
    if (audioPath) await deleteVoice(audioPath);
    set((state) => ({ notes: state.notes.filter((note) => note.id !== id) }));
  },

  toggleReaction: async (annotationId, userId, emoji) => {
    const note = get().notes.find((n) => n.id === annotationId);
    const mine = note?.reactions.find((r) => r.user_id === userId && r.emoji === emoji);

    // La réaction bouge tout de suite à l'écran, le serveur suit
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id !== annotationId
          ? n
          : {
              ...n,
              reactions: mine
                ? n.reactions.filter((r) => !(r.user_id === userId && r.emoji === emoji))
                : [
                    ...n.reactions,
                    {
                      annotation_id: annotationId,
                      user_id: userId,
                      emoji,
                      created_at: new Date().toISOString(),
                    },
                  ],
            },
      ),
    }));

    try {
      if (mine) await removeReaction(annotationId, userId, emoji);
      else await addReaction(annotationId, userId, emoji);
    } catch (error) {
      console.error('[Carnet] réaction impossible', error);
      // On remet l'écran d'accord avec le serveur
      const challengeId = get().challengeId;
      if (challengeId) await get().loadAnnotations(challengeId, userId);
    }
  },

  markRead: async (annotationId, userId) => {
    if (get().readIds.includes(annotationId)) return;
    set((state) => ({ readIds: [...state.readIds, annotationId] }));
    try {
      await markAnnotationRead(annotationId, userId);
    } catch (error) {
      console.warn('[Carnet] impossible de marquer comme lue', error);
    }
  },

  reset: () =>
    set({
      notes: [],
      ahead: [],
      readIds: [],
      revealedIds: [],
      revealedAt: null,
      challengeId: null,
      error: null,
    }),
}));
