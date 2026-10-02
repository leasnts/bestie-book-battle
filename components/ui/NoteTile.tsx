/**
 * NoteTile — le carré du carnet sur l'accueil : la note « à la une », seule.
 *
 *    ┌┄┄┄┄┄┄┄┄┄┄┄┐
 *    ┆ Larmes    p. 142 ┆   la catégorie (toujours écrite) et la page
 *    ┆ Faria qui lui    ┆   le texte, la citation, l'emoji seul ou le vocal
 *    ┆ lègue tout…      ┆
 *    ┆ Camille   1 / 3 ◢┆   l'autrice, et où on en est dans les nouvelles
 *    └┄┄┄┄┄┄┄┄┄┄┄┘
 *
 * Pas de cadre en verre derrière : le carré EST la note (retour de Lea,
 * 2026-09-29). Le coin corné en bas à droite invite à tourner la page ; tout le
 * carré ouvre le carnet.
 *
 * Arracher (#118) : tirer un coin décolle l'autocollant, comme dans la pile des
 * nouvelles ; lâché assez loin, il s'envole et la note d'avant est dessous.
 * Après la dernière, on revient à la une. Ce n'est que feuilleter : rien n'est
 * marqué comme lu.
 *
 * Quelle note : la première des nouvelles (celles que ma dernière page vient
 * d'ouvrir), sinon la plus récente. Sans note lisible, un autocollant de papier
 * nu : un cadenas et le nombre de notes plus loin, ou rien du tout.
 */

import * as Haptics from 'expo-haptics';
import { LockIcon, MicIcon, NotebookPenIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { AnnotationWithAuthor } from '../../services/supabase/annotations';
import {
  ANNOTATION_CATEGORIES,
  formatNotePage,
  formatVoiceDuration,
  isEmojiOnly,
} from '../../utils/annotations';
import { colors, fonts, inkAlpha, motion, spacing } from '../../utils/constants';
import NoteSticker, { STICKER_BASE_LARGE } from './NoteSticker';
import PeelSurface, { peelAmount } from './PeelSurface';
import PressableScale from './PressableScale';

interface NoteTileProps {
  /**
   * Les notes à feuilleter : celle à la une d'abord, puis les précédentes.
   * Vide s'il n'y en a aucune de lisible.
   */
  notes: AnnotationWithAuthor[];
  myUserId?: string;
  /** Le nombre de nouvelles ; ce sont les premières de `notes` */
  freshCount: number;
  /** Les notes encore plus loin que ma page */
  aheadCount: number;
  /** Le nombre de pages de MON édition */
  myTotalPages: number;
  onPress: () => void;
}

/** Les barres de l'onde du vocal, dans le carré */
const WAVE_BARS = 18;
/** Décollé à plus de la moitié : lâcher le fait s'envoler (comme la pile) */
const PEEL_OFF = 0.5;

const easeOut = Easing.bezier(...motion.easing.easeOutQuart);
const sway = Easing.inOut(Easing.sin);

export default function NoteTile({
  notes,
  myUserId,
  freshCount,
  aheadCount,
  myTotalPages,
  onPress,
}: NoteTileProps) {
  const [side, setSide] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    setSide((prev) => (prev === width ? prev : width));
  };

  /** Combien d'autocollants arrachés depuis la une ; après la dernière, on revient à la une */
  const [turn, setTurn] = useState(0);
  const firstId = notes[0]?.id;
  useEffect(() => setTurn(0), [firstId]);

  const count = notes.length;
  const at = count ? turn % count : 0;
  const nextAt = count ? (turn + 1) % count : 0;
  const note = notes[at] ?? null;
  const next = count > 1 ? notes[nextAt] : null;
  const isMine = (n: AnnotationWithAuthor) => !!myUserId && n.user_id === myUserId;
  /** Sa place dans les nouvelles (1, 2…), tant qu'on est dedans */
  const freshPlace = (i: number) => (i < freshCount ? i + 1 : 0);
  const peelOff = () => setTurn((t) => t + 1);

  const label = note
    ? `Carnet de notes. Note de ${isMine(note) ? 'moi' : note.author?.first_name ?? 'quelqu’un'}${
        freshPlace(at) ? `, ${freshPlace(at)} sur ${freshCount} nouvelles` : ''
      }`
    : aheadCount > 0
      ? `Carnet de notes, ${aheadCount} ${aheadCount > 1 ? 'notes' : 'note'} plus loin`
      : 'Carnet de notes';

  const face = (n: AnnotationWithAuthor, i: number) => (
    <Face side={side} note={n}>
      <NoteContent
        note={n}
        isMine={isMine(n)}
        freshAt={freshPlace(i)}
        freshCount={freshCount}
        myTotalPages={myTotalPages}
      />
    </Face>
  );

  return (
    <PressableScale
      style={styles.tile}
      onLayout={onLayout}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Ouvre le carnet de notes"
      // VoiceOver n'arrache pas : une action « note précédente » à la place du geste
      accessibilityActions={next ? [{ name: 'previous', label: 'Note précédente' }] : undefined}
      onAccessibilityAction={(e) => e.nativeEvent.actionName === 'previous' && peelOff()}
    >
      {side > 0 &&
        (note ? (
          <>
            {/* La clé suit le tour : celui du dessous devient celui du dessus sans être redessiné */}
            {next && (
              <View key={turn + 1} style={StyleSheet.absoluteFill} pointerEvents="none">
                {face(next, nextAt)}
              </View>
            )}
            <PeelCard key={turn} side={side} id={`tile-${turn}`} enabled={!!next} onPeeled={peelOff}>
              {face(note, at)}
            </PeelCard>
          </>
        ) : (
          <Face side={side} note={null}>
            <View style={styles.blank}>
              {aheadCount > 0 ? (
                <>
                  <LockIcon size={22} color={colors.textTertiary} strokeWidth={2.2} />
                  <Text style={styles.blankCount}>{aheadCount}</Text>
                </>
              ) : (
                <NotebookPenIcon size={26} color={colors.textTertiary} strokeWidth={2} />
              )}
            </View>
          </Face>
        ))}
    </PressableScale>
  );
}

