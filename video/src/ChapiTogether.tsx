import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useVideoConfig} from 'remotion';
import {Eyes, EyesPalette} from './Logo';
import {useLoop} from './loop';

const W = 3840;
const H = 1646;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Une paire d'yeux par membre, chacune dans une teinte Lowki (yeux en creux, liseré papier). */
const MEMBERS: {x: number; y: number; size: number; tilt: number; arrive: number; palette: EyesPalette}[] = [
  {x: -1020, y: 560, size: 500, tilt: -8, arrive: 18, palette: {shape: ['#633D32', '#482B24'], light: '#FFFBF4', lightOpacity: 0.9}},
  {x: -400, y: 330, size: 540, tilt: -3, arrive: 40, palette: {shape: ['#A62F43', '#7C2031'], light: '#FFFBF4', lightOpacity: 0.9}},
  {x: 390, y: 320, size: 520, tilt: 4, arrive: 62, palette: {shape: ['#C5A47E', '#9F7C59'], light: '#FFFBF4', lightOpacity: 0.9}},
  {x: 1000, y: 550, size: 500, tilt: 9, arrive: 84, palette: {shape: ['#D6C36F', '#B8A452'], light: '#FFFBF4', lightOpacity: 0.9}},
];

/** Le livre ouvert en aquarelle, au centre, posé un peu bas. */
const BOOK_W = 1250;
const BOOK_H = BOOK_W * (1064 / 1580);
const BOOK_TOP = H - BOOK_H - 90;

// Papier crème : dégradé doux, lavis sable, grain.
const Paper = () => {
  const {turn} = useLoop();
  return (
    <AbsoluteFill style={{background: 'linear-gradient(180deg, #F7F1E7 0%, #EADFCF 100%)'}}>
      {[
        {x: 0.5, y: 0.75, r: 1900, p: 0, c: 'rgba(197, 164, 126, 0.28)'},
        {x: 0.12, y: 0.2, r: 1300, p: 2, c: 'rgba(245, 230, 168, 0.35)'},
        {x: 0.9, y: 0.3, r: 1300, p: 4, c: 'rgba(166, 47, 67, 0.08)'},
      ].map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: b.x * W + Math.cos(turn + b.p) * 50 - b.r / 2,
            top: b.y * H + Math.sin(turn + b.p) * 30 - b.r / 2,
            width: b.r,
            height: b.r,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${b.c} 0%, transparent 68%)`,
          }}
        />
      ))}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity: 0.22}}>
        <filter id="paper-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={W} height={H} filter="url(#paper-grain)" />
      </svg>
    </AbsoluteFill>
  );
};

/**
 * Le récit, en boucle de 10 s : le livre seul, chaque membre arrive à son tour,
 * tout le monde se regarde, puis plonge dans le livre ensemble ; à la fin ils
 * repartent pour que la boucle retombe sur le livre seul.
 */
export const HeaderTogether = () => {
  const {frame} = useLoop();
  const {fps} = useVideoConfig();
  const leave = interpolate(frame, [262, 292], [1, 0], {...clamp, easing: Easing.in(Easing.cubic)});
  const bookFloat = Math.sin((frame / 300) * Math.PI * 2) * 10;

  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Paper />
      {MEMBERS.map((m, i) => {
        const pop = spring({frame: frame - m.arrive, fps, config: {damping: 11, stiffness: 140, mass: 0.7}});
        const scale = pop * leave;
        // Regard : vers le centre du groupe, puis tous vers le livre.
        const toCenter = Math.sign(-m.x) * 0.8;
        const t = [m.arrive, m.arrive + 12, 118, 134, 168, 184, 250, 262];
        const gx = interpolate(frame, t, [0, 0, 0, toCenter, toCenter, -m.x / 1400, -m.x / 1400, 0], {...clamp, easing: Easing.inOut(Easing.cubic)});
        const gy = interpolate(frame, t, [0, 0, 0, -0.1, -0.1, 0.95, 0.95, 0], {...clamp, easing: Easing.inOut(Easing.cubic)});
        const blinkAt = 140 + i * 7;
        const lid = Math.min(
          interpolate(frame, [blinkAt, blinkAt + 4, blinkAt + 8], [1, 0.06, 1], clamp),
          interpolate(frame, [m.arrive + 14, m.arrive + 18, m.arrive + 22], [1, 0.06, 1], clamp),
        );
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: W / 2 + m.x - m.size / 2,
              top: m.y - m.size / 2,
              transform: `scale(${scale}) rotate(${m.tilt}deg)`,
              transformOrigin: '50% 80%',
            }}
          >
            <Eyes size={m.size} gaze={{x: gx, y: gy}} open={{left: lid, right: lid}} palette={m.palette} />
          </div>
        );
      })}
      <Img
        src={staticFile('red_book.png')}
        style={{position: 'absolute', left: W / 2 - BOOK_W / 2, top: BOOK_TOP + bookFloat, width: BOOK_W, height: BOOK_H, filter: 'saturate(0.8)'}}
      />
    </AbsoluteFill>
  );
};
