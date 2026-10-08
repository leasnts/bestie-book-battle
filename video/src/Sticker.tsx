/**
 * Une note du carnet en autocollant brodé : la forme de NoteSticker
 * (components/ui/NoteSticker.tsx), coin en haut à gauche décollé, couture en points.
 */
const FLAP = ['#fdfbf8', '#d8d1c6'];
const STITCH = 'rgba(51, 35, 26, 0.32)';

type Props = {size: number; color: string; emoji: string; id: string};

export const Sticker = ({size: w, color, emoji, id}: Props) => {
  const h = w;
  const base = w;
  const r = base * 0.26;
  const c = base * 0.34;
  const inset = base * 0.07;
  const k = base * 0.05;
  const cut = `M ${r} 0 H ${w - c - k} Q ${w - c} 0 ${w - c + k * 0.7} ${k * 0.7} L ${w - k * 0.7} ${c - k * 0.7} Q ${w} ${c} ${w} ${c + k} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
  const i = inset;
  const ri = r - inset * 0.6;
  const ci = c - inset * 0.4;
  const stitch = `M ${i + ri} ${i} H ${w - i - ci} L ${w - i} ${i + ci} V ${h - i - ri} Q ${w - i} ${h - i} ${w - i - ri} ${h - i} H ${i + ri} Q ${i} ${h - i} ${i} ${h - i - ri} V ${i + ri} Q ${i} ${i} ${i + ri} ${i} Z`;
  const bulge = c * 0.14;
  const tip = Math.min(r, c * 0.5);
  const flapAt = (o: number) =>
    `M ${w - c} 0 Q ${w - c / 2 + bulge} ${c / 2 - bulge} ${w} ${c} L ${w - c + tip - o} ${c + o} Q ${w - c - o} ${c + o} ${w - c - o} ${c - tip + o} Z`;
  // Dessiné coin en haut à droite, puis retourné : le coin décollé passe à gauche
  const flip = `translate(${w} 0) scale(-1 1)`;
  const dot = base * 0.014;

  return (
    <div style={{position: 'relative', width: w, height: h}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <defs>
          <linearGradient id={`shade-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity={0.25} />
            <stop offset="1" stopColor="#000" stopOpacity={0.08} />
          </linearGradient>
          <linearGradient id={`flap-${id}`} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={FLAP[0]} />
            <stop offset="1" stopColor={FLAP[1]} />
          </linearGradient>
        </defs>
        <g transform={flip}>
          <path d={cut} fill={color} />
          <path d={cut} fill={`url(#shade-${id})`} />
          <path d={stitch} fill="none" stroke={STITCH} strokeWidth={dot} strokeDasharray={`0 ${dot * 2.4}`} strokeLinecap="round" />
          <path d={flapAt(base * 0.012)} fill="rgba(40, 6, 8, 0.18)" />
          <path d={flapAt(0)} fill={`url(#flap-${id})`} />
        </g>
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: w * 0.4,
          lineHeight: 1,
          paddingTop: w * 0.06,
        }}
      >
        {emoji}
      </div>
    </div>
  );
};