/** Un autocollant du carré : le papier brodé de sa catégorie, la note par-dessus */
function Face({ side, note, children }: { side: number; note: AnnotationWithAuthor | null; children: React.ReactNode }) {
  return (
    <View style={{ width: side, height: side }}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <NoteSticker
          id={`note-tile-${note?.id ?? 'blank'}`}
          color={note ? ANNOTATION_CATEGORIES[note.category].color : null}
          size={side}
          maxBase={STICKER_BASE_LARGE}
          corner="bottom-right"
          watermark={note ? ANNOTATION_CATEGORIES[note.category].label : undefined}
          watermarkInset={spacing.lg - 2}
        />
      </View>
      {children}
    </View>
  );
}

// ─── L'autocollant du dessus, qu'on arrache ─────────────────────────

/**
 * Tirer un coin vers l'intérieur le décolle (même rendu que la pile). Lâché
 * avant la moitié, il se recolle ; au-delà, le pli traverse tout, et
 * l'autocollant s'envole comme une feuille : il monte en se balançant, tourne
 * un peu, s'efface. Le toucher simple, lui, ouvre toujours le carnet.
 *
 * Le geste ne démarre qu'à l'horizontale : glisser vers le haut ou le bas sur
 * le carré fait toujours défiler l'accueil.
 */
