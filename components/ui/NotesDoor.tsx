/**
 * NotesDoor — la porte du carnet, à gauche de la rangée du bas de « Ma page ».
 *
 * Toujours au même endroit, toujours touchable (→ /notes). Elle montre ce qui
 * compte à ce moment-là, sans jamais devenir un bouton texte :
 *
 * 1. rien de nouveau : icône carnet + `23 notes` ;
 * 2. des notes plus loin : avatars **grisés + cadenas** + `3 plus loin` —
 *    écrites, pas encore lisibles ;
 * 3. juste après « Enregistrer » : les notes que je viens de dépasser
 *    **deviennent des post-it** (avatar + page), en éventail, + `🔒 1` pour
 *    celles qui restent plus loin. Trois post-it au maximum, puis un nombre.
 *
 * Une note plus loin ne donne que son autrice : ni couleur, ni emoji. Un
 * post-it, lui, est déjà lisible — il a donc la couleur de sa catégorie.
 */

import { Image } from 'expo-image';
import { LockIcon, NotebookIcon } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import type { AnnotationAhead, AnnotationWithAuthor } from '../../services/supabase/annotations';
import { ANNOTATION_CATEGORIES, isSameEdition, pageFromPosition } from '../../utils/annotations';
import { colors, creamAlpha, fonts, inkAlpha, motion, shadowAlpha, spacing } from '../../utils/constants';
import PressableScale from './PressableScale';

const DEFAULT_AVATAR = require('../../assets/images/profile_picture_default.png');

const resolveAvatar = (url: string | null | undefined) => {
  if (!url) return DEFAULT_AVATAR;
  if (url.startsWith('http://') || url.startsWith('https://')) return { uri: url };
  return DEFAULT_AVATAR;
};

interface NotesDoorProps {
  /** Les notes que je peux lire dans ce livre */
  count: number;
  /** Les notes encore verrouillées : autrice et page seulement */
  ahead: AnnotationAhead[];
  /** Les notes que ma dernière page enregistrée vient d'ouvrir, dans l'ordre du livre */
  revealed: AnnotationWithAuthor[];
  /** Le nombre de pages de MON édition, pour la page écrite sur les post-it */
  myTotalPages: number;
  /** Les post-it viennent d'apparaître : on joue leur arrivée */
  animateReveal: boolean;
  onPress: () => void;
}

/** Au-delà, les post-it se recouvrent trop : on les compte */
const MAX_POST_ITS = 3;
/** Au-delà, les avatars grisés ne se distinguent plus */
const MAX_GHOSTS = 3;

export default function NotesDoor({
  count,
  ahead,
  revealed,
  myTotalPages,
  animateReveal,
  onPress,
}: NotesDoorProps) {
  if (revealed.length > 0) {
    // Les plus proches de ma page : ce sont celles que je viens de lire
    const shown = revealed.slice(-MAX_POST_ITS);
    const offset = shown.length === 2 ? PAIR_OFFSET : FAN_OFFSET;
    const tilts = TILTS[shown.length - 1];

    return (
      <PressableScale
        style={styles.fanDoor}
        pressedScale={0.94}
        hitSlop={6}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Carnet, ${plural(revealed.length, 'nouvelle note', 'nouvelles notes')}${
          ahead.length > 0 ? `, ${ahead.length} plus loin` : ''
        }`}
      >
        <View style={[styles.fan, { width: POST_IT_WIDTH + offset * (shown.length - 1) }]}>
          {shown.map((note, index) => {
            const isLast = index === shown.length - 1;
            return (
              <PostIt
                key={note.id}
                note={note}
                left={offset * index}
                tilt={tilts[index]}
                // Côte à côte, les deux pages se lisent ; en éventail, seule la dernière
                pageLabel={isLast || shown.length < 3 ? formatPage(note, myTotalPages) : null}
                total={isLast && revealed.length > MAX_POST_ITS ? revealed.length : null}
                animate={animateReveal}
                delay={REVEAL_DELAY + index * REVEAL_STAGGER}
              />
            );
          })}
        </View>

        {ahead.length > 0 && (
          <View style={styles.stillLocked}>
            <LockIcon size={13} color={colors.textTertiary} strokeWidth={2.4} />
            <Text style={styles.stillLockedText}>{ahead.length}</Text>
          </View>
        )}
      </PressableScale>
    );
  }

  if (ahead.length > 0) {
    // Une personne qui a laissé cinq notes plus loin n'est montrée qu'une fois
    const authors = ahead
      .filter((note, index) => ahead.findIndex((n) => n.user_id === note.user_id) === index)
      .slice(0, MAX_GHOSTS);

    return (
      <PressableScale
        style={styles.pill}
        pressedScale={0.94}
        hitSlop={6}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Carnet, ${plural(ahead.length, 'note', 'notes')} plus loin`}
      >
        <View style={styles.ghosts}>
          {authors.map((note, index) => (
            <View key={note.user_id} style={[styles.ghost, index > 0 && styles.ghostStacked]}>
              <Image source={resolveAvatar(note.profile_photo_url)} style={styles.ghostPhoto} />
            </View>
          ))}
          <View style={styles.lockBadge}>
            <LockIcon size={9} color={colors.white} strokeWidth={3} />
          </View>
        </View>
        <Text style={styles.pillText} numberOfLines={1}>
          {ahead.length} <Text style={styles.pillMuted}>plus loin</Text>
        </Text>
      </PressableScale>
    );
  }

  return (
    <PressableScale
      style={[styles.pill, count === 0 && styles.pillEmpty]}
      pressedScale={0.94}
      hitSlop={6}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={count === 0 ? 'Carnet' : `Carnet, ${plural(count, 'note', 'notes')}`}
    >
      <NotebookIcon size={17} color={colors.dark900} strokeWidth={2.2} />
      {count > 0 && (
        <Text style={styles.pillText} numberOfLines={1}>
          {count} <Text style={styles.pillMuted}>{count > 1 ? 'notes' : 'note'}</Text>
        </Text>
      )}
    </PressableScale>
  );
}

