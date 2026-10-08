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
 * d'ouvrir), sinon la plus récente. Sans note lisible mais des notes plus loin,
 * un autocollant de papier nu : un cadenas et leur nombre.
 *
 * Aucune note du tout : un bloc d'autocollants neuf (`FirstNote`). Celui du
 * dessus est vierge, lignes vides, curseur qui clignote à ma page, et son coin
 * se soulève de temps en temps ; le toucher ouvre directement la feuille
 * d'écriture, pas le carnet vide.
 */

import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { LockIcon, MicIcon, PenLineIcon } from 'lucide-react-native';
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
  withRepeat,
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
import { colors, fonts, inkAlpha, inkGradient, motion, postIt, spacing } from '../../utils/constants';
import NoteSticker, { STICKER_BASE_LARGE } from './NoteSticker';
import PeelSurface, { peelAmount, pullSpeed } from './PeelSurface';
import PressableScale from './PressableScale';
import { useWriteNote } from './WriteNoteButton';
import { AccentUnit, AccentUnits } from './AccentWord';

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
  /**
   * Seul dans le livre, pas de classement à côté : le carré prend toute la
   * largeur et garde la hauteur qu'il aurait eue à côté de lui.
   */
  wide?: boolean;
  onPress: () => void;
}

/** La taille mesurée du carré (ou de la bande, en large) */
type TileSize = { w: number; h: number };

/** Les barres de l'onde du vocal, dans le carré */
const WAVE_BARS = 18;
/** Décollé au tiers : lâcher le fait s'envoler (comme la pile) */
const PEEL_OFF = 0.3;
/** Ou un coup de doigt vif, une fois le coin un peu soulevé */
const FLICK_MIN = 0.08;
const FLICK_VELOCITY = 500;

const easeOut = Easing.bezier(...motion.easing.easeOutQuart);

