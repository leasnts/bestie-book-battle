/**
 * Composant ProgressCard
 *
 * Carte de comparaison de progression entre deux participants.
 * Affiche côte à côte : "Moi" (à gauche) et l'ami.e (à droite)
 * avec leurs scores, streaks et une barre de progression comparative.
 *
 * Comment ça marche :
 * - En haut : les deux participants avec avatar, nom, et sphère 3D (online dot)
 * - Au milieu : les scores (grand chiffre en Rokkitt SemiBold) avec badge streak (flamme Lucide)
 * - En bas : une barre de progression duale 3D (ombres internes + externes)
 * - Une couronne PNG s'affiche au-dessus de l'avatar du leader
 *
 * Les sphères 3D utilisent un gradient radial SVG pour simuler un éclairage réaliste.
 * Les barres de progression ont une ombre externe (drop-shadow) et une ombre interne
 * simulée via des bordures semi-transparentes (car React Native ne supporte pas inset box-shadow).
 */

import { Image } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { colors, spacing } from '../../utils/constants';
import IconFlame from '../icons/IconFlame';

interface Participant {
  id: string;
  name: string;
  photoUrl: string | null;
  score: number;        // Page actuelle (= score)
  streak: number;       // Nombre de jours consécutifs
  isLeader: boolean;    // Est en tête ?
  /** true = a lu hier mais pas aujourd'hui, le streak va « mourir » si pas de lecture */
  streakAtRisk?: boolean;
}

interface ProgressCardProps {
  /** Le participant "moi" (utilisateur connecté) */
  me: Participant;
  /** Le participant ami.e */
  friend: Participant | null;
  /** Callback quand on tap sur un participant */
  onParticipantPress?: (participantId: string) => void;
}

// Fallback avatar
const DEFAULT_AVATAR = require('../../assets/images/lea.png');

// Image de la couronne (remplace l'emoji 👑 pour un rendu cohérent cross-platform)
const CROWN_IMAGE = require('../../assets/images/crown.png');

const resolveAvatar = (url: string | null) => {
  if (!url) return DEFAULT_AVATAR;
  if (url.startsWith('http://') || url.startsWith('https://')) return { uri: url };
  return DEFAULT_AVATAR;
};

// ─── Hook : compteur roulant ──────────────────────────────────────
/**
 * Anime un nombre de sa valeur précédente vers la nouvelle valeur,
 * avec un effet de "compteur qui roule" (odometer).
 *
 * Comment ça marche :
 * - On garde en mémoire la valeur précédente avec useRef
 * - Quand target change, on lance une boucle requestAnimationFrame
 *   qui interpole entre l'ancienne et la nouvelle valeur
 * - L'interpolation utilise une courbe ease-out cubique :
 *   rapide au début, ralentit vers la fin (naturel et satisfaisant)
 * - Le nombre affiché est arrondi à l'entier le plus proche
 *
 * @param target La valeur cible (nombre entier)
 * @param duration Durée de l'animation en ms (défaut: 800ms)
 * @returns Le nombre actuellement affiché (animé)
 */
function useRollingCounter(target: number, duration = 800): number {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);
  const rafId = useRef<number | undefined>(undefined);

  useEffect(() => {
    const from = prev.current;
    prev.current = target;
    if (from === target) return;

    const start = Date.now();
    const diff = target - from;

    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);
      // Ease-out cubique : rapide au début, ralentit à la fin
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + diff * eased));
      if (t < 1) {
        rafId.current = requestAnimationFrame(tick);
      }
    };

    rafId.current = requestAnimationFrame(tick);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [target, duration]);

  return display;
}

// ─── Sphère 3D (online dot) ──────────────────────────────────────
/**
 * Petit cercle 3D de 12px qui simule une sphère éclairée.
 *
 * Comment ça marche :
 * - On utilise un gradient radial SVG pour créer l'illusion de volume
 * - Le centre du gradient est décalé vers le haut-gauche (cx=35%, cy=35%)
 *   pour simuler un éclairage venant du coin supérieur gauche
 * - Le stop intérieur est la couleur claire (reflet) et le stop extérieur
 *   est la couleur sombre (ombre), ce qui donne la profondeur 3D
 *
 * @param variant 'dark' = sphère noire (pour "Moi"), 'light' = sphère grise (pour l'ami.e)
 */
