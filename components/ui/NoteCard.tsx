/**
 * NoteCard — une note du carnet, en post-it.
 *
 * `[avatar] [prénom] [catégorie] … [p. 153]`
 * `[texte]` ou `[emoji]` en grand, seul
 * `[réactions]`, sous l'autocollant
 *
 * La couleur vient de la catégorie, mais **son nom est toujours écrit** : la
 * couleur seule exclurait les personnes daltoniennes, et un club a le droit de
 * savoir ce que veut dire un post-it bleu.
 *
 * La note a la forme de l'autocollant brodé (`NoteSticker`, coin décollé en
 * bas à droite) : une note = cet autocollant, partout (DESIGN.md).
 *
 * La page affichée est celle de MON édition (« ≈ p. 153 » si l'autrice lit une
 * autre édition) : c'est la page où je retrouverai le passage.
 */

import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { EllipsisIcon, LockIcon, SmilePlusIcon, XIcon } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import type { AnnotationWithAuthor } from '../../services/supabase/annotations';
import { ANNOTATION_CATEGORIES, formatNoteDate, formatNotePage, isEmojiOnly } from '../../utils/annotations';
import { borderRadius, colors, creamAlpha, fonts, glassControlVeil, inkAlpha, spacing } from '../../utils/constants';
import { QUICK_REACTIONS } from '../../utils/emojis';
import GlassMaterial from './GlassMaterial';
import NoteSticker, { STICKER_BASE_LARGE } from './NoteSticker';
import PressableScale from './PressableScale';
import VoicePlayer from './VoicePlayer';
import { AccentUnits } from './AccentWord';

const DEFAULT_AVATAR = require('../../assets/images/profile_picture_default.png');

const resolveAvatar = (url: string | null | undefined) => {
  if (!url) return DEFAULT_AVATAR;
  if (url.startsWith('http://') || url.startsWith('https://')) return { uri: url };
  return DEFAULT_AVATAR;
};

interface NoteCardProps {
  note: AnnotationWithAuthor;
  /** Le nombre de pages de MON édition, pour afficher la page qui me parle */
  myTotalPages: number;
  /** Ma note : elle s'ouvre pour être modifiée */
  isMine: boolean;
  onPress?: () => void;
  /** Moi, pour savoir quelles réactions sont les miennes */
  myUserId?: string;
  /** Ajouter ou retirer ma réaction. Sans elle, les réactions se lisent seulement. */
  onToggleReaction?: (emoji: string) => void;
  /** Ouvrir le sélecteur complet */
  onMoreReactions?: () => void;
  /** Une grande carte (la pile des nouvelles) : texte plus grand */
  large?: boolean;
  /** Les réactions sont posées ailleurs (sous la pile) */
  hideReactions?: boolean;
  /** À plat, sans coin corné : la pile, où le doigt décolle la note */
  flat?: boolean;
}

/**
 * Plafond du côté qui règle l'arrondi et le coin décollé : une grande note garde
 * les détails d'un autocollant moyen. Le coin décollé fait 34 % de ce côté.
 */
const STICKER_BASE = 72;

export { STICKER_BASE_LARGE };

