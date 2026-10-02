/**
 * GoalTrack — la piste du livre, de 0 à 100 %.
 *
 * C'est la couture de Ma page en petit (Lea, 2026-10-01 : la barre lisse
 * détonnait à côté des cadres brodés) :
 *
 * - le **fil** en point avant, un point tous les quelques points : chocolat
 *   jusqu'à moi, sable après — la même matière que la règle de Ma page et les
 *   autocollants brodés ;
 * - les **caps** et la **fin** sont des nœuds de broderie : lie de vin une fois
 *   dépassés, sable sinon. Plus de date sous le cap en cours (Lea, 2026-10-01) :
 *   on la trouve dans la fiche du livre ;
 * - **moi** : là où le fil passe du chocolat au sable (plus de pastille ni de
 *   loupe, Lea, 2026-10-01) ;
 * - le repère de gauche (J-x) dit le temps qu'il reste, la date de fin est au bout.
 *
 * Tout est en pourcentage : les caps aussi, pour tomber au même endroit quelle
 * que soit l'édition de chacun.
 */

import { CheckIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import Svg, { Circle, Defs, G, Line, RadialGradient, Stop } from 'react-native-svg';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, inkAlpha } from '../../utils/constants';
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

export default function GoalTrack({ myPercent, caps, endDate, leadingLabel }: GoalTrackProps) {
  const currentCap = caps.find((cap) => cap.state === 'current') ?? null;
  // Largeur de la piste, pour placer les points du fil
  const [width, setWidth] = useState(0);
  const knots = [...caps.map((cap) => cap.percent), ...(endDate ? [100] : [])];
  const meX = (width * myPercent) / 100;

  return (
    <View accessible accessibilityLabel={trackLabel(myPercent, currentCap, endDate)}>
      <View style={styles.track} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <>
            {/* Un peu plus large que la piste : sinon les nœuds du bout sont coupés en deux */}
            <Svg width={width + 2 * KNOT_PAD} height={TRACK_HEIGHT} style={styles.seam}>
              <KnotGradients />
              <G transform={`translate(${KNOT_PAD} 0)`}>
                <Seam width={width} readUntil={meX} />
                {knots.map((percent) => (
                  <Knot key={percent} x={(width * percent) / 100} reached={percent <= myPercent} />
                ))}
              </G>
            </Svg>
          </>
        )}
      </View>

      <View style={styles.labels}>
        {/*
          Les dates sont posées à un endroit précis de la piste : elles suivent
          le réglage système, mais de façon bornée, sinon elles se chevauchent
          et ne désignent plus rien. Même règle que le chiffre du sélecteur.
        */}
        {leadingLabel && <View style={styles.leading}>{leadingLabel}</View>}
        {endDate && (
          <Text style={[styles.label, styles.endLabel]} maxFontSizeMultiplier={1.3}>
            {formatTrackDate(endDate)}
          </Text>
        )}
      </View>
    </View>
  );
}

/** Les dégradés des nœuds : bombés, éclairés en haut à gauche */
export function KnotGradients() {
  return (
    <Defs>
      <RadialGradient id="knotReached" cx="35%" cy="30%" r="80%">
        <Stop offset="0" stopColor="#b0596b" />
        <Stop offset="0.55" stopColor={colors.accent} />
        <Stop offset="1" stopColor="#4f1826" />
      </RadialGradient>
      <RadialGradient id="knotAhead" cx="35%" cy="30%" r="80%">
        <Stop offset="0" stopColor="#f4ece1" />
        <Stop offset="0.6" stopColor={SAND} />
        <Stop offset="1" stopColor="#b9a891" />
      </RadialGradient>
    </Defs>
  );
}

/**
 * Le fil en point avant : chocolat jusqu'à `readUntil`, sable après. Partagé
 * avec la piste du carnet (`NotesTrack`) : un seul fil dans l'app.
 */
export function Seam({ width, readUntil, y = TRACK_HEIGHT / 2 }: { width: number; readUntil: number; y?: number }) {
  const stitches = [];
  for (let x = 0; x <= width; x += STITCH_STEP) {
    stitches.push(
      <Line
        key={x}
        x1={x}
        y1={y}
        x2={Math.min(x + STITCH_LEN, width)}
        y2={y}
        stroke={x < readUntil ? THREAD_READ : THREAD_AHEAD}
        strokeWidth={STITCH_WIDTH}
        strokeLinecap="round"
      />,
    );
  }
  return <>{stitches}</>;
}

function Knot({ x, reached }: { x: number; reached: boolean }) {
  return (
    <Circle
      cx={x}
      cy={TRACK_HEIGHT / 2}
      r={KNOT_R}
      fill={reached ? 'url(#knotReached)' : 'url(#knotAhead)'}
    />
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

const TRACK_HEIGHT = 28;
/** Le fil : un point de 3,5 pt tous les 6 pt (le point avant de la règle de Ma page, en petit) */
const STITCH_STEP = 6;
const STITCH_LEN = 3.5;
const STITCH_WIDTH = 1.8;
/** Les couleurs du fil de Ma page (milieu de ses dégradés) */
const THREAD_READ = '#3f2b20';
const THREAD_AHEAD = '#d6ccbf';
export const SAND = '#d8cbbb';
export const KNOT_R = 3.4;
/** Ce que le dessin du fil déborde de la piste, de chaque côté */
const KNOT_PAD = KNOT_R + 1;

// Gardés pour les pistes des autres écrans (ParticipantTimeline, ProgressGauge)
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

/** Couleur d'une étape : celle de la barre qui l'a dépassée (moi, sinon le club) */
function stepStyle(percent: number, myPercent: number, clubPercent: number) {
  if (percent <= myPercent) return styles.stepReached;
  if (percent <= clubPercent) return styles.stepClub;
  return styles.stepAhead;
}

const styles = StyleSheet.create({
  track: {
    height: TRACK_HEIGHT,
    marginHorizontal: 7,
  },
  seam: {
    position: 'absolute',
    top: 0,
    left: -KNOT_PAD,
  },

  // La fiche du livre : les caps en ronds pleins (CapDot)
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
  endLabel: {
    right: -5,
  },
  // Aligné sur le départ de la piste (qui déborde de 7 pt de chaque côté)
  leading: {
    position: 'absolute',
    left: -7,
  },
});
