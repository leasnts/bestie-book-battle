import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {Eyes, Subtitle, Word} from './Logo';
import {useLoop} from './loop';
import {BG} from './theme';

const W = 3840;
const H = 1646;

/**
 * Le logo complet, proportions du splash : yeux, « Lowki », « book club ».
 * Les yeux occupent 95 → 1020 de leur repère 1200 : on centre ce qui se voit.
 */
const EYES = 600;
const WORD_H = 206;
const SUB_H = 55;
const GAP_WORD = 64;
const GAP_SUB = 40;
const EYES_VISIBLE = {top: (95 / 1200) * EYES, bottom: (1020 / 1200) * EYES};
const BLOCK = EYES_VISIBLE.bottom - EYES_VISIBLE.top + GAP_WORD + WORD_H + GAP_SUB + SUB_H;
const EYES_TOP = H / 2 - BLOCK / 2 - EYES_VISIBLE.top;
const WORD_TOP = EYES_TOP + EYES_VISIBLE.bottom + GAP_WORD;
const SUB_TOP = WORD_TOP + WORD_H + GAP_SUB;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/**
 * Le regard, en étapes posées : un coup d'œil à gauche, à droite, en l'air,
 * puis retour face à nous. La dernière étape retombe sur la première (boucle).
 */
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
  return {
    x: interpolate(frame, at, GAZE.map((g) => g.x), opts),
    y: interpolate(frame, at, GAZE.map((g) => g.y), opts),
  };
};

/** Deux battements de cils, quand le regard change de côté, et un clin d'œil du petit œil. */
const useLids = () => {
  const {frame} = useLoop();
  const blink = (at: number, len: number) =>
    interpolate(frame, [at, at + len / 2, at + len], [1, 0.06, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
  const both = Math.min(blink(82, 8), blink(186, 8));
  return {left: both, right: Math.min(both, blink(232, 14))};
};

// Fond rouge : dégradé du splash (jamais d'aplat), lavis qui respirent, grain de papier.
const Backdrop = () => {
  const {turn} = useLoop();
  const blooms = [
    {x: 0.5, y: 0.42, r: 1700, light: true, p: 0},
    {x: 0.15, y: 0.85, r: 1200, light: false, p: 2},
    {x: 0.86, y: 0.18, r: 1300, light: false, p: 4},
  ];
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${BG[0]} 0%, ${BG[1]} 100%)`}}>
      {blooms.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: b.x * W + Math.cos(turn + b.p) * 60 - b.r / 2,
            top: b.y * H + Math.sin(turn + b.p) * 40 - b.r / 2,
            width: b.r,
            height: b.r,
            borderRadius: '50%',
            background: b.light
              ? 'radial-gradient(circle, rgba(196, 64, 70, 0.4) 0%, rgba(196, 64, 70, 0) 65%)'
              : 'radial-gradient(circle, rgba(86, 17, 21, 0.4) 0%, rgba(86, 17, 21, 0) 70%)',
          }}
        />
      ))}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity: 0.3}}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={W} height={H} filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

export const StoreHeader = () => {
  const gaze = useGaze();
  const open = useLids();
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Backdrop />
      <div style={{position: 'absolute', left: W / 2 - EYES / 2, top: EYES_TOP}}>
        <Eyes size={EYES} gaze={gaze} open={open} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: WORD_TOP, display: 'flex', justifyContent: 'center'}}>
        <Word height={WORD_H} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: SUB_TOP, display: 'flex', justifyContent: 'center'}}>
        <Subtitle height={SUB_H} />
      </div>
    </AbsoluteFill>
  );
};
