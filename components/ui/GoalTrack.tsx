/**
 * GoalTrack — la piste du livre, de 0 à 100 %.
 *
 * Elle répond à « qu'est-ce qui m'attend, et dans combien de temps », sans une
 * phrase :
 *
 * - un **remplissage** : ma part lue (lie de vin) ;
 * - les **étapes** (caps passés ou à venir, et la fin) sont des ronds pleins,
 *   lie de vin si je les ai dépassées, dans une découpe de la barre ;
 * - le **cap en cours** est un drapeau, avec sa date dessous ;
 * - la date de fin est au bout, et le repère de gauche (J-x) dit le temps qu'il reste.
 *
 * Plus de pastille « moi » ni de barre du groupe (Lea, 2026-10-01) : Ma page
 * montre déjà où j'en suis et qui est devant, le classement où en est le groupe.
 *
 * Tout est en pourcentage : les caps aussi, pour tomber au même endroit quelle
 * que soit l'édition de chacun.
 */

import { CheckIcon, FlagIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import Svg, { Circle, Defs, G, LinearGradient as SvgGradient, Mask, Rect, Stop } from 'react-native-svg';
import { StyleSheet, Text, View } from 'react-native';
import { accentGradient, colors, fonts, inkAlpha } from '../../utils/constants';
import { formatTrackDate, type TrackCap } from '../../utils/track';

interface GoalTrackProps {
  /** Ma progression, 0 à 100 */
  myPercent: number;
  caps: TrackCap[];
  /** Date de fin du livre, affichée au bout de la piste */
  endDate: string | null;
  /** Repère posé au début de la ligne des dates, sous le départ de la piste (le J-x) */
  leadingLabel?: React.ReactNode;
}

/**
 * Sous ce %, la date du cap en cours tomberait sur le repère de gauche : on ne
 * l'écrit pas (le drapeau reste, et la date est dans la fiche du livre).
 */
const LEADING_LABEL_CLEARANCE = 30;

export default function GoalTrack({
  myPercent,
  caps,
  endDate,
  leadingLabel,
}: GoalTrackProps) {
  const currentCap = caps.find((cap) => cap.state === 'current') ?? null;
  // Largeur de la piste, pour dessiner la barre découpée en SVG
  const [railWidth, setRailWidth] = useState(0);
  // Les étapes rondes (caps hors cap en cours, et la fin) : là où la barre est découpée
  const stepPercents = [
    ...caps.filter((cap) => cap.state !== 'current').map((cap) => cap.percent),
    ...(endDate ? [100] : []),
  ];

  return (
    <View
      accessible
      accessibilityLabel={trackLabel(myPercent, currentCap, endDate)}
    >
      <View style={styles.track} onLayout={(e) => setRailWidth(e.nativeEvent.layout.width)}>
        {/*
          La barre est découpée autour de chaque étape (masque SVG) : un vrai
          trou où l'on voit le fond, au lieu d'un liseré blanc qui ressortait
          sur le verre.
        */}
        {railWidth > 0 && (
          <Svg width={railWidth} height={RAIL_HEIGHT} style={styles.rail}>
            <Defs>
              <SvgGradient id="me" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={accentGradient[0]} />
                <Stop offset="1" stopColor={accentGradient[1]} />
              </SvgGradient>
              <Mask id="cut" maskUnits="userSpaceOnUse" x={0} y={0} width={railWidth} height={RAIL_HEIGHT}>
                <Rect x={0} y={0} width={railWidth} height={RAIL_HEIGHT} fill="#fff" />
                {stepPercents.map((percent) => (
                  <Circle
                    key={percent}
                    cx={(railWidth * percent) / 100}
                    cy={RAIL_HEIGHT / 2}
                    r={STEP_SIZE / 2 + STEP_GAP}
                    fill="#000"
                  />
                ))}
              </Mask>
            </Defs>
            <G mask="url(#cut)">
              <Rect width={railWidth} height={RAIL_HEIGHT} rx={RAIL_HEIGHT / 2} fill={RAIL_COLOR} />
              <Rect width={(railWidth * myPercent) / 100} height={RAIL_HEIGHT} rx={RAIL_HEIGHT / 2} fill="url(#me)" />
            </G>
          </Svg>
        )}

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
                stepStyle(cap.percent, myPercent),
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
              stepStyle(100, myPercent),
            ]}
          />
        )}
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
function trackLabel(myPercent: number, currentCap: TrackCap | null, endDate: string | null) {
  const parts = [`J'en suis à ${Math.round(myPercent)} pour cent du livre`];
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
export const RAIL_HEIGHT = 6;
/** Diamètre des étapes : un peu plus gros que la barre */
export const STEP_SIZE = 9;
/** Le vide découpé dans la barre tout autour d'une étape */
export const STEP_GAP = 2;
/** Le fond de la barre : l'encre à 10 % */
export const RAIL_COLOR = inkAlpha(0.1);
/** Gris des étapes pas encore atteintes : le gris de la barre, mais opaque */
const STEP_AHEAD = '#e2ddd8';
/** Le club, derrière ma barre : le lie de vin éclairci sur le papier, opaque */
export const CLUB_GRADIENT = ['#e2c9cd', '#d3b3b9'] as const;
/** Étape dépassée par le club seulement : la même couleur que sa barre (milieu du dégradé) */
const STEP_CLUB = '#dabec3';

/**
 * Une étape de la piste, en plus gros, hors de la piste (la liste des caps de
 * la fiche du livre) : même rond, même couleur, et une coche quand c'est MOI
 * qui l'ai dépassée — pas quand seul le club l'a fait.
 */
export function CapDot({
  percent,
  myPercent,
  clubPercent,
  size = 18,
}: {
  percent: number;
  myPercent: number;
  clubPercent: number;
  size?: number;
}) {
  const mine = percent <= myPercent;
  return (
    <View
      style={[
        styles.capDot,
        { width: size, height: size, borderRadius: size / 2 },
        stepStyle(percent, myPercent, clubPercent),
      ]}
    >
      {mine && <CheckIcon size={size * 0.6} color={colors.white} strokeWidth={3.2} />}
    </View>
  );
}

/**
 * Couleur d'une étape : celle de la barre qui l'a dépassée (moi, sinon le club).
 * La piste de l'accueil n'a plus de barre du groupe : elle ne passe que moi.
 */
function stepStyle(percent: number, myPercent: number, clubPercent = 0) {
  if (percent <= myPercent) return styles.stepReached;
  if (percent <= clubPercent) return styles.stepClub;
  return styles.stepAhead;
}

const styles = StyleSheet.create({
  track: {
    height: 28,
    marginHorizontal: 7,
  },
  rail: {
    position: 'absolute',
    left: 0,
    top: RAIL_TOP,
  },

  /**
   * Étapes (caps et fin du livre) : des ronds pleins à liseré blanc, un peu plus
   * gros que la barre, de la couleur de la barre qui l'a dépassée : lie de vin
   * si JE l'ai dépassée, lie de vin clair si seul le club l'a dépassée, gris
   * sinon (cf. stepStyle).
   */
  step: {
    position: 'absolute',
    top: RAIL_TOP + RAIL_HEIGHT / 2 - STEP_SIZE / 2,
    width: STEP_SIZE,
    height: STEP_SIZE,
    marginLeft: -STEP_SIZE / 2,
    borderRadius: STEP_SIZE / 2,
  },
  capDot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepReached: {
    backgroundColor: colors.accent,
  },
  // Gris opaque de la même teinte que la barre : un gris transparent laissait
  // voir la barre à travers le point
  stepAhead: {
    backgroundColor: STEP_AHEAD,
  },
  stepClub: {
    backgroundColor: STEP_CLUB,
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