export default function NoteCard({
  note,
  myTotalPages,
  isMine,
  onPress,
  myUserId,
  onToggleReaction,
  onMoreReactions,
  large = false,
  hideReactions = false,
  flat = false,
}: NoteCardProps) {
  const category = ANNOTATION_CATEGORIES[note.category];
  const page = formatNotePage(note.position, note.edition_total_pages, myTotalPages);
  /** L'autocollant se dessine à la taille de la note, une fois mesurée */
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) =>
      prev && prev.width === width && prev.height === height ? prev : { width, height },
    );
  };

  /**
   * Une note, c'est un emoji seul OU un texte (l'emoji va alors dans le texte).
   * Une ancienne note qui a les deux : l'emoji passe en tête du texte.
   */
  const text = note.body ? (note.emoji ? `${note.emoji} ${note.body}` : note.body) : null;
  const emojiOnly = isEmojiOnly(note);
  const author = isMine ? 'Moi' : note.author?.first_name || 'Participant';

  // Un emoji seul : l'emoji en grand. Dans la liste, toute la largeur comme
  // les autres (Lea, 2026-10-02) ; dans la pile, la carte reste à sa taille
  /** Les six réactions rapides ouvertes dans la note (☺+, ou un appui long sur la note) */
  const [picking, setPicking] = useState(false);
  const canReact = !!onToggleReaction && !hideReactions && note.visibility === 'club';
  const longPress = canReact
    ? () => {
        Haptics.selectionAsync().catch(() => {});
        setPicking(true);
      }
    : undefined;

  const sticker = (
    <View
      style={[
        styles.note,
        large && styles.noteLarge,
        emojiOnly && large && styles.compactLarge,
      ]}
      onLayout={onLayout}
    >
      {size && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <NoteSticker
            id={`note-${note.id}`}
            color={category.color}
            width={size.width}
            height={size.height}
            maxBase={large ? STICKER_BASE_LARGE : STICKER_BASE}
            corner={flat ? 'none' : 'bottom-right'}
            watermark={category.label}
            watermarkInset={large ? spacing.xl : spacing.md}
          />
        </View>
      )}
      {onPress ? (
        <PressableScale
          style={[styles.body, large && styles.bodyLarge]}
          pressedScale={0.99}
          onPress={onPress}
          onLongPress={longPress}
          delayLongPress={350}
          accessibilityRole="button"
          accessibilityLabel={`Note de ${isMine ? 'moi' : note.author?.first_name}, ${formatNoteDate(note.created_at)}, ${category.label}, ${page}`}
          accessibilityHint={isMine ? 'Ouvre ma note pour la modifier' : undefined}
        >
        <View style={styles.head}>
          <Image source={resolveAvatar(note.author?.profile_photo_url)} style={styles.avatar} />
          <Text style={styles.name} numberOfLines={1}>
            {author}
          </Text>
          {/* Quand elle a été écrite : en léger, juste après le prénom */}
          <Text style={styles.date} numberOfLines={1}>
            {formatNoteDate(note.created_at)}
          </Text>
          <Text style={styles.page}><AccentUnits text={page} size={styles.page.fontSize} /></Text>
        </View>

        {!!note.quote && <Text style={[styles.quote, large && styles.quoteLarge]}>{note.quote}</Text>}

        {emojiOnly ? (
          <Text style={[styles.bigEmoji, large && styles.bigEmojiLarge]}>{note.emoji}</Text>
        ) : (
          !!text && (
            <Text style={[styles.text, large && styles.textLarge]} numberOfLines={6}>
              {text}
            </Text>
          )
        )}

        {!!note.audio_path && (
          <VoicePlayer
            path={note.audio_path}
            seconds={note.audio_seconds ?? 0}
            levels={note.audio_levels}
          />
        )}

        {note.visibility === 'private' && (
            <View style={styles.privateRow}>
              <LockIcon size={11} color={inkAlpha(0.55)} strokeWidth={2.6} />
              <Text style={styles.private}>Moi seule</Text>
            </View>
          )}
        </PressableScale>
      ) : (
        <View style={[styles.body, large && styles.bodyLarge]}>
        <View style={styles.head}>
          <Image source={resolveAvatar(note.author?.profile_photo_url)} style={styles.avatar} />
          <Text style={styles.name} numberOfLines={1}>
            {author}
          </Text>
          {/* Quand elle a été écrite : en léger, juste après le prénom */}
          <Text style={styles.date} numberOfLines={1}>
            {formatNoteDate(note.created_at)}
          </Text>
          <Text style={styles.page}><AccentUnits text={page} size={styles.page.fontSize} /></Text>
        </View>

        {!!note.quote && <Text style={[styles.quote, large && styles.quoteLarge]}>{note.quote}</Text>}

        {emojiOnly ? (
          <Text style={[styles.bigEmoji, large && styles.bigEmojiLarge]}>{note.emoji}</Text>
        ) : (
          !!text && (
            <Text style={[styles.text, large && styles.textLarge]} numberOfLines={6}>
              {text}
            </Text>
          )
        )}

        {!!note.audio_path && (
          <VoicePlayer
            path={note.audio_path}
            seconds={note.audio_seconds ?? 0}
            levels={note.audio_levels}
          />
        )}

        {note.visibility === 'private' && (
            <View style={styles.privateRow}>
              <LockIcon size={11} color={inkAlpha(0.55)} strokeWidth={2.6} />
              <Text style={styles.private}>Moi seule</Text>
            </View>
          )}
        </View>
      )}

      {/* Les réactions, DANS la note (Lea, 2026-10-02) : en bas, à gauche du coin
          corné ; hors du toucher de la note, chacune a le sien */}
      {!hideReactions && note.visibility === 'club' && (
        <NoteReactions
          inside
          picking={picking}
          onPickingChange={setPicking}
          note={note}
          myUserId={myUserId}
          onToggle={onToggleReaction}
          onMore={onMoreReactions}
        />
      )}
    </View>
  );

  return <View style={styles.wrap}>{sticker}</View>;
}

// ─── Une note encore verrouillée ───────────────────────────────────

/** Le côté d'une note verrouillée : un petit carré, elles se rangent en ligne */
export const LOCKED_NOTE_SIZE = 64;

/**
 * Une note plus loin que ma page : un petit autocollant carré de papier nu
 * (DESIGN.md › Autocollants brodés). On voit qui l'a écrite et à quelle page,
 * jamais son contenu ni son thème ; un cadenas dans le coin. Petit exprès
 * (Lea, 2026-10-02 : une carte par note prenait trop de place) : elles se
 * rangent côte à côte, en une ligne.
 */