/**
 * Un post-it de l'éventail. Il arrive d'un peu plus haut, se pose et s'incline,
 * pendant que la feuille « +14 » tombe : les deux gestes racontent la même page.
 */
function PostIt({
  note,
  left,
  tilt,
  pageLabel,
  total,
  animate,
  delay,
}: {
  note: AnnotationWithAuthor;
  left: number;
  tilt: number;
  pageLabel: string | null;
  total: number | null;
  animate: boolean;
  delay: number;
}) {
  const reducedMotion = useReducedMotion();
  const shouldAnimate = animate && !reducedMotion;
  const progress = useSharedValue(shouldAnimate ? 0 : 1);

  useEffect(() => {
    if (!shouldAnimate) return;
    progress.value = withDelay(
      delay,
      withTiming(1, {
        duration: motion.duration.entrance,
        easing: Easing.bezier(...motion.easing.easeOutQuart),
      }),
    );
    // Une seule arrivée par post-it, au montage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: (1 - progress.value) * -18 },
      { rotate: `${tilt * progress.value}deg` },
      { scale: 0.7 + 0.3 * progress.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.postIt,
        { left, backgroundColor: ANNOTATION_CATEGORIES[note.category].color },
        animatedStyle,
      ]}
    >
      <Image source={resolveAvatar(note.author?.profile_photo_url)} style={styles.postItAvatar} />
      {pageLabel && (
        <Text style={styles.postItPage} numberOfLines={1} maxFontSizeMultiplier={1.2}>
          {pageLabel}
        </Text>
      )}
      {total !== null && (
        <View style={styles.total}>
          <Text style={styles.totalText} maxFontSizeMultiplier={1.2}>
            {total}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

/**
 * La page dans MON édition. Le post-it est petit : « p. 158 » si on lit la même
 * édition, « ≈ 158 » sinon (le « ≈ » remplace le « p. », la place manque).
 */
function formatPage(note: AnnotationWithAuthor, myTotalPages: number) {
  const page = pageFromPosition(note.position, myTotalPages);
  return isSameEdition(note.edition_total_pages, myTotalPages) ? `p. ${page}` : `≈ ${page}`;
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n > 1 ? many : one}`;
}

// ─── Styles ────────────────────────────────────────────────────────
// Mesures de la maquette (échelle 0,865) ramenées en points.

/** La rangée du bas de « Ma page » : la porte a la hauteur des boutons ronds */
const ROW_HEIGHT = 42;
const POST_IT_WIDTH = 53;
const POST_IT_HEIGHT = 51;
/** Deux post-it se posent côte à côte, trois en éventail */
const PAIR_OFFSET = 48;
const FAN_OFFSET = 23;
/** Inclinaison de chaque post-it selon leur nombre : jamais deux pareils */
const TILTS = [[-5], [-7, 5], [-8, -2, 5]];
/** La feuille « +14 » vient de partir quand le premier post-it se pose */
const REVEAL_DELAY = 150;
const REVEAL_STAGGER = 120;
const GHOST = 23;

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: ROW_HEIGHT,
    paddingLeft: 10,
    paddingRight: 14,
    borderRadius: ROW_HEIGHT / 2,
    backgroundColor: inkAlpha(0.07),
  },
  // Carnet vide : la porte reste là, ronde comme un bouton-icône
  pillEmpty: {
    width: ROW_HEIGHT,
    paddingLeft: 0,
    paddingRight: 0,
    justifyContent: 'center',
  },
  pillText: {
    flexShrink: 1,
    fontFamily: fonts.bodyExtraBold,
    fontSize: 14,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  pillMuted: {
    fontFamily: fonts.bodyBold,
    color: colors.textTertiary,
  },

  ghosts: {
    flexDirection: 'row',
    marginRight: spacing.xs,
  },
  ghost: {
    width: GHOST,
    height: GHOST,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: creamAlpha(0.9),
    backgroundColor: inkAlpha(0.16),
    overflow: 'hidden',
  },
  ghostStacked: {
    marginLeft: -7,
  },
  // Grisé : la photo à peine visible sur l'encre, la personne se reconnaît sans plus
  ghostPhoto: {
    width: '100%',
    height: '100%',
    opacity: 0.4,
  },
  lockBadge: {
    position: 'absolute',
    right: -7,
    bottom: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dark900,
  },

  fanDoor: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: ROW_HEIGHT,
  },
  fan: {
    height: ROW_HEIGHT,
  },
  // Plus haut que la rangée : il déborde un peu vers le bas, dans la marge du cadre
  postIt: {
    position: 'absolute',
    bottom: -(POST_IT_HEIGHT - ROW_HEIGHT),
    width: POST_IT_WIDTH,
    height: POST_IT_HEIGHT,
    paddingHorizontal: 7,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: shadowAlpha(0.4),
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  postItAvatar: {
    width: 16,
    height: 16,
    borderRadius: 5,
    marginBottom: 6,
  },
  postItPage: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 11,
    color: inkAlpha(0.72),
    fontVariant: ['tabular-nums'],
  },
  total: {
    position: 'absolute',
    top: -9,
    right: -9,
    minWidth: 23,
    height: 23,
    paddingHorizontal: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dark900,
  },
  totalText: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 12,
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  // Écarté du compteur qui déborde du dernier post-it
  stillLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: spacing.md,
  },
  stillLockedText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
});
