/**
 * Route /note/[id] — écrire une note, ou reprendre la sienne.
 *
 * `id = "new"` ouvre une note vierge à ma page enregistrée ; un identifiant
 * ouvre ma note pour la modifier ou la supprimer.
 *
 * Une note dit forcément quelque chose : **au minimum un emoji**. « Publier »
 * reste éteint tant qu'il n'y a ni emoji ni texte.
 *
 * La page est écrite dans MON édition, mais stockée en position (0 → 1) : c'est
 * elle qui permettra aux autres de voir « ≈ p. 258 » dans la leur, et c'est elle
 * qui décide du déblocage anti-spoil.
 *
 * Aucune phrase d'explication dans l'écran : des repères courts et des noms.
 */

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MinusIcon, PlusIcon, Trash2Icon, XIcon } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import PressableScale from '../../components/ui/PressableScale';
import { sheetTitleItem } from '../../components/ui/SheetHeader';
import VoicePlayer from '../../components/ui/VoicePlayer';
import VoiceRecorder from '../../components/ui/VoiceRecorder';
import { useAnnotationStore, type VoiceClip } from '../../stores/annotationStore';
import { useAuthStore } from '../../stores/authStore';
import { useProgressStore } from '../../stores/progressStore';
import { useProjectStore } from '../../stores/projectStore';
import type { AnnotationCategory, AnnotationVisibility } from '../../types/supabase';
import {
  ANNOTATION_CATEGORIES,
  CATEGORY_ORDER,
  DEFAULT_CATEGORY,
  positionFromPage,
} from '../../utils/annotations';
import { borderRadius, colors, fonts, inkAlpha, spacing } from '../../utils/constants';

/** Le vocal affiché : déjà envoyé (`path`) ou tout juste enregistré (`uri`) */
interface NoteVoice {
  path?: string | null;
  uri?: string;
  seconds: number;
  levels?: number[] | null;
}

/** Les emojis qui reviennent le plus en club de lecture. Le clavier fait le reste. */
const QUICK_EMOJIS = ['😭', '😂', '🔥', '😱', '🥺', '💀', '📌', '❤️'];

