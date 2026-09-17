/**
 * Composant ReadingStateBadge
 *
 * La pastille d'état posée sur le coin d'une couverture, dans la bibliothèque.
 * Une seule forme, toujours au même endroit ; elle se remplit à mesure que
 * j'avance :
 *
 *    pas commencé     en cours          terminé
 *       ( ✓ )           ( ✓ )            (●✓●)
 *    anneau gris     anneau encre       disque encre
 *    coche grise     rempli à mon %     coche crème
 *
 * La coche grise au centre dit « à cocher » : sans elle, un anneau à moitié
 * rempli se lirait comme un indicateur de chargement.
 * Tant que le livre n'est pas fini, le fond est un flou dépoli (`GlassMaterial
 * frosted`) : la couverture dessous devient une tache de couleur, légèrement
 * voilée de crème pour que l'anneau reste lisible sur une couverture sombre.
 * Ombre douce autour.
 */

import { CheckIcon } from 'lucide-react-native';
import React, { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, inkAlpha } from '../../utils/constants';
import type { BookReading } from '../../utils/library';
import GlassMaterial from './GlassMaterial';

export const READING_BADGE_SIZE = 30;

/** Épaisseur de l'anneau */
const STROKE = 4;
/**
 * Marge claire entre l'anneau et le bord de la pastille. Sans elle, l'arc
 * marron touche le bord et se fond dans une couverture sombre.
 */
const RING_INSET = 2;
const RING_R = READING_BADGE_SIZE / 2 - RING_INSET - STROKE / 2;
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
/** Anneau et coche d'un livre pas encore coché */
const IDLE = inkAlpha(0.16);
/** Voile crème sur le flou : garde l'anneau gris lisible sur une couverture sombre */
const GLASS_VEIL = 0.55;

export default function ReadingStateBadge({ state, percent }: BookReading) {
  // Un identifiant de dégradé par pastille ; les « : » de useId cassent `url(#…)`
  const gradientId = `ink${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const c = READING_BADGE_SIZE / 2;
  const done = state === 'done';

  return (
    <View style={styles.badge}>
      {!done && <GlassMaterial radius={c} veil={GLASS_VEIL} frosted />}
      <Svg width={READING_BADGE_SIZE} height={READING_BADGE_SIZE} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={INK_TOP} />
            <Stop offset="1" stopColor={INK_BOTTOM} />
          </LinearGradient>
        </Defs>

        {done ? (
          <Circle cx={c} cy={c} r={c} fill={`url(#${gradientId})`} />
        ) : (
          <>
            {/* Piste */}
            <Circle cx={c} cy={c} r={RING_R} stroke={IDLE} strokeWidth={STROKE} fill="none" />
            {/* Mon avancement, depuis midi, dans le sens des aiguilles d'une montre */}
            {state === 'reading' && (
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
            )}
          </>
        )}
      </Svg>

      <CheckIcon
        size={CHECK_SIZE}
        color={done ? colors.white : IDLE}
        strokeWidth={done ? 2.6 : 2.2}
        absoluteStrokeWidth
      />
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