export default function NoteTile({
  notes,
  myUserId,
  freshCount,
  aheadCount,
  myTotalPages,
  wide = false,
  onPress,
}: NoteTileProps) {
  const [size, setSize] = useState<TileSize | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    // En large : la hauteur d'un des deux carrés du bento
    const height = wide ? (width - spacing.md) / 2 : width;
    setSize((prev) => (prev && prev.w === width && prev.h === height ? prev : { w: width, h: height }));
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
  /** Rien du tout, ni lisible ni plus loin : on invite à la première note */
  const untouched = !note && aheadCount === 0;
  const write = useWriteNote();

  const label = note
    ? `Carnet de notes. Note de ${isMine(note) ? 'moi' : note.author?.first_name ?? 'quelqu’un'}${
        freshPlace(at) ? `, ${freshPlace(at)} sur ${freshCount} nouvelles` : ''
      }`
    : aheadCount > 0
      ? `Carnet de notes, ${aheadCount} ${aheadCount > 1 ? 'notes' : 'note'} plus loin`
      : `Écrire la première note, page ${Math.max(1, write.page)}`;

  const face = (n: AnnotationWithAuthor, i: number, at: TileSize) => (
    <Face size={at} note={n}>
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
    <>
    <PressableScale
      style={wide ? (size ? { height: size.h } : styles.tileWide) : styles.tile}
      onLayout={onLayout}
      onPress={untouched ? write.open : onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={untouched ? 'Ouvre la feuille d’écriture' : 'Ouvre le carnet de notes'}
      // VoiceOver n'arrache pas : une action « note précédente » à la place du geste
      accessibilityActions={next ? [{ name: 'previous', label: 'Note précédente' }] : undefined}
      onAccessibilityAction={(e) => e.nativeEvent.actionName === 'previous' && peelOff()}
    >
      {size &&
        (note ? (
          <>
            {/* La clé suit le tour : celui du dessous devient celui du dessus sans être redessiné */}
            {next && (
              <View key={turn + 1} style={StyleSheet.absoluteFill} pointerEvents="none">
                {face(next, nextAt, size)}
              </View>
            )}
            <PeelCard key={turn} side={size.h} id={`tile-${turn}`} enabled={!!next} onPeeled={peelOff}>
              {face(note, at, size)}
            </PeelCard>
          </>
        ) : untouched ? (
          <FirstNote tile={size} page={Math.max(1, write.page)} />
        ) : (
          <Face size={size} note={null}>
            <View style={styles.blank}>
              <LockIcon size={22} color={colors.textTertiary} strokeWidth={2.2} />
              <Text style={styles.blankCount}>{aheadCount}</Text>
            </View>
          </Face>
        ))}
    </PressableScale>
    {write.sheet}
    </>
  );
}

// ─── Aucune note : le bloc d'autocollants neuf ──────────────────────

/** Les lignes vides de l'autocollant vierge, au pas du texte d'une note */
const BLANK_LINES = 3;
/** Le coin au repos, déjà un peu soulevé, et quand il se soulève */
const LIFT_REST = 14;
const LIFT_UP = 32;

/**
 * Un bloc neuf : deux autocollants de couleur dépassent dessous, de travers ;
 * celui du dessus est vierge. Pas de mots : la page où j'en suis, des lignes à
 * remplir, un curseur, le ✎. Son coin respire (se soulève puis se recolle)
 * pour dire « prends-moi ». Mouvement réduit : tout reste immobile.
 */
function FirstNote({ tile, page }: { tile: TileSize; page: number }) {
  const reduced = useReducedMotion();
  const w = useSharedValue(tile.w);
  const h = useSharedValue(tile.h);
  const ax = useSharedValue(tile.w);
  const ay = useSharedValue(tile.h);
  const bx = useSharedValue(tile.w - LIFT_REST);
  const by = useSharedValue(tile.h - LIFT_REST * 0.8);
  const peeling = useSharedValue(1);
  const values = { w, h, ax, ay, bx, by, peeling };
  const caret = useSharedValue(1);

  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const measure = (e: LayoutChangeEvent) => {
    const { width: lw, height: lh } = e.nativeEvent.layout;
    w.value = lw;
    h.value = lh;
    ax.value = lw;
    ay.value = lh;
    setSize((prev) => (prev && prev.w === lw && prev.h === lh ? prev : { w: lw, h: lh }));
  };

  useEffect(() => {
    if (reduced) return;
    const breathe = (rest: number, up: number) =>
      withRepeat(
        withSequence(
          withDelay(2600, withTiming(up, { duration: 700, easing: easeOut })),
          withDelay(250, withTiming(rest, { duration: 650, easing: Easing.inOut(Easing.quad) })),
        ),
        -1,
      );
    bx.value = breathe(tile.w - LIFT_REST, tile.w - LIFT_UP);
    by.value = breathe(tile.h - LIFT_REST * 0.8, tile.h - LIFT_UP * 0.8);
    caret.value = withRepeat(
      withSequence(withDelay(450, withTiming(0, { duration: 80 })), withDelay(450, withTiming(1, { duration: 80 }))),
      -1,
    );
  }, [reduced, tile.w, tile.h, bx, by, caret]);

  const caretStyle = useAnimatedStyle(() => ({ opacity: caret.value }));
  // En large, la même inclinaison ferait dépasser les bouts : on la réduit d'autant
  const lean = tile.h / tile.w;
  const box = { width: tile.w, height: tile.h };

  return (
    <View style={box}>
      {/* Le bloc : deux autocollants de couleur dessous, qui dépassent de travers */}
      {(
        [
          [postIt.sauge, -9, -6],
          [postIt.jaune, 6, 5],
        ] as const
      ).map(([color, angle, shift]) => (
        <View
          key={color}
          style={[
            StyleSheet.absoluteFill,
            { transform: [{ translateX: shift }, { rotate: `${angle * lean}deg` }, { scale: 0.97 }] },
          ]}
          pointerEvents="none"
        >
          <NoteSticker id={`note-tile-pad-${color}`} color={color} width={tile.w} height={tile.h} maxBase={STICKER_BASE_LARGE} corner="none" />
        </View>
      ))}

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <PeelSurface id="tile-first" size={size} values={values} onLayout={measure}>
          <View style={box}>
            <View style={StyleSheet.absoluteFill}>
              <NoteSticker id="note-tile-first" color={postIt.rose} width={tile.w} height={tile.h} maxBase={STICKER_BASE_LARGE} corner="none" />
            </View>
            <View style={styles.content}>
              <View style={styles.head}>
                <Text style={styles.page} maxFontSizeMultiplier={1.3}><AccentUnit size={styles.page.fontSize}>p.</AccentUnit> {page}</Text>
              </View>
              <View style={styles.lines}>
                {Array.from({ length: BLANK_LINES }, (_, i) => (
                  <View key={i} style={[styles.line, i === BLANK_LINES - 1 && styles.lineShort]}>
                    {i === 0 && <Animated.View style={[styles.caret, caretStyle]} />}
                  </View>
                ))}
              </View>
              <View style={styles.foot}>
                <LinearGradient colors={inkGradient} style={styles.pen}>
                  <PenLineIcon size={14} color={colors.white} strokeWidth={2.4} />
                </LinearGradient>
              </View>
            </View>
          </View>
        </PeelSurface>
      </View>
    </View>
  );
}

/** Un autocollant du carré : le papier brodé de sa catégorie, la note par-dessus */
function Face({
  size,
  note,
  children,
}: {
  size: TileSize;
  note: AnnotationWithAuthor | null;
  children: React.ReactNode;
}) {
  return (
    <View style={{ width: size.w, height: size.h }}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <NoteSticker
          id={`note-tile-${note?.id ?? 'blank'}`}
          color={note ? ANNOTATION_CATEGORIES[note.category].color : null}
          width={size.w}
          height={size.h}
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
 * Tirer dans n'importe quel sens décolle le coin qui suit le doigt (même rendu
 * que la pile). Lâché avant le tiers, il se recolle ; au-delà (ou d'un coup de
 * doigt vif), le pli traverse tout, et
 * l'autocollant s'envole comme un ballon qu'on lâche : il monte de plus en
 * plus vite, sans tanguer, et s'efface. Le toucher simple, lui, ouvre toujours le carnet.
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
  /** Passé le tiers : lâcher l'arrache (une vibration l'annonce, une autre si on revient) */
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

  const [size, setSize] = useState<TileSize | null>(null);
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
    const sweep = { duration: 260, easing: easeOut };
    bx.value = withTiming(ax.value + ux * reach, sweep);
    by.value = withTiming(ay.value + uy * reach, sweep);

    // Un ballon qu'on lâche : il part doucement puis prend de la vitesse vers le
    // haut, sans tanguer. Il glisse un peu vers le centre (retourné du côté où
    // on a tiré, il ne sort pas par le bord de l'écran) et se redresse presque
    const dir = -(Math.sign(dx) || 1);
    const rise = { duration: 850, easing: Easing.in(Easing.quad) };
    const drift = { duration: 850, easing: Easing.out(Easing.quad) };
    y.value = withDelay(120, withTiming(-side * 2.4, rise));
    x.value = withDelay(120, withTiming(dir * side * 0.18, drift));
    tilt.value = withDelay(120, withTiming(dir * 3, drift));
    fade.value = withDelay(
      520,
      withTiming(0, { duration: 450, easing: Easing.in(Easing.quad) }, (f) => {
        'worklet';
        if (f) runOnJS(onPeeled)();
      }),
    );
  };

  const pan = Gesture.Pan()
    .enabled(enabled && !reduced)
    .minDistance(4)
    .onBegin((e) => {
      startX.value = e.x;
      startY.value = e.y;
      armed.value = 0;
      live.value = 0;
    })
    .onStart((e) => {
      // Le coin qui suit le doigt, où qu'on ait posé le doigt : tirer vers la
      // droite soulève un coin gauche, vers le bas un coin du haut. Un geste
      // presque droit garde le coin du côté où le doigt s'est posé
      const tx = e.translationX;
      const ty = e.translationY;
      ax.value = Math.abs(tx) > Math.abs(ty) * 0.4 ? (tx > 0 ? 0 : w.value) : startX.value < w.value / 2 ? 0 : w.value;
      ay.value = Math.abs(ty) > Math.abs(tx) * 0.4 ? (ty > 0 ? 0 : h.value) : startY.value < h.value / 2 ? 0 : h.value;
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
    .onEnd((e) => {
      if (!live.value) return;
      if (!armed.value && peelAmount(values) >= FLICK_MIN && pullSpeed(e, values) > FLICK_VELOCITY) armed.value = 1;
      release();
    });



  const flyStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${tilt.value}deg` },
      { scale: 1 - Math.min(1, -y.value / (side * 2.4)) * 0.2 },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[StyleSheet.absoluteFill, flyStyle]}>
        {/* Le carré est petit et dans un coin : tiré à travers l'écran, son rabat va loin */}
        <PeelSurface id={id} size={size} values={values} reach={2.5} onLayout={measure}>
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
        <Text style={styles.page} maxFontSizeMultiplier={1.3}><AccentUnits text={page} size={styles.page.fontSize} /></Text>
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
  // Avant la mesure : à peu près la hauteur d'un carré du bento
  tileWide: {
    aspectRatio: 2,
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

  lines: {
    flex: 1,
    justifyContent: 'center',
    gap: 19,
  },
  line: {
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: inkAlpha(0.16),
    justifyContent: 'flex-end',
  },
  lineShort: {
    width: '62%',
  },
  caret: {
    position: 'absolute',
    left: 1,
    bottom: 3,
    width: 2,
    height: 17,
    borderRadius: 1,
    backgroundColor: colors.textPrimary,
  },
  pen: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
