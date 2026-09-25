/**
 * BookBento — le tableau de bord de la fiche du livre, en tuiles.
 *
 *    ┌──────────────┬──────────────┐
 *    │ FIN        ✎ │ PROGRESSION  │
 *    │ J-18         │ ▮▮▮▮╷╷╷╷╷╷╷╷ │   ← des tuiles d'info, toutes pareilles
 *    │ mar. 13 oct. │ Toi 34  Club │
 *    ├──────────────┼──────────────┤
 *    │ PAGES      › │ MEMBRES    › │
 *    │ 21 / 62      │ 5 ●●●●●      │
 *    ├──────────────┼──────────────┤
 *    │ CARNET     › │ INVITER    ⇪ │   ← les notes en pile d'autocollants ;
 *    │              │              │     le code, une lettre par case
 *    │ 8 ◆◆◆◆◆◆◆◆   │ [5][2][8][1][8][7] │
 *    └──────────────┴──────────────┘
 *
 * Tout en % dès qu'on compare (le club, moi) ; les pages sont celles de MON
 * édition. Hiérarchie : la tranche du livre au-dessus est le seul bloc foncé
 * d'identité ; tout le reste est en papier bordé, comme les sections. Les seuls
 * boutons pleins de la fiche sont petits (le partage du code).
 */

