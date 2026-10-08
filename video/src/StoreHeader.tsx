import {AbsoluteFill, Img, staticFile} from 'remotion';
import {useLoop} from './loop';
import {
  ACCENT_FONT,
  BEIGE,
  CHOCO,
  CHOCO_FORM_BOTTOM,
  CHOCO_FORM_TOP,
} from './theme';


const W = 3840;
const H = 1646;

// Rapport largeur / hauteur des captures du simulateur (iPhone 17).
const SCREEN_RATIO = 1206 / 2622;
const PHONE_SCREEN_H = 1380;
const BEZEL = 20;

type PhoneProps = {
  src: string;
  cx: number;
  cy: number;
  scale: number;
  tilt: number;
  phase: number;
  sweepAt: number;
};

const Phone = ({src, cx, cy, scale, tilt, phase, sweepAt}: PhoneProps) => {
  const {turn, frame, durationInFrames} = useLoop();
  const screenW = PHONE_SCREEN_H * SCREEN_RATIO;
  const w = screenW + BEZEL * 2;
  const h = PHONE_SCREEN_H + BEZEL * 2;

  // Flotte doucement : un aller-retour par boucle, décalé d'un téléphone à l'autre.
  const dy = Math.sin(turn + phase) * 22;
  const rot = tilt + Math.sin(turn + phase + 1) * 0.8;

  // Un reflet traverse le verre une fois par boucle.
  const sweepLen = 40;
  const local = (frame - sweepAt + durationInFrames) % durationInFrames;
  const sweep = local < sweepLen ? local / sweepLen : -1;

  return (
    <div
      style={{
        position: 'absolute',
        left: cx - w / 2,
        top: cy - h / 2 + dy,
        width: w,
        height: h,
        transform: `scale(${scale}) rotate(${rot}deg)`,
        borderRadius: 112,
        padding: BEZEL,
        boxSizing: 'border-box',
        background: 'linear-gradient(180deg, #4a3428 0%, #1e140e 100%)',
        boxShadow:
          '0 60px 120px rgba(25, 10, 4, 0.55), 0 12px 30px rgba(25, 10, 4, 0.35), inset 0 2px 0 rgba(255, 236, 220, 0.18)',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: 92,
          overflow: 'hidden',
        }}
      >
        <Img src={staticFile(src)} style={{width: '100%', height: '100%', display: 'block'}} />
        {sweep >= 0 ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(115deg, rgba(255,255,255,0) 35%, rgba(255,250,240,0.28) 50%, rgba(255,255,255,0) 65%)',
              transform: `translateX(${(sweep * 2 - 1) * 120}%)`,
            }}
          />
        ) : null}
      </div>
    </div>
  );
};

// Fond chocolat : dégradé (jamais d'aplat), lavis d'aquarelle qui respirent, grain de papier.
const Backdrop = () => {
  const {turn} = useLoop();
  const blooms = [
    {x: 0.5, y: 0.45, r: 1500, a: 0.55, p: 0},
    {x: 0.18, y: 0.8, r: 1100, a: 0.45, p: 2},
    {x: 0.84, y: 0.2, r: 1200, a: 0.4, p: 4},
  ];
  return (
    <AbsoluteFill
      style={{background: `linear-gradient(180deg, #7b3f22 0%, ${CHOCO} 45%, #552a17 100%)`}}
    >
      {blooms.map((b, i) => {
        const x = b.x * W + Math.cos(turn + b.p) * 60;
        const y = b.y * H + Math.sin(turn + b.p) * 40;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - b.r / 2,
              top: y - b.r / 2,
              width: b.r,
              height: b.r,
              borderRadius: '50%',
              background:
                i === 0
                  ? 'radial-gradient(circle, rgba(150, 86, 52, 0.55) 0%, rgba(150, 86, 52, 0) 65%)'
                  : `radial-gradient(circle, rgba(63, 31, 18, ${b.a}) 0%, rgba(63, 31, 18, 0) 70%)`,
            }}
          />
        );
      })}
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity: 0.35}}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={W} height={H} filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

// Le fil cousu qui relie les téléphones en passant sous le nom.
const Thread = () => {
  const {frame, durationInFrames} = useLoop();
  const period = 54;
  const offset = -(frame / durationInFrames) * period * 4;
  const d = `M -100 1290 C 700 1420, 1200 1150, 1920 1180 S 3200 1420, 3940 1250`;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <path d={d} fill="none" stroke="rgba(30, 12, 5, 0.35)" strokeWidth={9} strokeDasharray="32 22" strokeDashoffset={offset} strokeLinecap="round" transform="translate(0 5)" />
      <path d={d} fill="none" stroke={BEIGE} strokeWidth={8} strokeDasharray="32 22" strokeDashoffset={offset} strokeLinecap="round" />
    </svg>
  );
};

// « Lowki » ton sur ton : forme chocolat plus profonde, liseré clair dessous (gravé).
const Wordmark = () => {
  const {turn} = useLoop();
  const lift = Math.sin(turn) * 6;
  const text = 'Lowki';
  const base: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    fontFamily: ACCENT_FONT,
    fontSize: 640,
    lineHeight: 1,
    textAlign: 'center',
  };
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 420 + lift, height: 700}}>
      <div style={{...base, color: 'rgba(255, 226, 200, 0.22)', transform: 'translateY(6px)'}}>{text}</div>
      <div
        style={{
          ...base,
          backgroundImage: `linear-gradient(180deg, ${CHOCO_FORM_TOP} 20%, ${CHOCO_FORM_BOTTOM} 80%)`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const StoreHeader = () => {
  const cy = H / 2 + 40;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Backdrop />
      <Thread />
      <Phone src="screens/library.png" cx={60} cy={cy + 90} scale={0.84} tilt={-7} phase={2.4} sweepAt={170} />
      <Phone src="screens/home.png" cx={720} cy={cy} scale={1} tilt={-3.5} phase={0} sweepAt={20} />
      <Phone src="screens/carnet.png" cx={W - 720} cy={cy} scale={1} tilt={3.5} phase={1.6} sweepAt={95} />
      <Phone src="screens/leaderboard.png" cx={W - 60} cy={cy + 90} scale={0.84} tilt={7} phase={4} sweepAt={240} />
      <Wordmark />
    </AbsoluteFill>
  );
};
