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
 *   dépassés, sable sinon. Le cap en cours porte sa date dessous ;
 * - **moi** : une petite goutte de verre posée sur le fil, qui grossit les
 *   points sous elle, ma page en point lie de vin au centre. C'est la loupe de
 *   Ma page en miniature : la même goutte dit « je suis là » partout ;
 * - le repère de gauche (J-x) dit le temps qu'il reste, la date de fin est au bout.
 *
 * Tout est en pourcentage : les caps aussi, pour tomber au même endroit quelle
 * que soit l'édition de chacun.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { CheckIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Stop,
} from 'react-native-svg';
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
 * l'écrit pas (le nœud reste, et la date est dans la fiche du livre).
 */
const LEADING_LABEL_CLEARANCE = 30;

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
                <Seam from={0} to={width} readUntil={meX} />
                {knots.map((percent) => (
                  <Knot key={percent} x={(width * percent) / 100} reached={percent <= myPercent} />
                ))}
              </G>
            </Svg>
            <Loupe x={meX} trackWidth={width} knots={knots} myPercent={myPercent} />
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

/** Les dégradés des nœuds : bombés, éclairés en haut à gauche */
function KnotGradients() {
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
      {/* Mon point dans la loupe : le lie de vin de ma page dans Ma page */}
      <SvgLinearGradient id="mine" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0" stopColor={accentGradient[0]} />
        <Stop offset="1" stopColor={accentGradient[1]} />
      </SvgLinearGradient>
    </Defs>
  );
}

/**
 * Le fil en point avant, de `from` à `to` (en points de la piste) : chocolat
 * jusqu'à `readUntil`, sable après. `zoom` et `origin` grossissent le tout
 * autour d'un point (pour la loupe).
 */
function Seam({
  from,
  to,
  readUntil,
  zoom = 1,
  origin = 0,
  y = TRACK_HEIGHT / 2,
  gapAt,
}: {
  from: number;
  to: number;
  readUntil: number;
  zoom?: number;
  origin?: number;
  y?: number;
  /** Laisse la place à mon point (dans la loupe) : aucun point du fil ne passe dessous */
  gapAt?: number;
}) {
  const at = (x: number) => origin + (x - origin) * zoom;
  const stitches = [];
  // Les points restent calés sur la piste entière, pour que la loupe grossisse
  // exactement ceux qu'elle couvre
  for (let x = Math.floor(from / STITCH_STEP) * STITCH_STEP; x <= to; x += STITCH_STEP) {
    const end = Math.min(x + STITCH_LEN, to);
    if (end <= Math.max(from, 0)) continue;
    if (gapAt !== undefined && end > gapAt - STITCH_LEN && x < gapAt + STITCH_LEN) continue;
    stitches.push(
      <Line
        key={x}
        x1={at(Math.max(x, 0))}
        y1={y}
        x2={at(end)}
        y2={y}
        stroke={x < readUntil ? THREAD_READ : THREAD_AHEAD}
        strokeWidth={STITCH_WIDTH * zoom}
        strokeLinecap="round"
      />,
    );
  }
  return <>{stitches}</>;
}

function Knot({
  x,
  reached,
  r = KNOT_R,
  y = TRACK_HEIGHT / 2,
}: {
  x: number;
  reached: boolean;
  r?: number;
  y?: number;
}) {
  return <Circle cx={x} cy={y} r={r} fill={reached ? 'url(#knotReached)' : 'url(#knotAhead)'} />;
}

/**
 * Moi : la goutte de verre de Ma page, en petit. Elle grossit le fil et les
 * nœuds qu'elle couvre ; ma page y est un point de couture lie de vin au
 * centre, comme dans la loupe de Ma page. Jamais un rond : les ronds sont les
 * caps (Lea, 2026-10-01).
 */