import { Image } from 'expo-image';
import { ChevronRightIcon, PencilIcon, ShareIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import NoteSticker from './NoteSticker';
import ProgressGauge from './ProgressGauge';
import {
  borderRadius,
  colors,
  fonts,
  shadows,
  spacing,
} from '../../utils/constants';

const DEFAULT_AVATAR = require('../../assets/images/profile_picture_default.png');

interface BookBentoProps {
  /** Jours avant la fin, `null` sans date */
  remaining: number | null;
  /** « Mar. 13 oct. », ou `null` sans date */
  endLabel: string | null;
  onEditEnd: () => void;
  /** Médiane du club, 0 à 100 */
  clubPercent: number;
  myPercent: number;
  /** Ma page, et le total de mon édition */
  currentPage: number;
  pages: number;
  members: { id: string; photoUrl: string | null }[];
  onOpenMembers: () => void;
  /** Ouvre mon journal de lecture */
  onOpenJournal: () => void;
  /** Le carnet du livre : combien de notes, dont les miennes, et où elles sont */
  notes: {
    total: number;
    mine: number;
    /** Chaque note à sa place dans le livre (0 → 1) ; couleur `null` si verrouillée */
    stickers: { id: string; position: number; color: string | null }[];
  };
  onOpenNotes: () => void;
  inviteCode: string | null;
  onInvite: () => void;
}

export default function BookBento({
  remaining,
  endLabel,
  onEditEnd,
  clubPercent,
  myPercent,
  currentPage,
  pages,
  members,
  onOpenMembers,
  onOpenJournal,
  notes,
  onOpenNotes,
  inviteCode,
  onInvite,
}: BookBentoProps) {
  // Largeur d'une demi-tuile, mesurée : avec `flex: 1`, la tuile dont le
  // contenu est le plus large (l'anneau du club) prenait plus que sa moitié
  const [half, setHalf] = useState<number | undefined>(undefined);
  const halfStyle = half === undefined ? null : { flex: 0, width: half };


  const countdown =
    remaining === null ? '—' : remaining >= 0 ? `J-${remaining}` : 'Prolong.';

  return (
    <View
      style={styles.grid}
      onLayout={(e) => setHalf((e.nativeEvent.layout.width - spacing.md) / 2)}
    >
      <View style={styles.row}>
        {/* ── La fin ── */}
        <Pressable
          onPress={onEditEnd}
          style={({ pressed }) => [styles.tile, halfStyle, styles.tall, styles.paper, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Fin, ${endLabel ?? 'pas de date'}, ${countdown}. Modifier`}
        >
          <View style={styles.tileTop}>
            <Text style={styles.kicker}>Fin</Text>
            <PencilIcon size={15} color={colors.textTertiary} strokeWidth={2.2} />
          </View>
          <Text style={styles.countdown} numberOfLines={1} adjustsFontSizeToFit>
            {countdown}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {endLabel ?? 'Pas de date'}
          </Text>
        </Pressable>

        {/* ── Le club ── */}
        <View style={[styles.tile, halfStyle, styles.tall, styles.paper]}>
          <Text style={styles.kicker}>Progression</Text>
          <ProgressGauge
            clubPercent={clubPercent}
            myPercent={myPercent}
            legendInset={spacing.lg}
            style={styles.gaugeBleed}
          />
        </View>
      </View>

      <View style={styles.row}>
        {/* ── Mes pages ── */}
        <Pressable
          onPress={onOpenJournal}
          style={({ pressed }) => [
            styles.tile,
            halfStyle,
            styles.short,
            styles.paper,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Page ${currentPage} sur ${pages}, voir mon journal`}
        >
          <View style={styles.tileTop}>
            <Text style={styles.kicker}>Pages</Text>
            <ChevronRightIcon size={15} color={colors.textTertiary} strokeWidth={2.2} />
          </View>
          <View style={styles.pagesRow}>
            <Text style={styles.bigNumberInline}>{currentPage}</Text>
            <Text style={styles.total}>/ {pages}</Text>
          </View>
        </Pressable>

        {/* ── Les membres ── */}
        <Pressable
          onPress={onOpenMembers}
          style={({ pressed }) => [
            styles.tile,
            halfStyle,
            styles.short,
            styles.paper,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${members.length} membres, voir le classement`}
        >
          <View style={styles.tileTop}>
            <Text style={styles.kicker}>Membres</Text>
            <ChevronRightIcon size={15} color={colors.textTertiary} strokeWidth={2.2} />
          </View>
          <View style={styles.membersRow}>
            <Text style={styles.bigNumberInline}>{members.length}</Text>
            <View style={styles.avatars}>
              {members.slice(0, MAX_AVATARS).map((m, i) => (
                <Image
                  key={m.id}
                  source={m.photoUrl?.startsWith('http') ? { uri: m.photoUrl } : DEFAULT_AVATAR}
                  style={[styles.avatar, i > 0 && styles.avatarOverlap]}
                  contentFit="cover"
                />
              ))}
            </View>
          </View>
        </Pressable>
      </View>

      <View style={styles.row}>
        {/* ── Le carnet : combien le livre est annoté, et où ── */}
        <Pressable
          onPress={onOpenNotes}
          style={({ pressed }) => [
            styles.tile,
            halfStyle,
            styles.short,
            styles.paper,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Carnet : ${notes.total} notes. Ouvrir le carnet`}
        >
          <View style={styles.tileTop}>
            <Text style={styles.kicker}>Carnet</Text>
            <ChevronRightIcon size={15} color={colors.textTertiary} strokeWidth={2.2} />
          </View>
          <View style={styles.notesHead}>
            <Text style={styles.bigNumberInline}>{notes.total}</Text>
            <StickerStrip stickers={notes.stickers} />
          </View>
        </Pressable>

        {/* ── Inviter : le code, une lettre par case ; toucher la tuile partage ── */}
        <Pressable
          onPress={onInvite}
          style={({ pressed }) => [
            styles.tile,
            halfStyle,
            styles.short,
            styles.paper,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Inviter, code ${inviteCode?.split('').join(' ') ?? 'indisponible'}. Partager`}
        >
          <View style={styles.tileTop}>
            <Text style={styles.kicker}>Inviter</Text>
            <ShareIcon size={15} color={colors.textTertiary} strokeWidth={2.2} />
          </View>
          <View style={styles.letters}>
            {(inviteCode ?? '------').split('').map((letter, i) => (
              <View key={i} style={styles.letterBox}>
                <Text style={styles.letter}>{letter}</Text>
              </View>
            ))}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const STICKER = 24;
/** D'un autocollant au suivant : ils se chevauchent largement, en pile */
const STICKER_STEP = 10;
const LETTER_GAP = 3;

/**
 * Les notes en autocollants, rangées dans l'ordre du livre : une pile qui se
 * chevauche largement, inclinée à peine, un coup à gauche, un coup à droite. Ce
 * qui ne tient pas se résume en « +3 ».
 */
function StickerStrip({ stickers }: { stickers: BookBentoProps['notes']['stickers'] }) {
  const [width, setWidth] = useState(0);
  const sorted = [...stickers].sort((a, b) => a.position - b.position);
  // Combien tiennent, la place du « +n » gardée s'il en faut un
  const fit = Math.max(1, Math.floor((width - STICKER) / STICKER_STEP) + 1);
  const overflow = sorted.length > fit;
  const shown = overflow ? sorted.slice(0, Math.max(1, fit - 1)) : sorted;
  return (
    <View style={styles.strip} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 &&
        shown.map((sticker, i) => (
          <View
            key={sticker.id}
            style={[
              styles.sticker,
              { left: i * STICKER_STEP, transform: [{ rotate: i % 2 ? '5deg' : '-4deg' }] },
            ]}
          >
            <NoteSticker id={sticker.id} color={sticker.color} size={STICKER} />
          </View>
        ))}
      {width > 0 && overflow && (
        <Text style={[styles.more, { left: shown.length * STICKER_STEP + 4 }]}>
          +{sorted.length - shown.length}
        </Text>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const AVATAR = 22;
/** Au-delà, le nombre suffit */
const MAX_AVATARS = 5;

const styles = StyleSheet.create({
  grid: {
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  tile: {
    flex: 1,
    borderRadius: borderRadius.lg,
    ...shadows.xs,
  },
  tall: {
    height: 136,
  },
  /** Les deux bouts de la jauge touchent les côtés de la tuile, au-delà de sa marge */
  gaugeBleed: {
    marginHorizontal: -spacing.lg,
  },
  short: {
    height: 108,
  },
  /** Tuile papier : comme les sections de la fiche */
  paper: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  /** Les six lettres sur une rangée */
  letters: {
    flexDirection: 'row',
    gap: LETTER_GAP,
    marginTop: 'auto',
  },
  /** Une case par lettre, comme un code à saisir */
  letterBox: {
    flex: 1,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bgLight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.textPrimary,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  tileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  kicker: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textTertiary,
  },
  countdown: {
    marginTop: 'auto',
    fontFamily: fonts.display,
    fontSize: 38,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },


  pagesRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  total: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  /** Le nombre de notes, et leur pile d'autocollants à côté, en bas de la tuile */
  notesHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: 'auto',
  },
  /** Posée en bas de la tuile, comme les cases du code à côté */
  strip: {
    flex: 1,
    height: 28,
  },
  sticker: {
    position: 'absolute',
    top: 2,
    ...shadows.xs,
  },
  more: {
    position: 'absolute',
    top: 5,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.textTertiary,
  },
  membersRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bigNumberInline: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  sub: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.textTertiary,
  },

  avatars: {
    flexDirection: 'row',
    height: AVATAR,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.white,
    backgroundColor: colors.bgSecondary,
  },
  avatarOverlap: {
    marginLeft: -7,
  },
});
