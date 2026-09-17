/**
 * Composant ReadingStateBadge
 *
 * La pastille d'état posée sur le coin d'une couverture, dans la bibliothèque.
 * Une seule forme, toujours au même endroit ; elle se remplit à mesure que
 * j'avance :
 *
 *    pas commencé     en cours          terminé
 *      (rien)           ( ✓ )            (●✓●)
 *                    anneau encre       autocollant noyer
 *                    rempli à mon %     coché (Sticker)
 *
 * Pas de pastille sur un livre pas commencé : une rangée d'anneaux vides
 * n'apprenait rien. Seul le dernier livre ajouté porte l'autocollant « Nouveau ».
 *
 * La coche grise au centre dit « à cocher » : sans elle, un anneau à moitié
 * rempli se lirait comme un indicateur de chargement.
 * En cours, le fond est un flou dépoli (`GlassMaterial frosted`) : la couverture
 * dessous devient une teinte légère, voilée de crème pour que l'anneau reste
 * lisible sur une couverture sombre. Ombre douce autour.
 */

import { CheckIcon } from 'lucide-react-native';
import React, { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, inkAlpha } from '../../utils/constants';
import type { BookReading } from '../../utils/library';
import GlassMaterial from './GlassMaterial';
import Sticker from './Sticker';

export const READING_BADGE_SIZE = 30;
/** L'autocollant « terminé » est un peu plus grand : son bord blanc prend de la place */
const DONE_STICKER_SIZE = 34;

/**
 * Épaisseur de l'anneau. Il touche le bord de la pastille : une marge claire
 * autour le décollait mieux d'une couverture sombre, mais dessinait un contour
 * blanc disgracieux (retour de Lea, 2026-09-17).
 */
const STROKE = 4;
const RING_R = (READING_BADGE_SIZE - STROKE) / 2;
/**
 * Arc minimum affiché pour un livre commencé : à 3 %, l'arc n'est qu'un point et
 * on ne le distingue plus d'un livre pas commencé. Le vrai % reste lu par VoiceOver.
 */
const MIN_ARC_PERCENT = 10;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;
const CHECK_SIZE = 16;

/** L'encre en dégradé, du noyer clair en haut au noyer profond en bas */
const INK_TOP = colors.textSecondary; // #5a4536
const INK_BOTTOM = colors.dark950; // #1e140e
/** Piste de l'anneau et coche d'un livre pas encore fini */
const IDLE = inkAlpha(0.16);
/** Voile crème sur le flou : garde l'anneau gris lisible sur une couverture sombre */
const GLASS_VEIL = 0.55;

export default function ReadingStateBadge({ state, percent }: BookReading) {
  // Un identifiant de dégradé par pastille ; les « : » de useId cassent `url(#…)`
  const gradientId = `ink${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  if (state === 'unread') return null;
  if (state === 'done') return <Sticker size={DONE_STICKER_SIZE} icon={CheckIcon} tilt={8} />;
  const c = READING_BADGE_SIZE / 2;

  return (
    <View style={styles.badge}>
      <GlassMaterial radius={c} veil={GLASS_VEIL} frosted />
      <Svg width={READING_BADGE_SIZE} height={READING_BADGE_SIZE} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={INK_TOP} />
            <Stop offset="1" stopColor={INK_BOTTOM} />
          </LinearGradient>
        </Defs>

        {/* Piste */}
        <Circle cx={c} cy={c} r={RING_R} stroke={IDLE} strokeWidth={STROKE} fill="none" />
        {/* Mon avancement, depuis midi, dans le sens des aiguilles d'une montre */}
        <Circle
          cx={c}
          cy={c}
          r={RING_R}
          stroke={`url(#${gradientId})`}
          strokeWidth={STROKE}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - Math.max(percent, MIN_ARC_PERCENT) / 100)}
          transform={`rotate(-90 ${c} ${c})`}
        />
      </Svg>

      <CheckIcon size={CHECK_SIZE} color={IDLE} strokeWidth={2.2} absoluteStrokeWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: READING_BADGE_SIZE,
    height: READING_BADGE_SIZE,
    borderRadius: READING_BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
  },
});
