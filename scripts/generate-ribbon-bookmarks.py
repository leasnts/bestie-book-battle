"""
Génère les marque-pages en tissu brodés de la bibliothèque
(assets/images/ribbons/ribbon-*.png, en @2x et @3x).

Un signet en ruban qui sort du haut du livre, se replie par-dessus le bord de la
couverture et pend devant elle, bout coupé en V. Dessus, un motif brodé au point
passé (satin stitch), en relief.

Réalisme, dans l'ordre du dessin :
- le ruban : gros-grain (fines côtes horizontales), lisières un peu plus denses,
  léger arrondi sur la largeur, dégradé clair en haut → foncé en bas (DESIGN.md :
  jamais d'aplat) ;
- pas de pli dessiné au sommet : le bourrelet formait un trait qui alourdissait le
  haut (retiré à la demande de Lea) ;
- la broderie : des centaines de fils parallèles, légèrement obliques, chacun
  avec sa propre nuance, un reflet sur le dessus et une ombre portée sur le ruban ;
- l'ombre du ruban sur la couverture.

Variantes :
- done : ruban noyer, coche brodée crème (livre terminé) ;
- new  : ruban sable, étincelle brodée noyer (dernier livre ajouté).

Usage : python3 scripts/generate-ribbon-bookmarks.py
Dépendances : numpy, Pillow.
"""

import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "assets" / "images" / "ribbons"

S = 8  # pixels par point au dessin (suréchantillonné, réduit ensuite)

# ── Géométrie, en points ──
CANVAS_W, CANVAS_H = 34, 66
RIBBON_X, RIBBON_W = 5, 23      # ruban de 23 pt de large
TOP = 1.5                        # haut du pli
COVER_TOP = 9                    # bord haut de la couverture dans l'image
TAIL_END = 60                    # pointe des deux bouts du V
NOTCH = 6                        # profondeur du V
ICON_CENTER = (RIBBON_X + RIBBON_W / 2, 38)
BORDER_INSET = 2.2               # surpiqûre : distance au bord du ruban

VARIANTS = {
    # Essai d'une couleur d'accent lie de vin (demande de Lea, 2026-09-17)
    "done": {"ribbon": ("#8c3b4c", "#5e1f2e"), "thread": "#f6ede4", "motif": "check"},
    "new": {"ribbon": ("#f3e9df", "#e1cfbf"), "thread": "#7a2e3e", "motif": "sparkle"},
}


def hex_rgb(h):
    return np.array([int(h[i : i + 2], 16) for i in (1, 3, 5)], dtype=np.float32) / 255


def blur(a, radius_pt):
    img = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))
    return np.asarray(img.filter(ImageFilter.GaussianBlur(radius_pt * S)), dtype=np.float32) / 255


def ribbon_mask():
    """Silhouette du ruban : haut arrondi par le pli, bas coupé en V."""
    w, h = CANVAS_W * S, CANVAS_H * S
    img = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(img)
    x0, x1 = RIBBON_X * S, (RIBBON_X + RIBBON_W) * S
    r = 2.2 * S
    d.rounded_rectangle([x0, TOP * S, x1, (TAIL_END - NOTCH) * S], radius=r, fill=255)
    # Pas d'arrondi en bas : on recouvre les coins du bas, puis on découpe le V
    d.rectangle([x0, (TOP + 4) * S, x1, (TAIL_END - NOTCH) * S], fill=255)
    cx = (x0 + x1) / 2
    d.polygon(
        [(x0, (TAIL_END - NOTCH) * S), (x1, (TAIL_END - NOTCH) * S), (x1, TAIL_END * S),
         (cx, (TAIL_END - NOTCH) * S), (x0, TAIL_END * S)],
        fill=255,
    )
    return np.asarray(img, dtype=np.float32) / 255