export function LockedNoteCard({
  name,
  photo,
  page,
}: {
  name: string;
  photo: string | null;
  /** La page dans MON édition */
  page: number;
}) {
  return (
    <View style={styles.locked} accessible accessibilityLabel={`Note de ${name}, page ${page}, verrouillée`}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <NoteSticker id={`locked-${name}-${page}`} color={null} size={LOCKED_NOTE_SIZE} corner="bottom-right" />
      </View>
      <View style={styles.lockedTop}>
        <Image source={resolveAvatar(photo)} style={[styles.avatar, styles.lockedFaded]} />
        <LockIcon size={12} color={inkAlpha(0.45)} strokeWidth={2.4} />
      </View>
      <Text style={styles.lockedPage}>{page}</Text>
    </View>
  );
}

// ─── Les réactions d'une note ──────────────────────────────────────

/**
 * Une pastille de verre par emoji avec son compte (comme nos boutons ronds,
 * Lea, 2026-10-02), le compte à l'encre.
 *
 * - `quick` (la pile des nouvelles) : les six emojis rapides sont toujours là,
 *   avec leur compte s'il y en a un, puis « … » pour le reste. Un toucher suffit.
 * - Sinon (la liste) : seulement les réactions posées, et `smile-plus` ouvre
 *   les six rapides à la place de la rangée.
 * - Sans `onToggle`, elles se lisent seulement (consultation).
 * - `inside` : posées dans la note (la liste), sur le papier.
 */
export function NoteReactions({
  note,
  myUserId,
  onToggle,
  onMore,
  quick = false,
  inside = false,
  picking: pickingProp,
  onPickingChange,
}: {
  note: AnnotationWithAuthor;
  myUserId?: string;
  onToggle?: (emoji: string) => void;
  onMore?: () => void;
  quick?: boolean;
  /** Posées sur la note (la liste du carnet) : sur le papier, à gauche du coin corné */
  inside?: boolean;
  /** Les six rapides ouvertes, piloté par la note (son appui long) */
  picking?: boolean;
  onPickingChange?: (picking: boolean) => void;
}) {
  const [pickingState, setPickingState] = useState(false);
  const picking = pickingProp ?? pickingState;
  const setPicking = (next: boolean | ((p: boolean) => boolean)) => {
    const value = typeof next === 'function' ? next(picking) : next;
    if (onPickingChange) onPickingChange(value);
    else setPickingState(value);
  };
  const canReact = !!onToggle;

  // Une pastille par emoji, avec son compte ; les plus partagées d'abord
  const reactions = useMemo(() => {
    const groups = new Map<string, { emoji: string; count: number; mine: boolean }>();
    for (const reaction of note.reactions) {
      const group = groups.get(reaction.emoji) ?? { emoji: reaction.emoji, count: 0, mine: false };
      group.count += 1;
      if (reaction.user_id === myUserId) group.mine = true;
      groups.set(reaction.emoji, group);
    }
    return [...groups.values()].sort((a, b) => b.count - a.count);
  }, [note.reactions, myUserId]);

  const react = (emoji: string) => {
    setPicking(false);
    onToggle?.(emoji);
  };

  // Les six rapides d'abord, dans leur ordre, puis les autres emojis posés
  const shown =
    quick || picking
      ? [
          ...QUICK_REACTIONS.map(
            (emoji) => reactions.find((r) => r.emoji === emoji) ?? { emoji, count: 0, mine: false },
          ),
          ...(quick ? reactions.filter((r) => !QUICK_REACTIONS.includes(r.emoji)) : []),
        ]
      : reactions;

  if (!canReact && reactions.length === 0) return null;
  /** Des gélules : l'arrondi du verre suit la hauteur de la pastille */
  const pillRadius = (quick ? 44 : inside ? 28 : 30) / 2;

  return (
    <View style={[styles.footer, quick && styles.footerQuick, inside && styles.footerInside]}>
      {shown.map(({ emoji, count, mine }) =>
        canReact ? (
          <PressableScale
            key={emoji}
            style={[styles.reaction, quick && styles.reactionQuick, inside && styles.reactionInside]}
            pressedScale={0.85}
            hitSlop={4}
            onPress={() => react(emoji)}
            accessibilityRole="button"
            accessibilityLabel={count ? `${emoji}, ${count}` : emoji}
            accessibilityState={{ selected: mine }}
            accessibilityHint={mine ? 'Retire ma réaction' : 'Ajoute ma réaction'}
          >
            <PillGlass radius={pillRadius} />
            <Text style={[styles.reactionEmoji, quick && styles.reactionEmojiQuick]}>{emoji}</Text>
            {count > 0 && <Text style={styles.reactionCount}>{count}</Text>}
          </PressableScale>
        ) : (
          <View key={emoji} style={[styles.reaction, inside && styles.reactionInside]}>
            <PillGlass radius={pillRadius} />
            <Text style={styles.reactionEmoji}>{emoji}</Text>
            <Text style={styles.reactionCount}>{count}</Text>
          </View>
        ),
      )}
      {canReact && (quick || picking) && (
        <PressableScale
          style={[styles.reaction, quick && styles.reactionQuick, inside && styles.reactionInside]}
          pressedScale={0.85}
          hitSlop={4}
          onPress={() => {
            setPicking(false);
            onMore?.();
          }}
          accessibilityRole="button"
          accessibilityLabel="Tous les emojis"
        >
          <PillGlass radius={pillRadius} />
          <EllipsisIcon size={16} color={colors.dark900} strokeWidth={2.4} />
        </PressableScale>
      )}
      {canReact && !quick && (
        <PressableScale
          style={[styles.reaction, inside && styles.reactionInside]}
          pressedScale={0.85}
          hitSlop={4}
          onPress={() => setPicking((p) => !p)}
          accessibilityRole="button"
          accessibilityLabel={picking ? 'Fermer' : 'Réagir'}
        >
          <PillGlass radius={pillRadius} />
          {picking ? (
            <XIcon size={15} color={colors.dark900} strokeWidth={2.4} />
          ) : (
            <SmilePlusIcon size={14} color={colors.dark900} strokeWidth={2.2} />
          )}
        </PressableScale>
      )}
    </View>
  );
}

