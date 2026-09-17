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
- le pli au sommet : le ruban passe par-dessus le bord, reflet puis ombre ;
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
CANVAS_W, CANVAS_H = 30, 62
RIBBON_X, RIBBON_W = 5, 19      # ruban de 19 pt de large
TOP = 1.5                        # haut du pli
COVER_TOP = 9                    # bord haut de la couverture dans l'image
TAIL_END = 56                    # pointe des deux bouts du V
NOTCH = 5.5                      # profondeur du V
ICON_CENTER = (RIBBON_X + RIBBON_W / 2, 38)

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
    # Le pli : le haut du ruban s'arrondit vers l'arrière (plus sombre tout en haut),
    # prend la lumière juste dessous, puis un pli fin là où il passe sur le bord
    light *= 1 - 0.15 * np.exp(-((yp - TOP) ** 2) / 1.2)
    light *= 1 + 0.1 * np.exp(-((yp - (TOP + 2.6)) ** 2) / 1.6)
    light *= 1 - 0.08 * np.exp(-((yp - COVER_TOP) ** 2) / 0.25)
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
        k = 0.62  # pt par unité du dessin Lucide (24 × 24)
        p = [(4, 12), (9, 17), (20, 6)]
        pts = [(cx + (a - 12) * k, cy + (b - 11.5) * k) for a, b in p]
        return [(smooth_polyline(pts, 0.9), 1.45, 1.45)]
    # Étincelle à quatre branches, fines au bout
    strokes = []
    for angle, length in ((-90, 6.0), (90, 6.0), (0, 5.2), (180, 5.2)):
        a = math.radians(angle)
        tip = (cx + math.cos(a) * length, cy + math.sin(a) * length)
        strokes.append((smooth_polyline([(cx, cy), tip], 0), 1.7, 0.2))
    return strokes


def embroidery(kind, thread_hex, rng):
    """Couleur (RGB) et opacité de la broderie, avec relief et ombre portée."""
    w, h = CANVAS_W * S, CANVAS_H * S
    thread = Image.new("RGB", (w, h), (0, 0, 0))
    mask = Image.new("L", (w, h), 0)
    dt, dm = ImageDraw.Draw(thread), ImageDraw.Draw(mask)
    base = hex_rgb(thread_hex)

    for pts, hw0, hw1 in motif_strokes(kind):
        # Longueur cumulée, pour poser un fil tous les 0,32 pt le long du tracé
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
            u = next_at / total
            hw = hw0 + (hw1 - hw0) * u
            # Bouts arrondis : le trait s'amincit sur ses derniers 0,8 pt
            edge = min(next_at, total - next_at)
            if hw0 == hw1 and edge < 0.8:
                hw *= math.sqrt(max(0.05, edge / 0.8))
            # Point passé : fils serrés, à peine obliques, qui traversent tout le trait
            sx, sy = nx + tx * 0.12, ny + ty * 0.12
            a = ((px - sx * hw) * S, (py - sy * hw) * S)
            b = ((px + sx * hw) * S, (py + sy * hw) * S)
            shade = 0.9 + 0.14 * rng.random()
            col = tuple(int(np.clip(c * shade, 0, 1) * 255) for c in base)
            dt.line([a, b], fill=col, width=int(0.46 * S))
            dm.line([a, b], fill=255, width=int(0.46 * S))
            # Le creux entre deux fils : une ligne sombre fine juste après
            ga = (a[0] + tx * 0.18 * S, a[1] + ty * 0.18 * S)
            gb = (b[0] + tx * 0.18 * S, b[1] + ty * 0.18 * S)
            dark = tuple(int(np.clip(c * 0.84, 0, 1) * 255) for c in base)
            dt.line([ga, gb], fill=dark, width=max(1, int(0.08 * S)))
            next_at += 0.32

    color = np.asarray(thread, dtype=np.float32) / 255
    alpha = np.asarray(mask, dtype=np.float32) / 255

    # Relief : chaque fil s'arrondit, reflet en haut à gauche, creux en bas à droite
    up = np.roll(np.roll(alpha, -int(0.25 * S), 0), -int(0.25 * S), 1)
    down = np.roll(np.roll(alpha, int(0.25 * S), 0), int(0.25 * S), 1)
    relief = np.clip(alpha - down, 0, 1) * 0.15 - np.clip(alpha - up, 0, 1) * 0.12
    color = np.clip(color * (1 + relief[..., None]), 0, 1)

    # Ombre portée des fils sur le ruban
    shadow = blur(np.roll(np.roll(alpha, int(0.45 * S), 0), int(0.3 * S), 1), 0.35) * 0.35
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
