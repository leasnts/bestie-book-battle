/**
 * BookBento — le tableau de bord de la fiche du livre, en tuiles.
 *
 *    ┌──────────────┬──────────────┐
 *    │ FIN        ✎ │ PROGRESSION  │
 *    │ J-18         │   ( 30 % )   │   ← la fin en lie de vin : c'est l'enjeu
 *    │ mar. 13 oct. │   toi 34 %   │
 *    ├──────────────┼──────────────┤
 *    │ PAGES  62    │ MEMBRES ●●●● │
 *    ├──────────────┴──────────────┤
 *    │ INVITER   5 2 8 1 8 7     ⇪ │   ← une action : en encre
 *    └─────────────────────────────┘
 *
 * Tout en % dès qu'on compare (le club, moi) ; les pages sont celles de MON
 * édition. Jamais d'aplat : les tuiles pleines sont en dégradé, les autres en
 * papier bordé, comme les sections de la fiche.
 */

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpenIcon, PencilIcon, ShareIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import {
  accentGradient,
  borderRadius,
  colors,
  fonts,
  inkAlpha,
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
  /** Pages de mon édition */
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
          style={({ pressed }) => [styles.tile, halfStyle, styles.tall, styles.solid, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Fin, ${endLabel ?? 'pas de date'}, ${countdown}. Modifier`}
        >
          <LinearGradient colors={accentGradient} style={styles.solidFill} />
          <View style={styles.tileTop}>
            <Text style={[styles.kicker, styles.kickerOnDark]}>Fin</Text>
            <PencilIcon size={15} color={colors.white} strokeWidth={2.2} />
          </View>
          <Text style={styles.countdown} numberOfLines={1} adjustsFontSizeToFit>
            {countdown}
          </Text>
          <Text style={styles.subOnDark} numberOfLines={1}>
            {endLabel ?? 'Pas de date'}
          </Text>
        </Pressable>

        {/* ── Le club ── */}
        <View
          style={[styles.tile, halfStyle, styles.tall, styles.paper]}
          accessible
          accessibilityLabel={`La moitié du club est à ${clubPercent} %, toi à ${myPercent} %`}
        >
          <Text style={styles.kicker}>Progression</Text>
          <View style={styles.ringRow}>
            <Ring percent={clubPercent} />
            <View>
              <Text style={styles.ringValue}>{Math.round(clubPercent)} %</Text>
              <Text style={styles.sub}>toi {Math.round(myPercent)} %</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.row}>
        {/* ── Mes pages ── */}
        <View
          style={[styles.tile, halfStyle, styles.paper]}
          accessible
          accessibilityLabel={`${pages} pages`}
        >
          <View style={styles.tileTop}>
            <Text style={styles.kicker}>Pages</Text>
            <BookOpenIcon size={15} color={colors.textTertiary} strokeWidth={2.2} />
          </View>
          <Text style={styles.bigNumber}>{pages}</Text>
          <Text style={styles.sub}>mon édition</Text>
        </View>

        {/* ── Les membres ── */}
        <Pressable
          onPress={onOpenMembers}
          style={({ pressed }) => [styles.tile, halfStyle, styles.paper, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`${members.length} membres, voir le classement`}
        >
          <Text style={styles.kicker}>Membres</Text>
          <View style={[styles.avatars, styles.avatarsSpaced]}>
            {members.slice(0, 4).map((m, i) => (
              <Image
                key={m.id}
                source={m.photoUrl?.startsWith('http') ? { uri: m.photoUrl } : DEFAULT_AVATAR}
                style={[styles.avatar, i > 0 && styles.avatarOverlap]}
                contentFit="cover"
              />
            ))}
          </View>
          <View style={[styles.tileBottom, styles.pushDown]}>
            <Text style={styles.bigNumberInline}>{members.length}</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
        </Pressable>
      </View>

      {/* ── Inviter ── */}
      <Pressable
        onPress={onInvite}
        style={({ pressed }) => [styles.tile, styles.wide, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Inviter, code ${inviteCode?.split('').join(' ') ?? 'indisponible'}`}
      >
        <LinearGradient
          colors={inkGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.fill, styles.inviteFill]}
        >
          <Text style={[styles.kicker, styles.kickerOnDark]}>Inviter</Text>
          <Text style={styles.code}>{inviteCode ?? '------'}</Text>
          <ShareIcon size={18} color={colors.white} strokeWidth={2.2} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

// ─── L'anneau du club ──────────────────────────────────────────────

const RING = 46;
const STROKE = 6;

function Ring({ percent }: { percent: number }) {
  const r = (RING - STROKE) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <Svg width={RING} height={RING} style={styles.ring}>
      <Circle cx={RING / 2} cy={RING / 2} r={r} stroke={inkAlpha(0.08)} strokeWidth={STROKE} fill="none" />
      <Circle
        cx={RING / 2}
        cy={RING / 2}
        r={r}
        stroke={colors.accent}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={circumference * (1 - clamped / 100)}
        fill="none"
        // Départ en haut, sens des aiguilles d'une montre
        transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
      />
    </Svg>
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const AVATAR = 22;

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
  wide: {
    height: 64,
  },
  /** Tuile papier : comme les sections de la fiche */
  paper: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  /**
   * Tuile pleine dans une rangée : mêmes marge et bordure que la tuile papier,
   * sinon la mise en page les compte dans la largeur et les tuiles diffèrent
   */
  solid: {
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  solidFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.lg,
  },
  /** Tuile pleine : le dégradé remplit la tuile, coins compris */
  fill: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
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
  tileBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  kicker: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textTertiary,
  },
  kickerOnDark: {
    color: colors.white,
    opacity: 0.75,
  },
  countdown: {
    marginTop: 'auto',
    fontFamily: fonts.display,
    fontSize: 38,
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  subOnDark: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.white,
    opacity: 0.8,
  },

  ringRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  ring: {
    flexShrink: 0,
  },
  ringValue: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },

  pushDown: {
    marginTop: 'auto',
  },
  bigNumberInline: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  avatarsSpaced: {
    marginTop: spacing.sm,
  },
  bigNumber: {
    marginTop: 'auto',
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
  chevron: {
    fontFamily: fonts.body,
    fontSize: 20,
    lineHeight: 20,
    color: colors.textPlaceholder,
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

  inviteFill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 0,
  },
  code: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 20,
    letterSpacing: 4,
    color: colors.white,
  },
});