const AVATAR = 22;

/** Le verre des boutons ronds (`GlassButton`), en fond d'une pastille de réaction */
function PillGlass({ radius }: { radius: number }) {
  return <GlassMaterial radius={radius} veil={glassControlVeil} rim />;
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  // En bas, la place du coin corné (34 % du côté plafonné) : le texte n'y passe pas
  note: {
    padding: spacing.md,
    paddingBottom: spacing.md + spacing.sm,
    gap: spacing.sm,
  },
  noteLarge: {
    padding: spacing.xl,
    paddingBottom: spacing.xl + spacing.md,
    gap: spacing.md,
  },
  // Un emoji seul, dans la pile : une petite carte, au centre
  compactLarge: {
    alignSelf: 'center',
    minWidth: 220,
  },
  // Le contenu de la note, qui se touche ; les réactions sont à côté, pas dedans
  body: {
    gap: spacing.sm,
  },
  bodyLarge: {
    gap: spacing.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: creamAlpha(0.6),
  },
  name: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  date: {
    flexShrink: 1,
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: inkAlpha(0.5),
    fontVariant: ['tabular-nums'],
  },
  locked: {
    width: LOCKED_NOTE_SIZE,
    height: LOCKED_NOTE_SIZE,
    padding: spacing.sm,
    justifyContent: 'space-between',
  },
  lockedTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  lockedFaded: {
    opacity: 0.6,
  },
  lockedPage: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 12,
    color: inkAlpha(0.55),
    fontVariant: ['tabular-nums'],
  },
  page: {
    marginLeft: 'auto',
    paddingLeft: spacing.sm,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: inkAlpha(0.66),
    fontVariant: ['tabular-nums'],
  },

  quote: {
    fontFamily: fonts.display,
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 19,
    color: colors.textPrimary,
    paddingLeft: spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: inkAlpha(0.35),
  },
  quoteLarge: {
    fontSize: 16,
    lineHeight: 22,
  },

  bigEmoji: {
    fontSize: 40,
    lineHeight: 48,
  },
  bigEmojiLarge: {
    fontSize: 64,
    lineHeight: 76,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  textLarge: {
    fontSize: 18,
    lineHeight: 25,
  },

  // Une note privée : le cadenas dit qu'elle ne se montre à personne d'autre
  privateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  private: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: inkAlpha(0.55),
  },

  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
  },
  // Dans la note : à gauche du coin corné (34 % de STICKER_BASE), jamais dessous
  footerInside: {
    marginRight: Math.round(STICKER_BASE * 0.34),
  },
  footerQuick: {
    justifyContent: 'center',
    gap: spacing.sm,
  },
  // 30 pt de haut : assez pour viser juste, hitSlop compris
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 36,
    minHeight: 30,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    // Du verre, comme nos boutons ronds ; l'ombre douce de GlassButton
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  // Sous la pile : de vraies touches, 44 pt
  reactionQuick: {
    minWidth: 44,
    minHeight: 44,
  },
  // Sur le papier de la note : une pastille crème, plus basse
  reactionInside: {
    minHeight: 28,
  },

  reactionEmoji: {
    fontSize: 15,
  },
  reactionEmojiQuick: {
    fontSize: 20,
  },
  reactionCount: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 13,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
});