def ribbon_shading(rng):
    """Lumière du tissu, 1 = couleur de base."""
    h, w = CANVAS_H * S, CANVAS_W * S
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    xp, yp = x / S, y / S
    u = np.clip((xp - RIBBON_X) / RIBBON_W, 0, 1)  # 0 → 1 sur la largeur

    light = np.ones((h, w), np.float32)
    # Arrondi sur la largeur : bords un peu plus sombres
    light *= 0.9 + 0.1 * np.sin(u * math.pi)
    # Lisières : un fil plus clair tout au bord (il détache le ruban d'une couverture
    # sombre), puis un fil plus dense juste à l'intérieur
    edge = np.minimum(u, 1 - u) * RIBBON_W
    light *= 1 + 0.12 * np.exp(-((edge - 0.35) ** 2) / 0.05)
    light *= 1 - 0.06 * np.exp(-((edge - 1.0) ** 2) / 0.08)
    # Gros-grain : côtes horizontales tous les 0,6 pt, un peu irrégulières
    phase = fractal_rows(rng, h) * 2.0
    light *= 1 + 0.07 * np.sin((yp / 0.6) * 2 * math.pi + phase[:, None])
    # Chaîne : fils verticaux très fins, qu'on devine entre les côtes
    light *= 1 + 0.03 * np.sin((xp / 0.33) * 2 * math.pi)
    # Grain des fils, et quelques fils plus clairs ou plus foncés sur toute la hauteur
    light *= 0.96 + 0.08 * rng.random((h, w)).astype(np.float32)
    columns = np.arange(0, CANVAS_W + 1, 0.33)
    streaks = np.interp(xp, columns, 0.98 + 0.04 * rng.random(len(columns)))
    light *= streaks
    return light


