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

import { create } from 'zustand';
import {
  addReaction,
  createAnnotation,
  deleteAnnotation,
  getAnnotations,
  getAnnotationsAhead,
  getReadAnnotationIds,
  markAnnotationRead,
  removeReaction,
  updateAnnotation,
  type AnnotationAhead,
  type AnnotationWithAuthor,
} from '../services/supabase/annotations';
import type { Annotation, AnnotationInsert, AnnotationUpdate } from '../types/supabase';

interface AnnotationStore {
  // ═══ État ═══
  /** Les notes lisibles du livre affiché, dans l'ordre du livre */
  notes: AnnotationWithAuthor[];
  /** Les notes encore verrouillées : autrice et page seulement */
  ahead: AnnotationAhead[];
  /** Les notes que j'ai déjà ouvertes */
  readIds: string[];
  /** Le livre actuellement chargé, pour ne pas mélanger deux carnets */
  challengeId: string | null;
  isLoading: boolean;
  error: string | null;

  // ═══ Actions ═══
  /** Charge le carnet d'un livre (notes lisibles + ce qui attend plus loin) */
  loadAnnotations: (challengeId: string, userId?: string) => Promise<void>;
  addNote: (note: AnnotationInsert) => Promise<Annotation>;
  editNote: (id: string, patch: AnnotationUpdate) => Promise<void>;
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
      set({ notes, ahead, readIds, challengeId, isLoading: false });
    } catch (error: any) {
      console.error('[Carnet] chargement impossible', error);
      set({ error: error.message, isLoading: false });
    }
  },

  addNote: async (note) => {
    const created = await createAnnotation(note);
    // On recharge pour récupérer l'autrice et les réactions du même coup
    await get().loadAnnotations(note.challenge_id, note.user_id);
    return created;
  },

  editNote: async (id, patch) => {
    await updateAnnotation(id, patch);
    set((state) => ({
      notes: state.notes.map((note) => (note.id === id ? { ...note, ...patch } : note)),
    }));
  },

  removeNote: async (id) => {
    await deleteAnnotation(id);
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

  reset: () => set({ notes: [], ahead: [], readIds: [], challengeId: null, error: null }),
}));
