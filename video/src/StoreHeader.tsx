import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {Eyes, Subtitle, Word} from './Logo';
import {useLoop} from './loop';
import {Sticker} from './Sticker';
import {BG, POST_IT} from './theme';

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
/** Le point que les yeux regardent depuis : le milieu des pupilles. */
const EYES_CENTER = {x: W / 2, y: EYES_TOP + (600 / 1200) * EYES};

/** Une note arrive toutes les 2 s ; elle reste 5 s puis se décolle. */
const EVERY = 60;
const IN = 18;
const STAY = 150;
const OUT = 20;
/** Décale la ronde des notes : la première image (l'affiche) en montre déjà trois. */
const PHASE = 24;

const NOTES = [
  {x: 1080, y: 470, size: 300, rot: -8, color: POST_IT.rose, emoji: '🥹'},
  {x: 2840, y: 1130, size: 320, rot: 7, color: POST_IT.jaune, emoji: '😂'},
  {x: 540, y: 1150, size: 340, rot: 6, color: POST_IT.sauge, emoji: '🤔'},
  {x: 3280, y: 470, size: 330, rot: -6, color: POST_IT.peche, emoji: '🔥'},
  {x: 1300, y: 1230, size: 260, rot: -4, color: POST_IT.bleu, emoji: '😭'},
];

const ease = Easing.out(Easing.cubic);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const NoteOnBoard = ({note, index}: {note: (typeof NOTES)[number]; index: number}) => {
  const {frame, durationInFrames, turn} = useLoop();
  const local = (frame + PHASE - index * EVERY + durationInFrames) % durationInFrames;
  if (local > STAY + OUT) return null;
  const inP = interpolate(local, [0, IN], [0, 1], {...clamp, easing: ease});
  const outP = interpolate(local, [STAY, STAY + OUT], [0, 1], {...clamp, easing: Easing.in(Easing.cubic)});
  // Posée : elle arrive d'un peu plus haut et plus grande, comme collée d'un geste
  // Décollée : elle se soulève, tourne un peu et s'efface
  const y = note.y + (1 - inP) * -36 + outP * -50 + Math.sin(turn + index) * 8;
  const scale = 1 + (1 - inP) * 0.12 - outP * 0.08;
  const rot = note.rot + (1 - inP) * 6 - outP * 10;
  const opacity = Math.min(inP, 1 - outP);
  return (
    <div
      style={{
        position: 'absolute',
        left: note.x - note.size / 2,
        top: y - note.size / 2,
        opacity,
        transform: `rotate(${rot}deg) scale(${scale})`,
        filter: `drop-shadow(0 ${10 + (1 - inP) * 20}px ${24 + (1 - inP) * 20}px rgba(40, 6, 8, 0.35))`,
      }}
    >
      <Sticker size={note.size} color={note.color} emoji={note.emoji} id={`n${index}`} />
    </div>
  );
};

/** Les yeux suivent chaque note qui arrive, puis reviennent flâner. */
const useGaze = () => {
  const {frame, durationInFrames, turn} = useLoop();
  let x = Math.sin(turn * 2) * 0.12;
  let y = Math.cos(turn * 3) * 0.08;
  NOTES.forEach((note, i) => {
    const local = (frame + PHASE - i * EVERY + durationInFrames) % durationInFrames;
    const w = interpolate(local, [2, 12, 38, 52], [0, 1, 1, 0], {...clamp, easing: Easing.inOut(Easing.sin)});
    const dx = note.x - EYES_CENTER.x;
    const dy = note.y - EYES_CENTER.y;
    const len = Math.hypot(dx, dy);
    x = x * (1 - w) + (dx / len) * w;
    y = y * (1 - w) + (dy / len) * w;
  });
  return {x, y};
};

/** Deux battements de cils et un clin d'œil du petit œil. */
const useLids = () => {
  const {frame} = useLoop();
  const blink = (at: number, len: number) =>
    interpolate(frame, [at, at + len / 2, at + len], [1, 0.06, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
  const both = Math.min(blink(56, 8), blink(178, 8));
  return {left: both, right: Math.min(both, blink(268, 14))};
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
      {NOTES.map((note, i) => (
        <NoteOnBoard key={i} note={note} index={i} />
      ))}
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
