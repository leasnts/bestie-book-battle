import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {Eyes, EyesPalette} from './Logo';
import {useLoop} from './loop';

const W = 3840;
const H = 1646;

/** Une teinte Lowki déclinée ton sur ton : fond, yeux en creux, lavis, fil. */
type Tone = {bg: readonly [string, string]; eyes: EyesPalette; bloomLight: string; bloomDark: string; stitch: string};

export const TONES = {
  rouge: {
    bg: ['#A62F43', '#7C2031'],
    eyes: {shape: ['#6A1A29', '#5E1824'], light: '#C24A5D', lightOpacity: 0.5},
    bloomLight: 'rgba(196, 74, 93, 0.4)',
    bloomDark: 'rgba(94, 24, 36, 0.45)',
    stitch: '#5E1824',
  },
  beurre: {
    bg: ['#F5E6A8', '#E6D38A'],
    eyes: {shape: ['#D6C36F', '#C4B05C'], light: '#FFF6D2', lightOpacity: 0.8},
    bloomLight: 'rgba(255, 248, 214, 0.6)',
    bloomDark: 'rgba(196, 176, 92, 0.35)',
    stitch: '#C4B05C',
  },
  chocolat: {
    bg: ['#633D32', '#482B24'],
    eyes: {shape: ['#3E2620', '#33201B'], light: '#7D5244', lightOpacity: 0.55},
    bloomLight: 'rgba(125, 82, 68, 0.45)',
    bloomDark: 'rgba(40, 24, 20, 0.45)',
    stitch: '#33201B',
  },
} satisfies Record<string, Tone>;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Fond : dégradé (jamais d'aplat), lavis qui respirent, grain de papier.
const Backdrop = ({tone}: {tone: Tone}) => {
  const {turn} = useLoop();
  const blooms = [
    {x: 0.5, y: 0.42, r: 1700, light: true, p: 0},
    {x: 0.15, y: 0.85, r: 1200, light: false, p: 2},
    {x: 0.86, y: 0.18, r: 1300, light: false, p: 4},
  ];
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${tone.bg[0]} 0%, ${tone.bg[1]} 100%)`}}>
      {blooms.map((b, i) => {
        const c = b.light ? tone.bloomLight : tone.bloomDark;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: b.x * W + Math.cos(turn + b.p) * 60 - b.r / 2,
              top: b.y * H + Math.sin(turn + b.p) * 40 - b.r / 2,
              width: b.r,
              height: b.r,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${c} 0%, transparent 68%)`,
            }}
          />
        );
      })}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity: 0.28}}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={W} height={H} filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

/** Regard posé : gauche, droite, en l'air, face ; la fin retombe sur le début. */
const GAZE: {at: number; x: number; y: number}[] = [
  {at: 0, x: 0, y: 0.15},
  {at: 22, x: 0, y: 0.15},
  {at: 34, x: -1, y: 0.05},
  {at: 74, x: -1, y: 0.05},
  {at: 92, x: 1, y: -0.1},
  {at: 134, x: 1, y: -0.1},
  {at: 150, x: -0.45, y: -0.9},
  {at: 182, x: -0.45, y: -0.9},
  {at: 198, x: 0, y: 0},
  {at: 280, x: 0, y: 0},
  {at: 300, x: 0, y: 0.15},
];

const useGaze = () => {
  const {frame} = useLoop();
  const at = GAZE.map((g) => g.at);
  const opts = {...clamp, easing: Easing.inOut(Easing.cubic)};
  return {x: interpolate(frame, at, GAZE.map((g) => g.x), opts), y: interpolate(frame, at, GAZE.map((g) => g.y), opts)};
};

const useLids = () => {
  const {frame} = useLoop();
  const blink = (at: number, len: number) =>
    interpolate(frame, [at, at + len / 2, at + len], [1, 0.06, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
  const both = Math.min(blink(82, 8), blink(186, 8), blink(262, 8));
  return {left: both, right: Math.min(both, blink(232, 14))};
};

/**
 * Les yeux de l'icône, en très grand : ils débordent du cadre comme sur l'icône.
 * Sur iPhone seul le centre du bandeau se voit, les yeux y restent entiers.
 */
export const HeaderGiant = ({tone}: {tone: keyof typeof TONES}) => {
  const t = TONES[tone];
  const size = H * 1.55;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Backdrop tone={t} />
      <div style={{position: 'absolute', left: W / 2 - size / 2, top: H / 2 - size * 0.47}}>
        <Eyes size={size} gaze={useGaze()} open={useLids()} palette={t.eyes} />
      </div>
    </AbsoluteFill>
  );
};

/** Fil cousu en points qui traverse le bandeau, comme la piste de lecture de l'app. */
const threadY = (x: number) => H * 0.74 + Math.sin((x / W) * Math.PI * 2.2 + 0.6) * 90;

const Thread = ({tone}: {tone: Tone}) => {
  const dots = [];
  for (let x = -20; x <= W + 20; x += 46) dots.push(x);
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      {dots.map((x) => (
        <circle key={x} cx={x} cy={threadY(x)} r={9} fill={tone.stitch} fillOpacity={0.75} />
      ))}
    </svg>
  );
};

/** La goutte de verre de l'app, qui glisse le long du fil. */
const Bead = ({x}: {x: number}) => {
  const r = 58;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - r,
        top: threadY(x) - r,
        width: r * 2,
        height: r * 2,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 30%, #FFFDF8 0%, #F5EFE6 45%, #D9CDBE 100%)',
        boxShadow: '0 10px 24px rgba(40, 10, 15, 0.28), inset 0 -6px 12px rgba(120, 90, 70, 0.25)',
      }}
    />
  );
};

/** Les yeux suivent la goutte qui avance et recule sur le fil (boucle sans couture). */
export const HeaderThread = ({tone}: {tone: keyof typeof TONES}) => {
  const t = TONES[tone];
  const {turn, frame} = useLoop();
  const swing = Math.sin(turn);
  const beadX = W / 2 + swing * W * 0.36;
  const size = 820;
  const blink = (at: number) => interpolate(frame, [at, at + 4, at + 8], [1, 0.06, 1], clamp);
  const lids = Math.min(blink(70), blink(220));
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Backdrop tone={t} />
      <Thread tone={t} />
      <Bead x={beadX} />
      <div style={{position: 'absolute', left: W / 2 - size / 2, top: H * 0.38 - size / 2}}>
        <Eyes size={size} gaze={{x: swing, y: 0.75}} open={{left: lids, right: lids}} palette={t.eyes} />
      </div>
    </AbsoluteFill>
  );
};