function Loupe({
  x,
  trackWidth,
  knots,
  myPercent,
}: {
  x: number;
  trackWidth: number;
  knots: number[];
  myPercent: number;
}) {
  const size = LOUPE_R * 2;
  // Ce que la loupe couvre, en points de la piste
  const span = LOUPE_R / LOUPE_ZOOM + STITCH_STEP;
  return (
    <View pointerEvents="none" style={[styles.loupe, { left: x - LOUPE_R }]}>
      <View style={styles.loupeClip}>
        <LinearGradient colors={['#fdfcfa', '#f3eee7']} style={StyleSheet.absoluteFill} />
        <Svg width={size} height={size}>
          <KnotGradients />
          {/* La piste vue à travers le verre : décalée pour que moi tombe au centre */}
          <G transform={`translate(${LOUPE_R - x} 0)`}>
            <Seam
              from={Math.max(0, x - span)}
              to={Math.min(trackWidth, x + span)}
              readUntil={x}
              zoom={LOUPE_ZOOM}
              origin={x}
              y={LOUPE_R}
              gapAt={x}
            />
            {knots
              .filter((percent) => Math.abs((trackWidth * percent) / 100 - x) < span)
              .map((percent) => (
                <Knot
                  key={percent}
                  x={x + ((trackWidth * percent) / 100 - x) * LOUPE_ZOOM}
                  reached={percent <= myPercent}
                  r={KNOT_R * LOUPE_ZOOM}
                  y={LOUPE_R}
                />
              ))}
            <Line
              x1={x - (STITCH_LEN * LOUPE_ZOOM) / 2}
              y1={LOUPE_R}
              x2={x + (STITCH_LEN * LOUPE_ZOOM) / 2}
              y2={LOUPE_R}
              stroke="url(#mine)"
              strokeWidth={STITCH_WIDTH * LOUPE_ZOOM * 1.15}
              strokeLinecap="round"
            />
          </G>
        </Svg>
        {/* Le verre : reflet en haut, lumière concentrée en bas, bord plus sombre (comme Ma page) */}
        <View style={styles.glint} />
        <View style={styles.caustic} />
        <View style={styles.rim} />
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

const TRACK_HEIGHT = 28;
/** Le fil : un point de 3,5 pt tous les 6 pt (le point avant de la règle de Ma page, en petit) */
const STITCH_STEP = 6;
const STITCH_LEN = 3.5;
const STITCH_WIDTH = 1.8;
/** Les couleurs du fil de Ma page (milieu de ses dégradés) */
const THREAD_READ = '#3f2b20';
const THREAD_AHEAD = '#d6ccbf';
const SAND = '#d8cbbb';
const KNOT_R = 3.4;
/** Ce que le dessin du fil déborde de la piste, de chaque côté */
const KNOT_PAD = KNOT_R + 1;
/** La goutte : rayon et grossissement */
const LOUPE_R = 12.5;
const LOUPE_ZOOM = 2.2;

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

  loupe: {
    position: 'absolute',
    top: TRACK_HEIGHT / 2 - LOUPE_R,
    width: LOUPE_R * 2,
    height: LOUPE_R * 2,
    borderRadius: LOUPE_R,
    shadowColor: colors.black,
    shadowOpacity: 0.16,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  loupeClip: {
    flex: 1,
    borderRadius: LOUPE_R,
    overflow: 'hidden',
  },
  glint: {
    position: 'absolute',
    left: LOUPE_R * 0.42,
    top: LOUPE_R * 0.22,
    width: LOUPE_R * 0.62,
    height: LOUPE_R * 0.3,
    borderRadius: LOUPE_R,
    backgroundColor: 'rgba(255,255,255,0.85)',
    transform: [{ rotate: '-18deg' }],
  },
  caustic: {
    position: 'absolute',
    left: LOUPE_R * 0.55,
    bottom: LOUPE_R * 0.12,
    width: LOUPE_R * 0.9,
    height: LOUPE_R * 0.16,
    borderRadius: LOUPE_R,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  rim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: LOUPE_R,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    boxShadow: 'inset 0 -2px 4px rgba(90,69,54,0.16), 0 0 0 1px rgba(90,69,54,0.22)',
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
  capLabel: {
    // Centré sous son nœud : la moitié d'une date courte, à peu près
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