function Sphere3D({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  // Couleurs des stops du gradient selon la variante
  const highlightColor = variant === 'dark' ? '#666666' : '#e0e0e0';
  const baseColor = variant === 'dark' ? '#0a0d12' : '#a0a0a0';

  return (
    <Svg width={12} height={12} viewBox="0 0 12 12">
      <Defs>
        <RadialGradient
          id={`sphere-${variant}`}
          cx="35%"
          cy="35%"
          rx="50%"
          ry="50%"
        >
          <Stop offset="0%" stopColor={highlightColor} stopOpacity={1} />
          <Stop offset="100%" stopColor={baseColor} stopOpacity={1} />
        </RadialGradient>
      </Defs>
      <Circle cx={6} cy={6} r={6} fill={`url(#sphere-${variant})`} />
    </Svg>
  );
}

// ─── Barre de progression 3D ──────────────────────────────────────
/**
 * Segment de barre avec effet 3D : ombre externe + ombre interne simulée.
 *
 * Comment ça marche :
 * - L'ombre EXTERNE (drop shadow) est gérée par les propriétés shadow* de React Native
 *   → elle donne l'impression que la barre "flotte" au-dessus du fond
 * - L'ombre INTERNE est simulée avec un overlay View qui a :
 *   → une bordure TOP semi-transparente blanche = reflet lumineux en haut
 *   → une bordure BOTTOM semi-transparente noire = ombre en bas
 *   → Ça imite le comportement de `box-shadow: inset` du CSS
 * - Le tout est enveloppé dans un borderRadius: 9999 (full pill shape)
 *
 * @param color Couleur de fond de la barre (dark pour "moi", gris pour "ami")
 * @param flex La proportion que ce segment occupe dans la barre totale
 */
function ProgressSegment3D({
  color,
  flex,
}: {
  color: string;
  flex: number;
}) {
  // Shared value animée pour la proportion (flex) de la barre.
  // Quand flex change (ex: score mis à jour après enregistrement),
  // withTiming interpole doucement sur 800ms entre l'ancienne et
  // la nouvelle proportion → la barre "grandit" progressivement.
  const animatedFlex = useSharedValue(flex);

  useEffect(() => {
    animatedFlex.value = withTiming(flex, { duration: 800 });
  }, [flex]);

  // Style animé — seule la propriété flex est interpolée
  const animatedStyle = useAnimatedStyle(() => ({
    flex: animatedFlex.value,
  }));

  return (
    <Animated.View
      style={[
        styles.progressSegment,
        { backgroundColor: color },
        animatedStyle,
      ]}
    >
      {/* Overlay qui simule l'ombre interne (inset box-shadow).
          - borderTopColor blanc = reflet lumineux en haut de la barre
          - borderBottomColor noir = ombre sombre en bas de la barre
          Combiné, ça donne un effet de cylindre/tube 3D. */}
      <View style={styles.progressInnerShadow} />
    </Animated.View>
  );
}

export default function ProgressCard({
  me,
  friend,
  onParticipantPress,
}: ProgressCardProps) {
  // Calcul de la proportion de la barre de progression
  // Le total = score moi + score ami
  // La largeur de chaque segment est proportionnelle
  const totalScore = me.score + (friend?.score || 0);
  const myRatio = totalScore > 0 ? me.score / totalScore : 0.5;

  // Compteurs roulants — quand le score change (ex: après enregistrement),
  // le nombre affiché s'incrémente progressivement de l'ancien au nouveau,
  // comme un compteur/odomètre qui "roule". Ça donne un feedback visuel
  // satisfaisant à la place du toast "Enregistré !".
  const myDisplayScore = useRollingCounter(me.score);
  const friendDisplayScore = useRollingCounter(friend?.score ?? 0);

  return (
    <View style={styles.container}>
      {/* ── Ligne des participants (avatars + noms + sphères 3D) ── */}
      <View style={styles.usersRow}>
        {/* Moi — à gauche */}
        <Pressable
          style={styles.userInfo}
          onPress={() => onParticipantPress?.(me.id)}
        >
          {/* Conteneur avatar + couronne : la couronne est positionnée
              en absolute par rapport à ce wrapper, centrée horizontalement
              au-dessus de l'avatar du leader. */}
          <View style={styles.avatarWrapper}>
            <Image
              source={resolveAvatar(me.photoUrl)}
              style={styles.avatar}
              contentFit="cover"
            />
            {/* Couronne du leader — centrée et droite au-dessus de l'avatar */}
            {me.isLeader && (
              <View style={styles.crownOverAvatar}>
                <Image source={CROWN_IMAGE} style={styles.crownImage} contentFit="contain" />
              </View>
            )}
          </View>
          <Text style={styles.userName}>Moi</Text>
          {/* Sphère 3D noire — indicateur "online" */}
          <Sphere3D variant="dark" />
        </Pressable>

        {/* Ami.e — à droite (layout inversé : sphère, nom, avatar) */}
        {friend && (
          <Pressable
            style={[styles.userInfo, styles.userInfoRight]}
            onPress={() => onParticipantPress?.(friend.id)}
          >
            {/* Sphère 3D grise */}
            <Sphere3D variant="light" />
            <Text style={styles.userName}>{friend.name}</Text>
            <View style={styles.avatarWrapper}>
              <Image
                source={resolveAvatar(friend.photoUrl)}
                style={styles.avatar}
                contentFit="cover"
              />
              {/* Couronne ami — même centrage droit */}
              {friend.isLeader && (
                <View style={[styles.crownOverAvatar, styles.crownOverAvatarRight]}>
                  <Image source={CROWN_IMAGE} style={styles.crownImage} contentFit="contain" />
                </View>
              )}
            </View>
          </Pressable>
        )}
      </View>

      {/* ── Score + Streak ── */}
      <View style={styles.scoreAndProgress}>
        <View style={styles.scoresRow}>
          {/* Score de gauche (moi) */}
          <View style={styles.scoreSection}>
            <Text style={styles.scoreNumber}>{myDisplayScore}</Text>
            {me.streak > 0 && (
              <View
                style={[
                  styles.streakBadge,
                  me.streakAtRisk && styles.streakBadgeAtRisk,
                ]}
              >
                <IconFlame size={12} color={colors.textTertiary} />
                <Text style={styles.streakText}>{me.streak}</Text>
              </View>
            )}
          </View>

          {/* Score de droite (ami) */}
          {friend && (
            <View style={[styles.scoreSection, styles.scoreSectionRight]}>
              {friend.streak > 0 && (
                <View
                  style={[
                    styles.streakBadge,
                    friend.streakAtRisk && styles.streakBadgeAtRisk,
                  ]}
                >
                  <IconFlame size={12} color={colors.textTertiary} />
                  <Text style={styles.streakText}>{friend.streak}</Text>
                </View>
              )}
              <Text style={styles.scoreNumber}>{friendDisplayScore}</Text>
            </View>
          )}
        </View>

        {/* ── Barre de progression duale 3D ── */}
        <View style={styles.progressRow}>
          {/* Segment "moi" (noir foncé, 3D) */}
          <ProgressSegment3D
            color={colors.dark950}
            flex={myRatio}
          />
          {/* Segment "ami" (gris clair, 3D) */}
          {friend && (
            <ProgressSegment3D
              color="#a4a7ae"
              flex={1 - myRatio}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 24,
    gap: spacing.md,
    position: 'relative',
  },

  // ═══ LIGNE UTILISATEURS ═══

  usersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userInfoRight: {
    justifyContent: 'flex-end',
  },

  // ═══ AVATAR + COURONNE ═══

  // Le wrapper autour de l'avatar permet de positionner la couronne
  // en absolute par rapport à l'avatar (pas par rapport au container global)
  avatarWrapper: {
    position: 'relative',
    width: 24,
    height: 24,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  // Couronne positionnée au-dessus de l'avatar, centrée horizontalement.
  // - top: -18 = remonte au-dessus de l'avatar (bottom du crown à -18+28 = 10px)
  // - left: -2 = centre les 28px de la couronne sur les 24px de l'avatar
  //   → (24 - 28) / 2 = -2
  // - Pas de rotation : la couronne reste droite
  crownOverAvatar: {
    position: 'absolute',
    top: -18,
    left: -2,
    zIndex: 10,
  },
  // Pour l'ami à droite, même centrage (pas d'inversion miroir)
  crownOverAvatarRight: {
    // Même position centrée que la gauche, pas de surcharge nécessaire
  },
  crownImage: {
    width: 28,
    height: 28,
  },

  // ═══ NOM UTILISATEUR ═══

  userName: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 22,
  },

  // ═══ SCORES + PROGRESSION ═══

  // Ce conteneur regroupe les scores et la barre de progression
  // avec un gap de 4px entre eux (comme dans le Figma)
  scoreAndProgress: {
    gap: 4,
  },
  scoresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  scoreSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  scoreSectionRight: {
    justifyContent: 'flex-end',
  },
  // Le nombre de pages en font display Rokkitt SemiBold.
  // IMPORTANT : le nom 'Rokkitt_SemiBold' correspond au nom enregistré
  // dans _layout.tsx (pas 'Rokkitt_600SemiBold' qui est le nom d'import).
  scoreNumber: {
    fontFamily: 'Rokkitt_SemiBold',
    fontSize: 24,
    color: colors.textPrimary,
    lineHeight: 32,
  },

  // ═══ BADGE STREAK ═══

  // Badge avec fond légèrement teinté + bordure, contenant l'icône flamme Lucide + le nombre
  // Badge streak : 43×20px exact (Figma).
  // borderWidth: 1 s'ajoute à l'extérieur en RN, donc on compense
  // en retirant 1px de chaque côté du padding (8→7, 4→3).
  // Résultat : 1(border) + 7(pad) + 12(icon) + 2(gap) + ~13(text) + 7(pad) + 1(border) = 43px
  //            1(border) + 3(pad) + 12(content) + 3(pad) + 1(border) = 20px
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  /** Streak en danger : badge en opacité réduite + bordure pointillée */
  streakBadgeAtRisk: {
    opacity: 0.6,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.3)',
  },
  // Le lineHeight doit être 12 (= même hauteur que l'icône 12×12)
  // pour que le contenu intérieur fasse exactement 12px de haut.
  // Avant c'était 18, ce qui gonflait le badge à 26px au lieu de 20.
  streakText: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 12,
    color: colors.textTertiary,
    lineHeight: 12,
    textAlign: 'center',
  },

  // ═══ BARRE DE PROGRESSION 3D ═══

  progressRow: {
    flexDirection: 'row',
    gap: 4,
    height: 8,
  },
  // Chaque segment de la barre a :
  // - une ombre externe (shadowColor/Offset/Opacity/Radius) pour le drop-shadow
  // - un borderRadius full-pill (9999) pour les bouts arrondis
  progressSegment: {
    height: 8,
    borderRadius: 9999,
    overflow: 'hidden',
    // Ombre externe (drop shadow) — identique au Figma :
    // 0px 4px 6px rgba(0,0,0,0.25)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  // Overlay pour simuler l'ombre interne (inset box-shadow).
  // React Native ne supporte pas `box-shadow: inset`, donc on utilise
  // des bordures semi-transparentes :
  // - borderTopColor blanc 25% = reflet lumineux en haut (simule inset 0 4px 4px blanc 25%)
  // - borderBottomColor noir 30% = ombre en bas (simule inset 0 -1px 4px noir 30%)
  progressInnerShadow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 9999,
    borderTopWidth: 2,
    borderBottomWidth: 1.5,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderTopColor: 'rgba(255,255,255,0.25)',
    borderBottomColor: 'rgba(0,0,0,0.30)',
  },
});