def fractal_rows(rng, n):
    v = np.zeros(n, np.float32)
    for period, amp in ((40 * S, 1.0), (12 * S, 0.5)):
        pts = rng.random(n // period + 3)
        v += amp * np.interp(np.arange(n) / period, np.arange(len(pts)), pts)
    return v


# ── Broderie ──

def smooth_polyline(points, fillet, step=0.05):
    """Échantillonne une ligne brisée en arrondissant chaque coin (rayon `fillet`, en pt)."""
    out = []
    for i in range(len(points) - 1):
        (x0, y0), (x1, y1) = points[i], points[i + 1]
        seg = math.hypot(x1 - x0, y1 - y0)
        start = fillet if i > 0 else 0
        end = seg - (fillet if i < len(points) - 2 else 0)
        n = max(2, int((end - start) / step))
        for k in range(n + 1):
            t = (start + (end - start) * k / n) / seg
            out.append((x0 + (x1 - x0) * t, y0 + (y1 - y0) * t))
        if i < len(points) - 2:
            # Coin : courbe de Bézier quadratique entre la fin de ce segment et le début du suivant
            (x2, y2) = points[i + 2]
            seg2 = math.hypot(x2 - x1, y2 - y1)
            p0 = (x1 - (x1 - x0) / seg * fillet, y1 - (y1 - y0) / seg * fillet)
            p2 = (x1 + (x2 - x1) / seg2 * fillet, y1 + (y2 - y1) / seg2 * fillet)
            for k in range(1, 12):
                t = k / 12
                out.append((
                    (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * x1 + t ** 2 * p2[0],
                    (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * y1 + t ** 2 * p2[1],
                ))
    return out


def motif_strokes(kind):
    """Le motif : des traits (points en pt), avec la demi-largeur du fil au départ et à l'arrivée."""
    cx, cy = ICON_CENTER
    if kind == "check":
        k = 0.74  # pt par unité du dessin Lucide (24 × 24)
        p = [(4, 12), (9, 17), (20, 6)]
        pts = [(cx + (a - 12) * k, cy + (b - 11.5) * k) for a, b in p]
        # Comme à la main : chaque branche brodée à part, fils perpendiculaires à
        # elle. La jonction est couverte par la grande branche, brodée en second.
        # (Un seul tracé arrondi au coin faisait s'écarter les fils en frange.)
        (x0, y0), (x1, y1), (x2, y2) = pts
        hw = 1.95

        def extend(a, b, by):
            length = math.hypot(b[0] - a[0], b[1] - a[1])
            return (b[0] + (b[0] - a[0]) / length * by, b[1] + (b[1] - a[1]) / length * by)

        short = smooth_polyline([(x0, y0), extend((x0, y0), (x1, y1), hw * 0.6)], 0)
        long_leg = smooth_polyline([extend((x2, y2), (x1, y1), hw * 0.9), (x2, y2)], 0)
        return [(short, hw, hw), (long_leg, hw, hw)]
    # Étincelle à quatre branches, fines au bout
    strokes = []
    for angle, length in ((-90, 7.6), (90, 7.6), (0, 6.6), (180, 6.6)):
        a = math.radians(angle)
        tip = (cx + math.cos(a) * length, cy + math.sin(a) * length)
        strokes.append((smooth_polyline([(cx, cy), tip], 0), 2.3, 0.25))
    return strokes


class Needle:
    """Pose des fils sur deux calques : couleur et opacité."""

    def __init__(self, thread_hex, rng):
        w, h = CANVAS_W * S, CANVAS_H * S
        self.color = Image.new("RGB", (w, h), (0, 0, 0))
        self.mask = Image.new("L", (w, h), 0)
        self.dc, self.dm = ImageDraw.Draw(self.color), ImageDraw.Draw(self.mask)
        self.base = hex_rgb(thread_hex)
        self.rng = rng

    def tone(self, factor):
        return tuple(int(np.clip(c * factor, 0, 1) * 255) for c in self.base)

    def thread(self, a, b, width):
        """Un fil de `a` à `b` (en pt), fait de brins, avec le reflet soyeux du fil à broder."""
        ax, ay = a
        bx, by = b
        length = max(1e-6, math.hypot(bx - ax, by - ay))
        dx, dy = (bx - ax) / length, (by - ay) / length
        # Côté éclairé (lumière en haut à gauche)
        px, py = -dy, dx
        if px + py > 0:
            px, py = -px, -py
        shade = 0.88 + 0.16 * self.rng.random()
        pt = lambda x, y: (x * S, y * S)
        self.dc.line([pt(ax, ay), pt(bx, by)], fill=self.tone(shade), width=max(1, int(width * S)))
        self.dm.line([pt(ax, ay), pt(bx, by)], fill=255, width=max(1, int(width * S)))
        # Deux brins visibles : un creux sombre au milieu du fil
        self.dc.line([pt(ax, ay), pt(bx, by)], fill=self.tone(shade * 0.78), width=max(1, int(width * 0.14 * S)))
        # Reflet : une ligne claire, plus courte, du côté de la lumière
        o = width * 0.26
        trim = 0.18
        h0 = (ax + dx * length * trim + px * o, ay + dy * length * trim + py * o)
        h1 = (bx - dx * length * trim + px * o, by - dy * length * trim + py * o)
        self.dc.line([pt(*h0), pt(*h1)], fill=self.tone(min(1.6, shade * 1.45)), width=max(1, int(width * 0.22 * S)))

    def layers(self):
        return (
            np.asarray(self.color, dtype=np.float32) / 255,
            np.asarray(self.mask, dtype=np.float32) / 255,
        )


def satin_stitches(needle, kind):
    """Le motif, au point passé : des fils serrés qui traversent tout le trait."""
    for pts, hw0, hw1 in motif_strokes(kind):
        lengths = [0.0]
        for (xa, ya), (xb, yb) in zip(pts, pts[1:]):
            lengths.append(lengths[-1] + math.hypot(xb - xa, yb - ya))
        total = lengths[-1]
        next_at, i = 0.0, 0
        while next_at <= total:
            while i < len(pts) - 2 and lengths[i + 1] < next_at:
                i += 1
            (xa, ya), (xb, yb) = pts[i], pts[i + 1]
            seg = max(1e-6, lengths[i + 1] - lengths[i])
            t = (next_at - lengths[i]) / seg
            px, py = xa + (xb - xa) * t, ya + (yb - ya) * t
            tx, ty = (xb - xa) / seg, (yb - ya) / seg
            nx, ny = -ty, tx
            hw = hw0 + (hw1 - hw0) * (next_at / total)
            # Bouts arrondis : le trait s'amincit un peu sur ses derniers 0,9 pt, sans
            # s'effilocher (en dessous de 70 % de largeur, les fils s'écartaient en pinceau)
            edge = min(next_at, total - next_at)
            if hw0 == hw1 and edge < 0.9:
                hw *= 0.7 + 0.3 * math.sqrt(edge / 0.9)
            # Fils à peine obliques ; bien droits aux bouts pour ne pas s'écarter
            skew = 0.18 if edge > 1.2 else 0.0
            sx, sy = nx + tx * skew, ny + ty * skew
            needle.thread((px - sx * hw, py - sy * hw), (px + sx * hw, py + sy * hw), 0.52)
            next_at += 0.42


def running_stitch_border(needle):
    """Surpiqûre au point avant sur TOUT le tour du ruban : haut, côtés, et le V."""
    i = BORDER_INSET
    left, right = RIBBON_X + i, RIBBON_X + RIBBON_W - i
    center = RIBBON_X + RIBBON_W / 2
    top = TOP + 3.2
    # Le V : les deux pointes descendent à TAIL_END, le creux remonte de NOTCH.
    # La ligne intérieure suit ces bords à `i` de distance (la pente du V écarte un
    # peu plus verticalement).
    slope = NOTCH / (RIBBON_W / 2)
    lift = i * math.sqrt(1 + slope * slope)
    tail = TAIL_END - lift - i * slope
    notch = TAIL_END - NOTCH - lift
    outline = [(left, top), (right, top), (right, tail), (center, notch), (left, tail), (left, top)]

    # Fil de 1,5 pt, espace de 1 pt, posé le long du contour fermé
    lengths = [0.0]
    for (xa, ya), (xb, yb) in zip(outline, outline[1:]):
        lengths.append(lengths[-1] + math.hypot(xb - xa, yb - ya))
    total = lengths[-1]
    period = 2.5
    count = int(total / period)
    period = total / count  # tombe juste : pas de demi-point à la jonction

    def at(d):
        d %= total
        k = max(j for j in range(len(lengths) - 1) if lengths[j] <= d)
        (xa, ya), (xb, yb) = outline[k], outline[k + 1]
        t = (d - lengths[k]) / max(1e-6, lengths[k + 1] - lengths[k])
        return (xa + (xb - xa) * t, ya + (yb - ya) * t)

    for n in range(count):
        start = n * period
        needle.thread(at(start), at(start + period * 0.6), 0.6)


def relief_and_shadow(color, alpha, strength):
    """Fils bombés (reflet en haut à gauche, creux en bas à droite) et ombre sur le ruban."""
    step = int(0.3 * S)
    up = np.roll(np.roll(alpha, -step, 0), -step, 1)
    down = np.roll(np.roll(alpha, step, 0), step, 1)
    relief = np.clip(alpha - down, 0, 1) * 0.35 * strength - np.clip(alpha - up, 0, 1) * 0.32 * strength
    # Bord matelassé : le point passé est rembourré, ses bords plongent un peu
    padded = np.clip(alpha - blur(alpha, 0.45), 0, 1) * 0.35 * strength
    color = np.clip(color * (1 + relief[..., None] - padded[..., None]), 0, 1)
    shadow = blur(np.roll(np.roll(alpha, int(0.6 * S), 0), int(0.45 * S), 1), 0.45) * 0.65 * strength
    return color, shadow


def embroidery(kind, thread_hex, rng):
    """Motif et surpiqûre : couleur, opacité, et ombre portée des fils sur le ruban."""
    needle = Needle(thread_hex, rng)
    running_stitch_border(needle)
    satin_stitches(needle, kind)
    color, alpha = needle.layers()
    color, shadow = relief_and_shadow(color, alpha, 1.0)
    return color, alpha, shadow


def render(name, spec, rng):
    mask = ribbon_mask()
    light = ribbon_shading(rng)

    h = CANVAS_H * S
    top, bottom = hex_rgb(spec["ribbon"][0]), hex_rgb(spec["ribbon"][1])
    t = (np.arange(h, dtype=np.float32) / S - TOP) / (TAIL_END - TOP)
    base = top[None, :] + (bottom - top)[None, :] * np.clip(t, 0, 1)[:, None]
    rgb = np.clip(base[:, None, :] * light[..., None], 0, 1)

    thread, thread_a, thread_shadow = embroidery(spec["motif"], spec["thread"], rng)
    rgb = rgb * (1 - thread_shadow[..., None] * mask[..., None])
    rgb = rgb * (1 - thread_a[..., None]) + thread * thread_a[..., None]

    # Ombre du ruban : plus nette sur la couverture (il est posé dessus)
    shadow = blur(np.roll(np.roll(mask, int(0.9 * S), 0), int(0.7 * S), 1), 1.4) * 0.3
    alpha = np.clip(mask + shadow * (1 - mask), 0, 1)
    shadow_only = (1 - mask) * shadow
    # Là où il n'y a que l'ombre, la couleur est l'ombre elle-même (noyer très sombre)
    ink = hex_rgb("#1e140e")
    rgb = (rgb * mask[..., None] + ink * shadow_only[..., None]) / np.maximum(alpha[..., None], 1e-4)

    rgba = np.dstack([np.clip(rgb, 0, 1), alpha])
    img = Image.fromarray((rgba * 255).astype(np.uint8))
    for scale in (2, 3):
        size = (CANVAS_W * scale, CANVAS_H * scale)
        path = OUT / f"ribbon-{name}@{scale}x.png"
        img.resize(size, Image.LANCZOS).save(path, optimize=True)
        print(path.name, path.stat().st_size // 1024, "Ko")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for name, spec in VARIANTS.items():
        render(name, spec, np.random.default_rng(3))
