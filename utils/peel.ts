/**
 * La géométrie d'un autocollant qu'on décolle (pile des nouvelles du carnet).
 *
 *    A ─────────────╮          Le doigt tire le coin A jusqu'en A'.
 *    │ ╲  (replié)   │          Le pli est la médiatrice de A et A' : la partie
 *    │   ╲─────── A' │          du côté de A se soulève et se rabat par-dessus
 *    │    pli        │          la note, symétrique par rapport au pli.
 *    ╰───────────────╯
 *
 * Tout est en worklets : calculé à chaque image sur le fil de l'interface,
 * sans passer par React. La forme est un rectangle arrondi échantillonné en
 * polygone, pour que le coin replié garde son arrondi.
 */

export type Point = [number, number];

/** Le rectangle arrondi de la note, en polygone (quelques points par arrondi) */
export function roundedRect(w: number, h: number, r: number): Point[] {
  'worklet';
  const pts: Point[] = [];
  const steps = 6;
  // Les quatre arrondis, dans le sens des aiguilles d'une montre
  const corners: [number, number, number][] = [
    [w - r, r, -Math.PI / 2],
    [w - r, h - r, 0],
    [r, h - r, Math.PI / 2],
    [r, r, Math.PI],
  ];
  for (const [cx, cy, start] of corners) {
    for (let i = 0; i <= steps; i++) {
      const a = start + (i / steps) * (Math.PI / 2);
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  }
  return pts;
}

/** Garde la partie d'un polygone où `side(p) >= 0` (Sutherland–Hodgman) */
function clip(poly: Point[], mx: number, my: number, nx: number, ny: number, sign: number): Point[] {
  'worklet';
  const out: Point[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const fa = sign * ((a[0] - mx) * nx + (a[1] - my) * ny);
    const fb = sign * ((b[0] - mx) * nx + (b[1] - my) * ny);
    if (fa >= 0) out.push(a);
    if (fa >= 0 !== fb >= 0) {
      const t = fa / (fa - fb);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}

function area(poly: Point[]): number {
  'worklet';
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    s += p[0] * q[1] - q[0] * p[1];
  }
  return Math.abs(s) / 2;
}

export function toPath(poly: Point[]): string {
  'worklet';
  if (poly.length < 3) return 'M0 0Z';
  let d = `M${poly[0][0].toFixed(1)} ${poly[0][1].toFixed(1)}`;
  for (let i = 1; i < poly.length; i++) d += `L${poly[i][0].toFixed(1)} ${poly[i][1].toFixed(1)}`;
  return `${d}Z`;
}

export interface Peel {
  /** Ce qui reste collé */
  kept: Point[];
  /** Le dos de la partie décollée, rabattue par-dessus */
  flap: Point[];
  /** La part de la note décollée, 0 → 1 */
  amount: number;
}

/** Le coin A tiré en A' : ce qui reste, ce qui est rabattu, et combien */
export function peel(shape: Point[], w: number, h: number, ax: number, ay: number, bx: number, by: number): Peel {
  'worklet';
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return { kept: shape, flap: [], amount: 0 };
  const nx = dx / len;
  const ny = dy / len;
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const kept = clip(shape, mx, my, nx, ny, 1);
  const lifted = clip(shape, mx, my, nx, ny, -1);
  // Symétrie par rapport au pli : p' = p - 2((p - M)·n) n
  const flap: Point[] = lifted.map((p) => {
    const k = 2 * ((p[0] - mx) * nx + (p[1] - my) * ny);
    return [p[0] - k * nx, p[1] - k * ny] as Point;
  });
  return { kept, flap, amount: area(lifted) / (w * h) };
}
