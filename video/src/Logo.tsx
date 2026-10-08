import {
  LOGO_EYES_CLIP,
  LOGO_EYES_PATH,
  LOGO_SUBTITLE_PATH,
  LOGO_SUBTITLE_RATIO,
  LOGO_SUBTITLE_VIEWBOX,
  LOGO_WORD_PATH,
  LOGO_WORD_RATIO,
  LOGO_WORD_VIEWBOX,
} from '../../components/brand/logoEyesPath';
import {DEBOSS_LIGHT, DEBOSS_OPACITY, SHAPE_GRADIENT, SHAPE_WORD} from './theme';

/**
 * Le tracé des yeux contient 5 contours : la silhouette, le creux de chaque œil
 * et chaque pupille. On les sépare pour faire bouger les pupilles dans leur creux.
 */
const [OUTLINE, LEFT_HOLE, LEFT_PUPIL, RIGHT_HOLE, RIGHT_PUPIL] = LOGO_EYES_PATH.split(/(?=M)/);
const RING = OUTLINE + LEFT_HOLE + RIGHT_HOLE;

/** Jusqu'où la pupille se déplace dans son creux (repère 1200). */
const GAZE_REACH = {left: 62, right: 46};
/** Les paupières se ferment vers le bas de chaque œil, comme au splash. */
const LID_PIVOT = {left: 975, right: 920};
const DEBOSS_EYES = 5.5;
const DEBOSS_WORD = 32;
const DEBOSS_SUBTITLE = 47;

type EyesProps = {
  size: number;
  /** Direction du regard, chaque composante entre -1 et 1. */
  gaze: {x: number; y: number};
  /** Ouverture de chaque œil, de 0 (fermé) à 1. */
  open: {left: number; right: number};
};

const Eye = ({side, gaze, open}: {side: 'left' | 'right'; gaze: EyesProps['gaze']; open: number}) => {
  const pupil = side === 'left' ? LEFT_PUPIL : RIGHT_PUPIL;
  const hole = side === 'left' ? LEFT_HOLE : RIGHT_HOLE;
  const reach = GAZE_REACH[side];
  const pivot = LID_PIVOT[side];
  const lid = `translate(0 ${pivot * (1 - open)}) scale(1 ${open})`;
  return (
    <g clipPath={`url(#half-${side})`}>
      <g transform={lid}>
        <path d={RING} fill={DEBOSS_LIGHT} fillOpacity={DEBOSS_OPACITY} fillRule="evenodd" transform={`translate(0 ${DEBOSS_EYES})`} />
        <path d={RING} fill="url(#eyes-shape)" fillRule="evenodd" />
        <g clipPath={`url(#hole-${side})`}>
          <g transform={`translate(${gaze.x * reach} ${gaze.y * reach * 0.7})`}>
            <path d={pupil} fill={DEBOSS_LIGHT} fillOpacity={DEBOSS_OPACITY} transform={`translate(0 ${DEBOSS_EYES})`} />
            <path d={pupil} fill="url(#eyes-shape)" />
          </g>
        </g>
      </g>
      <defs>
        <clipPath id={`hole-${side}`}>
          <path d={hole} />
        </clipPath>
      </defs>
    </g>
  );
};

export const Eyes = ({size, gaze, open}: EyesProps) => (
  <svg width={size} height={size} viewBox="0 0 1200 1200" style={{overflow: 'visible'}}>
    <defs>
      <linearGradient id="eyes-shape" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={SHAPE_GRADIENT[0]} />
        <stop offset="1" stopColor={SHAPE_GRADIENT[1]} />
      </linearGradient>
      <clipPath id="half-left">
        <path d={LOGO_EYES_CLIP.left} />
      </clipPath>
      <clipPath id="half-right">
        <path d={LOGO_EYES_CLIP.right} />
      </clipPath>
    </defs>
    <Eye side="left" gaze={gaze} open={open.left} />
    <Eye side="right" gaze={gaze} open={open.right} />
  </svg>
);

const Debossed = ({d, viewBox, offset, width, height}: {d: string; viewBox: string; offset: number; width: number; height: number}) => (
  <svg width={width} height={height} viewBox={viewBox} style={{overflow: 'visible'}}>
    <path d={d} fill={DEBOSS_LIGHT} fillOpacity={DEBOSS_OPACITY} transform={`translate(0 ${offset})`} />
    <path d={d} fill={SHAPE_WORD} />
  </svg>
);

export const Word = ({height}: {height: number}) => (
  <Debossed d={LOGO_WORD_PATH} viewBox={LOGO_WORD_VIEWBOX} offset={DEBOSS_WORD} width={height * LOGO_WORD_RATIO} height={height} />
);

export const Subtitle = ({height}: {height: number}) => (
  <Debossed d={LOGO_SUBTITLE_PATH} viewBox={LOGO_SUBTITLE_VIEWBOX} offset={DEBOSS_SUBTITLE} width={height * LOGO_SUBTITLE_RATIO} height={height} />
);
