/**
 * GoalTrack — la piste du livre, de 0 à 100 %.
 *
 * Elle répond à « où en est le club, où j'en suis, et qu'est-ce qui m'attend »,
 * sans une phrase :
 *
 * - le **remplissage** va jusqu'à la médiane du club (la moitié du club est là) ;
 * - ma **pastille** (ma photo) est posée à mon pourcentage ;
 * - les **caps passés** sont de petits points neutres, que je les aie atteints ou
 *   non : la piste ne fait jamais de reproche ;
 * - le **cap en cours** est un drapeau, avec sa date dessous ;
 * - la **fin** est un rond au bout, avec sa date.
 *
 * Tout est en pourcentage : les caps aussi, pour tomber au même endroit quelle
 * que soit l'édition de chacun.
 */

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { FlagIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { accentGradient, colors, fonts, inkAlpha } from '../../utils/constants';
import { formatTrackDate, type TrackCap } from '../../utils/track';

interface GoalTrackProps {
  /** Médiane du club, 0 à 100 */
  clubPercent: number;
  /** Ma progression, 0 à 100 */
  myPercent: number;
  myPhotoUrl: string | null;
  /** Initiale affichée si je n'ai pas de photo */
  myInitial: string;
  caps: TrackCap[];
  /** Date de fin du livre, affichée au bout de la piste */
  endDate: string | null;
  /** Repère posé au début de la ligne des dates, sous le départ de la piste (le % du club) */
  leadingLabel?: React.ReactNode;
}

/**
 * Sous ce %, la date du cap en cours tomberait sur le repère de gauche : on ne
 * l'écrit pas (le drapeau reste, et la date est dans la fiche du livre).
 */
const LEADING_LABEL_CLEARANCE = 30;

export default function GoalTrack({
  clubPercent,
  myPercent,
  myPhotoUrl,
  myInitial,
  caps,
  endDate,
  leadingLabel,
}: GoalTrackProps) {
  const currentCap = caps.find((cap) => cap.state === 'current') ?? null;

  return (
    <View
      accessible
      accessibilityLabel={trackLabel(clubPercent, myPercent, currentCap, endDate)}
    >
      <View style={styles.track}>
        <View style={styles.rail}>
          {/* Progression : l'accent, en dégradé (jamais d'aplat) */}
          <LinearGradient
            colors={accentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.fill, { width: `${clubPercent}%` }]}
          />
        </View>

        {caps.map((cap) =>
          cap.state === 'current' ? (
            <View key={cap.id} style={[styles.capMark, { left: `${cap.percent}%` }]}>
              <FlagIcon
                size={13}
                color={colors.dark900}
                strokeWidth={2.4}
                style={styles.capFlag}
              />
            </View>
          ) : (
            <View
              key={cap.id}
              style={[
                styles.step,
                cap.percent <= clubPercent ? styles.stepReached : styles.stepAhead,
                { left: `${cap.percent}%` },
              ]}
            />
          ),
        )}

        {endDate && (
          <View
            style={[
              styles.step,
              styles.endStep,
              clubPercent >= 100 ? styles.stepReached : styles.stepAhead,
            ]}
          />
        )}

        {/* Ma pastille passe au-dessus des caps : c'est le repère qu'on cherche d'abord */}
        <View style={[styles.me, { left: `${myPercent}%` }]}>
          {myPhotoUrl ? (
            <Image source={{ uri: myPhotoUrl }} style={styles.mePhoto} contentFit="cover" />
          ) : (
            <Text style={styles.meInitial}>{myInitial}</Text>
          )}
        </View>
      </View>

      <View style={styles.labels}>
        {/*
          Les dates sont posées à un endroit précis de la piste : elles suivent
          le réglage système, mais de façon bornée, sinon elles se chevauchent
          et ne désignent plus rien. Même règle que le chiffre du sélecteur.
        */}
        {leadingLabel && <View style={styles.leading}>{leadingLabel}</View>}
        {currentCap && !(leadingLabel && currentCap.percent < LEADING_LABEL_CLEARANCE) && (
          <Text
            style={[styles.label, styles.capLabel, { left: `${currentCap.percent}%` }]}
            maxFontSizeMultiplier={1.3}
          >
            {formatTrackDate(currentCap.deadline)}
          </Text>
        )}
        {endDate && (
          <Text style={[styles.label, styles.endLabel]} maxFontSizeMultiplier={1.3}>
            {formatTrackDate(endDate)}
          </Text>
        )}
      </View>
    </View>
  );
}