function PeelCard({
  side,
  id,
  enabled,
  onPeeled,
  children,
}: {
  side: number;
  id: string;
  /** Une seule note : rien dessous, rien à arracher */
  enabled: boolean;
  onPeeled: () => void;
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const w = useSharedValue(side);
  const h = useSharedValue(side);
  const ax = useSharedValue(0);
  const ay = useSharedValue(0);
  const bx = useSharedValue(0);
  const by = useSharedValue(0);
  const peeling = useSharedValue(0);
  const values = { w, h, ax, ay, bx, by, peeling };
  /** Passé la moitié : lâcher l'arrache (une vibration l'annonce, une autre si on revient) */
  const armed = useSharedValue(0);
  /** Le coin est tiré vers l'intérieur : sinon le geste ne fait rien */
  const live = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  // L'envol
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const tilt = useSharedValue(0);
  const fade = useSharedValue(1);

  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const measure = (e: LayoutChangeEvent) => {
    const { width: lw, height: lh } = e.nativeEvent.layout;
    w.value = lw;
    h.value = lh;
    setSize((prev) => (prev && prev.w === lw && prev.h === lh ? prev : { w: lw, h: lh }));
  };

  const buzz = (style: Haptics.ImpactFeedbackStyle) => Haptics.impactAsync(style).catch(() => {});

  /** Le doigt lâche : le coin se recolle, ou l'autocollant s'envole */
  const release = () => {
    'worklet';
    if (!armed.value) {
      // Lâché trop tôt : le coin se recolle
      const back = { duration: motion.duration.slow, easing: easeOut };
      bx.value = withTiming(ax.value, back);
      by.value = withTiming(ay.value, back, (f) => {
        'worklet';
        if (f) peeling.value = 0;
      });
      return;
    }
    // Assez tiré : le pli passe juste le coin opposé, l'autocollant entier est
    // retourné à côté de sa place, dos visible ; puis il s'envole
    const dx = bx.value - ax.value;
    const dy = by.value - ay.value;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    // Le coin le plus loin dans le sens du geste : le pli (à mi-chemin) doit le dépasser
    let far = 0;
    for (const [cx, cy] of [[0, 0], [w.value, 0], [0, h.value], [w.value, h.value]]) {
      far = Math.max(far, (cx - ax.value) * ux + (cy - ay.value) * uy);
    }
    const reach = far * 2 + 2;
    const sweep = { duration: 320, easing: easeOut };
    bx.value = withTiming(ax.value + ux * reach, sweep);
    by.value = withTiming(ay.value + uy * reach, sweep);

    // Une feuille : elle monte, se balance d'un côté puis de l'autre, et s'efface
    const dir = Math.sign(dx) || 1;
    const half = { duration: 480, easing: sway };
    y.value = withDelay(200, withTiming(-side * 1.6, { duration: 1000, easing: Easing.out(Easing.quad) }));
    x.value = withDelay(200, withSequence(withTiming(dir * side * 0.28, half), withTiming(dir * side * 0.08, half)));
    tilt.value = withDelay(200, withSequence(withTiming(dir * 16, half), withTiming(-dir * 8, half)));
    fade.value = withDelay(
      650,
      withTiming(0, { duration: 500 }, (f) => {
        'worklet';
        if (f) runOnJS(onPeeled)();
      }),
    );
  };

  const pan = Gesture.Pan()
    .enabled(enabled && !reduced)
    .activeOffsetX([-8, 8])
    .failOffsetY([-14, 14])
    .onBegin((e) => {
      startX.value = e.x;
      startY.value = e.y;
      armed.value = 0;
      live.value = 0;
    })
    .onStart((e) => {
      // Le coin le plus proche du doigt ; tiré vers l'intérieur, il se décolle
      ax.value = startX.value < w.value / 2 ? 0 : w.value;
      ay.value = startY.value < h.value / 2 ? 0 : h.value;
      const inward = e.translationX * (w.value / 2 - ax.value) + e.translationY * (h.value / 2 - ay.value) > 0;
      if (!inward) return;
      live.value = 1;
      runOnJS(buzz)(Haptics.ImpactFeedbackStyle.Light);
    })
    .onUpdate((e) => {
      if (!live.value) return;
      bx.value = ax.value + e.translationX;
      by.value = ay.value + e.translationY;
      peeling.value = 1;
      const nowArmed = peelAmount(values) >= PEEL_OFF ? 1 : 0;
      if (nowArmed !== armed.value) {
        armed.value = nowArmed;
        runOnJS(buzz)(nowArmed ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
      }
    })
    .onEnd(() => {
      if (!live.value) return;
      release();
    });



  const flyStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${tilt.value}deg` },
      { scale: 1 - Math.min(1, -y.value / (side * 1.6)) * 0.12 },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[StyleSheet.absoluteFill, flyStyle]}>
        <PeelSurface id={id} size={size} values={values} onLayout={measure}>
          {children}
        </PeelSurface>
      </Animated.View>
    </GestureDetector>
  );
}

function NoteContent({
  note,
  isMine,
  freshAt,
  freshCount,
  myTotalPages,
}: {
  note: AnnotationWithAuthor;
  isMine: boolean;
  /** Sa place dans les nouvelles (1, 2…), 0 si elle n'en est pas */
  freshAt: number;
  freshCount: number;
  myTotalPages: number;
}) {
  const page = formatNotePage(note.position, note.edition_total_pages, myTotalPages);
  const author = isMine ? 'Moi' : note.author?.first_name || 'Participant';
  // Une note, c'est un emoji seul OU un texte : l'emoji d'une ancienne note passe en tête
  const text = note.body ? (note.emoji ? `${note.emoji} ${note.body}` : note.body) : null;

  return (
    <View style={styles.content}>
      <View style={styles.head}>
        <Text style={styles.page}>{page}</Text>
      </View>

      <View style={styles.body}>
        {!!note.quote && (
          <Text style={styles.quote} numberOfLines={text || note.audio_path ? 2 : 5}>
            « {note.quote} »
          </Text>
        )}
        {isEmojiOnly(note) ? (
          <Text style={styles.bigEmoji}>{note.emoji}</Text>
        ) : (
          !!text && (
            <Text style={styles.text} numberOfLines={note.quote ? 2 : 4}>
              {text}
            </Text>
          )
        )}
        {!!note.audio_path && <VoiceBadge seconds={note.audio_seconds ?? 0} levels={note.audio_levels} />}
      </View>

      <View style={styles.foot}>
        <Text style={styles.author} numberOfLines={1}>
          {author}
        </Text>
        {freshAt > 0 && (
          <Text style={styles.fresh}>
            {freshAt}{' '}/{' '}
            {freshCount}
          </Text>
        )}
      </View>
    </View>
  );
}

/** Le vocal, en petit : on l'écoute dans le carnet, le carré ne fait que l'annoncer */
function VoiceBadge({ seconds, levels }: { seconds: number; levels: number[] | null }) {
  const bars = Array.from({ length: WAVE_BARS }, (_, i) => {
    const source = levels?.length ? levels[Math.floor((i / WAVE_BARS) * levels.length)] : 40;
    return Math.max(3, (source / 100) * 20);
  });
  return (
    <View style={styles.voice}>
      <View style={styles.voiceIcon}>
        <MicIcon size={13} color={colors.white} strokeWidth={2.4} />
      </View>
      <View style={styles.wave}>
        {bars.map((height, index) => (
          <View key={index} style={[styles.waveBar, { height }]} />
        ))}
      </View>
      <Text style={styles.voiceTime}>{formatVoiceDuration(seconds)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    aspectRatio: 1,
  },
  content: {
    flex: 1,
    paddingTop: spacing.md + 2,
    paddingHorizontal: spacing.lg - 2,
    // Le coin corné mange le bas à droite : l'autrice et le compteur restent à gauche de lui
    paddingBottom: spacing.md + 2,
    gap: spacing.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  page: {
    marginLeft: 'auto',
    fontFamily: fonts.display,
    fontSize: 14,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  body: {
    flex: 1,
    gap: spacing.xs,
    overflow: 'hidden',
  },
  quote: {
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  text: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  bigEmoji: {
    fontSize: 52,
    lineHeight: 64,
    marginTop: spacing.xs,
  },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginRight: 34,
  },
  author: {
    flexShrink: 1,
    fontFamily: fonts.bodyExtraBold,
    fontSize: 12,
    color: inkAlpha(0.66),
  },
  fresh: {
    marginLeft: 'auto',
    fontFamily: fonts.bodyExtraBold,
    fontSize: 12,
    color: colors.accent,
    fontVariant: ['tabular-nums'],
  },

  voice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  voiceIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dark900,
  },
  wave: {
    flex: 1,
    height: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  waveBar: {
    flex: 1,
    borderRadius: 1.5,
    backgroundColor: inkAlpha(0.55),
  },
  voiceTime: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 12,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },

  blank: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  blankCount: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
});