export default function NoteFormRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { user } = useAuthStore();
  const activeChallenge = useProjectStore((s) => s.activeChallenge);
  const { participants } = useProgressStore();
  const { notes, addNote, editNote, removeNote } = useAnnotationStore();

  const existing = id === 'new' ? null : notes.find((note) => note.id === id) ?? null;

  /** Mon édition : la note s'écrit dans mes pages à moi */
  const myPages = useMemo(() => {
    const mine = participants.find((p) => p.user.id === user?.id);
    return mine?.progress.total_pages ?? activeChallenge?.total_pages ?? 0;
  }, [participants, user?.id, activeChallenge?.total_pages]);

  const savedPage = useMemo(() => {
    const mine = participants.find((p) => p.user.id === user?.id);
    return mine?.progress.current_page ?? 0;
  }, [participants, user?.id]);

  const [page, setPage] = useState(existing?.page ?? savedPage);
  const [emoji, setEmoji] = useState<string | null>(existing?.emoji ?? null);
  const [body, setBody] = useState(existing?.body ?? '');
  const [category, setCategory] = useState<AnnotationCategory>(
    existing?.category ?? DEFAULT_CATEGORY,
  );
  const [visibility, setVisibility] = useState<AnnotationVisibility>(
    existing?.visibility ?? 'club',
  );
  const [saving, setSaving] = useState(false);

  /**
   * Le vocal : celui déjà envoyé (un chemin), un nouvel enregistrement (un
   * fichier), ou rien. `voiceChanged` dit s'il faut toucher au vocal en base.
   */
  const [voice, setVoice] = useState<NoteVoice | null>(
    existing?.audio_path
      ? {
          path: existing.audio_path,
          seconds: existing.audio_seconds ?? 0,
          levels: existing.audio_levels,
        }
      : null,
  );
  const [voiceChanged, setVoiceChanged] = useState(false);
  const [recording, setRecording] = useState(false);

  const handleVoiceChange = useCallback((clip: VoiceClip | null) => {
    setVoice(clip);
    setVoiceChanged(true);
  }, []);

  // Un vocal suffit à faire une note, comme un emoji ou un texte
  const hasContent = emoji !== null || body.trim().length > 0 || voice !== null;
  const canPublish = hasContent && !recording;
  const style = ANNOTATION_CATEGORIES[category];

  const handlePublish = useCallback(async () => {
    if (!canPublish || !activeChallenge || !user?.id || saving) return;
    setSaving(true);
    try {
      const shared = {
        page,
        edition_total_pages: myPages,
        position: Number(positionFromPage(page, myPages).toFixed(5)),
        emoji,
        body: body.trim() || null,
        category,
        visibility,
      };

      // Un nouvel enregistrement part avec la note ; sinon on n'y touche pas
      const clip: VoiceClip | null =
        voice?.uri ? { uri: voice.uri, seconds: voice.seconds, levels: voice.levels ?? [] } : null;

      if (existing) {
        await editNote(existing.id, shared, voiceChanged ? clip : undefined);
      } else {
        await addNote(
          {
            challenge_id: activeChallenge.id,
            user_id: user.id,
            ...shared,
          },
          clip,
        );
      }
      router.back();
    } catch (error) {
      console.error('[Carnet] publication impossible', error);
      Alert.alert('Erreur', "La note n'a pas pu être enregistrée. Réessaie.");
      setSaving(false);
    }
  }, [
    canPublish,
    activeChallenge,
    user?.id,
    saving,
    voice,
    voiceChanged,
    page,
    myPages,
    emoji,
    body,
    category,
    visibility,
    existing,
    editNote,
    addNote,
    router,
  ]);

  const handleDelete = useCallback(() => {
    if (!existing) return;
    Alert.alert('Supprimer la note', 'Elle disparaîtra pour tout le club.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await removeNote(existing.id);
          router.back();
        },
      },
    ]);
  }, [existing, removeNote, router]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      {/*
        Les deux boutons vivent dans la barre de navigation du sheet : c'est là
        qu'iOS les attend, et ça évite un deuxième titre sous celui du système.
      */}
      <Stack.Screen
        options={{
          // Fermer, puis le titre ferré à gauche (norme des sheets, SheetHeader.tsx)
          unstable_headerLeftItems: () => [
            {
              type: 'custom',
              element: (
                <Pressable
                  onPress={() => router.back()}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Fermer"
                >
                  <XIcon size={20} color={colors.dark900} strokeWidth={2.4} />
                </Pressable>
              ),
            },
            sheetTitleItem(existing ? 'Ma note' : 'Nouvelle note'),
          ],
          headerRight: () => (
            <PressableScale
              style={[styles.publish, !canPublish && styles.publishOff]}
              pressedScale={0.94}
              disabled={!canPublish || saving}
              onPress={handlePublish}
              accessibilityRole="button"
              accessibilityLabel={existing ? 'Enregistrer la note' : 'Publier la note'}
            >
              <Text style={[styles.publishText, !canPublish && styles.publishTextOff]}>
                {existing ? 'Enregistrer' : 'Publier'}
              </Text>
            </PressableScale>
          ),
        }}
      />

      {/* ─── La page ─── */}
      <View style={styles.pageRow}>
        <Stepper
          icon={MinusIcon}
          label="Une page en arrière"
          onPress={() => setPage((p) => Math.max(0, p - 1))}
        />
        <Text style={styles.page}>
          <Text style={styles.pagePrefix}>p. </Text>
          {page}
        </Text>
        <Stepper
          icon={PlusIcon}
          label="Une page en avant"
          onPress={() => setPage((p) => Math.min(myPages, p + 1))}
        />
      </View>

      {/* ─── Le post-it ─── */}
      <View style={[styles.note, { backgroundColor: style.color }]}>
        <Text style={styles.noteCategory}>{style.label}</Text>
        {emoji && <Text style={styles.noteEmoji}>{emoji}</Text>}
        <TextInput
          style={styles.noteInput}
          value={body}
          onChangeText={setBody}
          placeholder="…"
          placeholderTextColor={inkAlpha(0.35)}
          multiline
          maxLength={2000}
          accessibilityLabel="Texte de la note"
        />
        {voice && !recording && (
          <View style={styles.noteVoice}>
            <VoicePlayer
              // Un nouveau vocal remplace le lecteur : il repart du début
              key={voice.uri ?? voice.path ?? 'voice'}
              uri={voice.uri}
              path={voice.path}
              seconds={voice.seconds}
              levels={voice.levels}
            />
          </View>
        )}
      </View>

      {/* ─── Vocal ─── */}
      <Text style={styles.rowTitle}>Vocal</Text>
      <VoiceRecorder
        clip={voice}
        onChange={handleVoiceChange}
        onRecordingChange={setRecording}
      />

      {/* ─── Emoji ─── */}
      <Text style={styles.rowTitle}>Emoji</Text>
      <View style={styles.emojiRow}>
        {QUICK_EMOJIS.map((candidate) => (
          <PressableScale
            key={candidate}
            style={[styles.emojiButton, emoji === candidate && styles.emojiButtonOn]}
            pressedScale={0.9}
            onPress={() => setEmoji(emoji === candidate ? null : candidate)}
            accessibilityRole="button"
            accessibilityLabel={`Emoji ${candidate}`}
            accessibilityState={{ selected: emoji === candidate }}
          >
            <Text style={styles.emojiText}>{candidate}</Text>
          </PressableScale>
        ))}
      </View>

      {/* ─── Catégorie ─── */}
      <Text style={styles.rowTitle}>Catégorie</Text>
      <View style={styles.categories}>
        {CATEGORY_ORDER.map((key) => {
          const option = ANNOTATION_CATEGORIES[key];
          const selected = key === category;
          return (
            <PressableScale
              key={key}
              style={[
                styles.category,
                { backgroundColor: option.color },
                selected && styles.categoryOn,
              ]}
              pressedScale={0.96}
              onPress={() => setCategory(key)}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected }}
            >
              <Text style={styles.categoryText} numberOfLines={1}>
                {option.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>

      {/* ─── Visible par ─── */}
      <Text style={styles.rowTitle}>Visible par</Text>
      <View style={styles.segment}>
        {(['club', 'private'] as AnnotationVisibility[]).map((option) => {
          const selected = visibility === option;
          return (
            <Pressable
              key={option}
              style={[styles.segmentItem, selected && styles.segmentItemOn]}
              onPress={() => setVisibility(option)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.segmentText, selected && styles.segmentTextOn]}>
                {option === 'club' ? 'Le club' : 'Moi'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {existing && (
        <Pressable
          onPress={handleDelete}
          style={({ pressed }) => [styles.delete, pressed && { opacity: 0.6 }]}
          accessibilityRole="button"
          accessibilityLabel="Supprimer la note"
        >
          <Trash2Icon size={17} color={colors.error} strokeWidth={2} />
          <Text style={styles.deleteText}>Supprimer</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

/** Le − et le + de la page : deux ronds identiques, seule l'icône change */
function Stepper({
  icon: Icon,
  label,
  onPress,
}: {
  icon: typeof PlusIcon;
  label: string;
  onPress: () => void;
}) {
  return (
    <PressableScale
      style={styles.stepper}
      pressedScale={0.9}
      hitSlop={8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon size={18} color={colors.dark900} strokeWidth={2.6} />
    </PressableScale>
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const STEPPER_SIZE = 36;

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.white,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
  },

  publish: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.dark900,
  },
  // Éteint par la couleur, pas par l'opacité : PressableScale anime l'opacité
  // sur le thread natif et écraserait une opacité posée dans le style.
  publishOff: {
    backgroundColor: inkAlpha(0.12),
  },
  publishText: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 14,
    color: colors.white,
  },
  publishTextOff: {
    color: colors.textPlaceholder,
  },

  pageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  stepper: {
    width: STEPPER_SIZE,
    height: STEPPER_SIZE,
    borderRadius: STEPPER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: inkAlpha(0.07),
  },
  page: {
    fontFamily: fonts.display,
    fontSize: 34,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  pagePrefix: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.textPlaceholder,
  },

  note: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    minHeight: 140,
  },
  noteCategory: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: inkAlpha(0.6),
  },
  noteEmoji: {
    fontSize: 30,
    marginTop: spacing.sm,
  },
  noteVoice: {
    marginTop: spacing.sm,
  },
  noteInput: {
    marginTop: spacing.sm,
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
    minHeight: 60,
  },

  rowTitle: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textTertiary,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },

  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  emojiButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgLight,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiButtonOn: {
    borderColor: colors.dark900,
  },
  emojiText: {
    fontSize: 22,
  },

  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  category: {
    flexGrow: 1,
    flexBasis: '30%',
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryOn: {
    borderColor: colors.dark900,
  },
  categoryText: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 13,
    color: colors.textPrimary,
  },

  segment: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: borderRadius.md,
    backgroundColor: inkAlpha(0.07),
  },
  segmentItem: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
  },
  segmentItemOn: {
    backgroundColor: colors.white,
  },
  segmentText: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 14,
    color: colors.textTertiary,
  },
  segmentTextOn: {
    color: colors.textPrimary,
  },

  delete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing['2xl'],
    minHeight: 44,
  },
  deleteText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.error,
  },
});