/** Ce que VoiceOver lit : la piste en une phrase, puisqu'elle n'en porte aucune */
function trackLabel(
  clubPercent: number,
  myPercent: number,
  currentCap: TrackCap | null,
  endDate: string | null,
) {
  const parts = [
    `Le club est à ${Math.round(clubPercent)} pour cent du livre`,
    `moi à ${Math.round(myPercent)} pour cent`,
  ];
  if (currentCap) {
    parts.push(
      `prochain cap à ${Math.round(currentCap.percent)} pour cent, le ${formatTrackDate(currentCap.deadline)}`,
    );
  }
  if (endDate) parts.push(`fin le ${formatTrackDate(endDate)}`);
  return parts.join(', ');
}

// ─── Styles ────────────────────────────────────────────────────────
// Mesures de la maquette (échelle 0,865) ramenées en points.

const RAIL_TOP = 12;
const RAIL_HEIGHT = 6;
const ME_SIZE = 20;
/** Diamètre des étapes, un peu plus gros que la barre */
const STEP_SIZE = 10;

const styles = StyleSheet.create({
  track: {
    height: 28,
    marginHorizontal: 7,
  },
  rail: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: RAIL_TOP,
    height: RAIL_HEIGHT,
    borderRadius: RAIL_HEIGHT / 2,
    backgroundColor: inkAlpha(0.1),
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: RAIL_HEIGHT / 2,
  },

  /**
   * Étapes (caps et fin du livre) : de simples ronds sans bordure, un peu plus
   * gros que la barre, de la couleur de la barre à cet endroit : lie de vin si
   * le club l'a dépassée, gris sinon.
   */
  step: {
    position: 'absolute',
    top: RAIL_TOP + RAIL_HEIGHT / 2 - STEP_SIZE / 2,
    width: STEP_SIZE,
    height: STEP_SIZE,
    marginLeft: -STEP_SIZE / 2,
    borderRadius: STEP_SIZE / 2,
  },
  stepReached: {
    backgroundColor: colors.accent,
  },
  stepAhead: {
    backgroundColor: inkAlpha(0.2),
  },
  /** Cap en cours : un trait qui traverse la piste, drapeau en haut */
  capMark: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: 25,
    marginLeft: -1,
    borderRadius: 2,
    backgroundColor: colors.dark900,
  },
  capFlag: {
    position: 'absolute',
    left: 1,
    top: -4,
  },
  /** La fin du livre : au bout de la piste */
  endStep: {
    left: undefined,
    right: -STEP_SIZE / 2,
    marginLeft: 0,
  },

  me: {
    position: 'absolute',
    top: 4,
    width: ME_SIZE,
    height: ME_SIZE,
    marginLeft: -ME_SIZE / 2,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: colors.bgSecondary,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  mePhoto: {
    width: '100%',
    height: '100%',
  },
  meInitial: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 9,
    color: colors.textPrimary,
  },

  labels: {
    minHeight: 17,
    marginTop: 2,
    marginHorizontal: 7,
  },
  label: {
    position: 'absolute',
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.textSecondary,
  },
  capLabel: {
    // Centré sous le drapeau : la moitié d'une date courte, à peu près
    transform: [{ translateX: -26 }],
  },
  endLabel: {
    right: -5,
  },
  // Aligné sur le départ de la piste (qui déborde de 7 pt de chaque côté)
  leading: {
    position: 'absolute',
    left: -7,
  },
});
