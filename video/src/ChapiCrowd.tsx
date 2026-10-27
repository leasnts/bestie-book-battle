import {loadFont} from '@remotion/fonts';
import {AbsoluteFill, Easing, interpolate, spring, staticFile, useVideoConfig} from 'remotion';
import {Eyes, EyesPalette} from './Logo';
import {useLoop} from './loop';

const W = 3840;
const H = 1646;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const PAPER = '#FBF6EC';
const TONES: EyesPalette[] = [
  {shape: ['#633D32', '#482B24'], light: PAPER, lightOpacity: 0.9, backing: PAPER},
  {shape: ['#A62F43', '#7C2031'], light: PAPER, lightOpacity: 0.9, backing: PAPER},
  {shape: ['#C5A47E', '#9F7C59'], light: PAPER, lightOpacity: 0.9, backing: PAPER},
  {shape: ['#D6C36F', '#B8A452'], light: PAPER, lightOpacity: 0.9, backing: PAPER},
];

// Police d'accent, hors git (licence usage personnel, #129) : à copier dans public/fonts.
loadFont({family: 'Welcome Valentines', url: staticFile('fonts/WelcomeValentines_400Regular.ttf')});

/** Le nom au centre : tous les regards finissent sur lui. */
const CENTER = {x: W / 2, y: H / 2};

/** Deux ambiances : papier multicolore, ou rouge ton sur ton comme l'icône. */
const THEMES = {
  papier: {bg: ['#F7F1E7', '#EADFCF'], text: '#A62F43', stroke: '#F3EBDD', tones: null},
  rouge: {
    bg: ['#A62F43', '#962A3D'],
    text: '#F1E3CC',
    stroke: '#A12D41',
    tones: [{shape: ['#6A1A29', '#5E1824'], light: '#C24A5D', lightOpacity: 0.55, backing: '#A62F43'}],
  },
} as const satisfies Record<string, {bg: readonly [string, string]; text: string; stroke: string; tones: readonly EyesPalette[] | null}>;

// Hasard reproductible : la même foule à chaque rendu.
const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * La foule : une grille brouillée qui déborde largement du cadre. Chacun arrive
 * selon sa distance au centre, la salle se remplit du milieu vers les bords.
 */
const CROWD = (() => {
  const cols = 15;
  const rows = 7;
  const people = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const x = ((c + 0.5 + (r % 2) * 0.5) / cols) * (W + 500) - 250 + (rand(i) - 0.5) * 200;
      const y = ((r + 0.5) / rows) * (H + 360) - 180 + (rand(i + 99) - 0.5) * 160;
      const dist = Math.hypot((x - CENTER.x) / W, (y - CENTER.y) / H);
      people.push({
        x,
        y,
        size: 330 + rand(i + 7) * 200,
        tilt: (rand(i + 3) - 0.5) * 30,
        pick: rand(i + 5),
        arrive: 6 + dist * 95 + rand(i + 11) * 10,
        z: rand(i + 13),
        blink: 120 + Math.floor(rand(i + 17) * 120),
      });
    }
  }
  return people.sort((a, b) => a.z - b.z);
})();

export const HeaderCrowd = ({theme}: {theme: keyof typeof THEMES}) => {
  const t = THEMES[theme];
  const tones = t.tones ?? TONES;
  const {frame} = useLoop();
  const {fps} = useVideoConfig();
  const leave = interpolate(frame, [266, 290], [1, 0], {...clamp, easing: Easing.in(Easing.back(1.4))});
  // D'abord chacun regarde autour de lui, puis tout le monde fixe le nom.
  const focus = interpolate(frame, [150, 178], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});

  return (
    <AbsoluteFill style={{overflow: 'hidden', background: `linear-gradient(180deg, ${t.bg[0]} 0%, ${t.bg[1]} 100%)`}}>
      {CROWD.map((p, i) => {
        const pop = spring({frame: frame - p.arrive, fps, config: {damping: 10, stiffness: 170, mass: 0.6}});
        const wander = {x: Math.sin(frame / 18 + i) * 0.8, y: Math.cos(frame / 23 + i * 2) * 0.4};
        const look = {
          x: Math.max(-1, Math.min(1, (CENTER.x - p.x) / 900)),
          y: Math.max(-1, Math.min(1, (CENTER.y - p.y) / 500)),
        };
        const gaze = {x: wander.x + (look.x - wander.x) * focus, y: wander.y + (look.y - wander.y) * focus};
        const lid = interpolate(frame, [p.blink, p.blink + 4, p.blink + 8], [1, 0.06, 1], clamp);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: p.x - p.size / 2,
              top: p.y - p.size / 2,
              transform: `scale(${pop * leave}) rotate(${p.tilt}deg)`,
              filter: 'drop-shadow(0 6px 10px rgba(72, 43, 36, 0.12))',
            }}
          >
            <Eyes size={p.size} gaze={gaze} open={{left: lid, right: lid}} palette={tones[Math.floor(p.pick * tones.length)]} />
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: CENTER.y,
          transform: `translateY(-55%) scale(${interpolate(frame, [0, 10, 266, 290], [0.96, 1, 1, 0.96], clamp)})`,
          textAlign: 'center',
          fontFamily: 'Welcome Valentines',
          fontSize: 760,
          lineHeight: 1,
          color: t.text,
          WebkitTextStroke: `90px ${t.stroke}`,
          paintOrder: 'stroke fill',
        }}
      >
        chapi
      </div>
    </AbsoluteFill>
  );
};
