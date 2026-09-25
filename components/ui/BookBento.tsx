/**
 * BookBento — le tableau de bord de la fiche du livre, en tuiles.
 *
 *    ┌──────────────┬──────────────┐
 *    │ FIN        ✎ │ PROGRESSION  │
 *    │ J-18         │    ╭────╮    │   ← des tuiles d'info, toutes pareilles
 *    │ mar. 13 oct. │ Club 30  Toi │   ← demi-cercle animé (ProgressGauge)
 *    ├──────────────┼──────────────┤
 *    │ PAGES        │ MEMBRES    › │
 *    │ 21 / 62      │ 5 ●●●●●      │
 *    ├──────────────┴──────────────┤
 *    │ INVITER                     │
 *    │ [5][2][8][1][8][7]      [⇪] │   ← une case par lettre (à la Opal)
 *    └─────────────────────────────┘
 *
 * Tout en % dès qu'on compare (le club, moi) ; les pages sont celles de MON
 * édition. Hiérarchie : la tranche du livre au-dessus est le seul bloc foncé
 * d'identité ; tout le reste est en papier bordé, comme les sections. Les seuls
 * boutons pleins de la fiche sont petits (le + des caps).
 */

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRightIcon, PencilIcon, ShareIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ProgressGauge from './ProgressGauge';
import {
  borderRadius,
  colors,
  fonts,
  inkGradient,
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
          <ProgressGauge clubPercent={clubPercent} myPercent={myPercent} style={styles.gaugeBleed} />
        </View>
      </View>

      <View style={styles.row}>
        {/* ── Mes pages ── */}
        <View
          style={[styles.tile, halfStyle, styles.short, styles.paper]}
          accessible
          accessibilityLabel={`Page ${currentPage} sur ${pages}`}
        >
          <Text style={styles.kicker}>Pages</Text>
          <View style={styles.pagesRow}>
            <Text style={styles.bigNumberInline}>{currentPage}</Text>
            <Text style={styles.total}>/ {pages}</Text>
          </View>
        </View>

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

      {/* ── Inviter : le code, une lettre par case, et le partage à droite ── */}
      <View
        style={[styles.tile, styles.paper]}
        accessible
        accessibilityLabel={`Code d'invitation ${inviteCode?.split('').join(' ') ?? 'indisponible'}`}
      >
        <Text style={styles.kicker}>Inviter</Text>
        <View style={styles.inviteRow}>
          <View style={styles.letters}>
            {(inviteCode ?? '------').split('').map((letter, i) => (
              <View key={i} style={styles.letterBox}>
                <Text style={styles.letter}>{letter}</Text>
              </View>
            ))}
          </View>
          {/* Même case que les lettres, pleine : c'est l'action */}
          <Pressable
            onPress={onInvite}
            style={({ pressed }) => [styles.shareBox, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Partager le code"
          >
            <LinearGradient colors={inkGradient} style={styles.shareFill}>
              <ShareIcon size={18} color={colors.white} strokeWidth={2.2} />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
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
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  letters: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
  /** Une case par lettre, comme un code à saisir */
  letterBox: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgLight,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBox: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    ...shadows.xs,
  },
  shareFill: {
    flex: 1,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontFamily: fonts.display,
    fontSize: 22,
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
