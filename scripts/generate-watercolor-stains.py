"""
Génère les textures de la tache d'aquarelle de la bibliothèque
(assets/images/watercolor/).

Une seule flaque, en trois couches EXACTEMENT superposables (même taille, même
contour) :
- wash.png    : la flaque entière, couleur principale ;
- bleed-1.png : une deuxième couleur qui a coulé dans la flaque encore mouillée,
                à droite, sans bord net à l'intérieur ;
- bleed-2.png : une troisième, en bas à gauche.

Chaque texture est BLANCHE : seule sa transparence porte le dessin (la densité du
pigment). L'app la teinte avec une couleur de couverture (`tintColor`), donc les
mêmes textures servent pour toutes les couleurs.

Ce qui imite l'aquarelle :
- contour irrégulier, déformé par un bruit fractal, mais net (une flaque séchée) ;
- pigment accumulé au bord en séchant : bord plus dense que le centre ;
- variations lentes de densité à l'intérieur, auréoles claires cernées de foncé ;
- couleurs qui se fondent l'une dans l'autre (« mouillé sur mouillé ») ;
- grain fin du papier.

Usage : python3 scripts/generate-watercolor-stains.py
Dépendances : numpy, Pillow.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "assets" / "images" / "watercolor"
W, H = 1000, 400
SEED = 11


def value_noise(rng, w, h, cell):
    """Bruit lisse : une grille aléatoire agrandie en bicubique."""
    gw, gh = max(2, w // cell + 2), max(2, h // cell + 2)
    grid = (rng.random((gh, gw)) * 255).astype(np.uint8)
    img = Image.fromarray(grid).resize((gw * cell, gh * cell), Image.BICUBIC)
    return np.asarray(img, dtype=np.float32)[:h, :w] / 255.0


def fractal(rng, base_cell, octaves=5):
    total, amp, norm, cell = np.zeros((H, W), np.float32), 1.0, 0.0, base_cell
    for _ in range(octaves):
        total += amp * value_noise(rng, W, H, max(2, cell))
        norm += amp
        amp *= 0.5
        cell //= 2
    return total / norm


def blur(a, radius):
    img = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))
    return np.asarray(img.filter(ImageFilter.GaussianBlur(radius)), dtype=np.float32) / 255.0


def ellipse_field(rng, cx, cy, rx, ry, warp):
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    nx, ny = x / W, y / H
    wx, wy = fractal(rng, 260) - 0.5, fractal(rng, 260) - 0.5
    dx = (nx + wx * warp - cx) / rx
    dy = (ny + wy * warp - cy) / ry
    return 1.0 - np.sqrt(dx * dx + dy * dy)


def grain(rng):
    return 0.72 + blur(rng.random((H, W)).astype(np.float32), 0.8) * 0.56


def to_png(alpha, name):
    la = np.zeros((H, W, 2), np.uint8)
    la[..., 0] = 255
    la[..., 1] = (np.clip(alpha, 0, 1) * 255).astype(np.uint8)
    path = OUT / name
    Image.fromarray(la).save(path, optimize=True)
    print(path.name, path.stat().st_size // 1024, "Ko")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(SEED)

    # ── La flaque ──
    field = ellipse_field(rng, 0.5, 0.5, 0.4, 0.38, 0.2)
    field += (fractal(rng, 70) - 0.5) * 0.08  # léger tremblé du bord
    shape = blur((field > 0).astype(np.float32), 1.2)
    # Pigment au bord : un filet étroit et dense, plus un halo large et léger
    edge = np.clip(shape - blur(shape, 4), 0, 1) * 2.2 + np.clip(shape - blur(shape, 16), 0, 1) * 0.5

    density = 0.28 + (fractal(rng, 200) - 0.5) * 0.5
    density += edge
    blooms = blur((fractal(rng, 140) > 0.63).astype(np.float32), 4)
    bloom_core = blur(blooms, 9)
    density -= bloom_core * 0.18
    density += np.clip(blooms - bloom_core, 0, 1) * 0.25
    to_png(shape * density * grain(rng), "wash.png")

    # ── Les couleurs qui coulent dans la flaque ──
    # Pas de bord net à l'intérieur : une région très floue, coupée au contour de
    # la flaque, avec le même pigment accumulé là où elle touche le bord.
    for name, (cx, cy, rx, ry) in {
        "bleed-1.png": (0.78, 0.42, 0.3, 0.55),
        "bleed-2.png": (0.24, 0.78, 0.26, 0.45),
    }.items():
        region = ellipse_field(rng, cx, cy, rx, ry, 0.45)
        region = blur(np.clip(region * 3, 0, 1), 22)
        local = 0.45 + (fractal(rng, 180) - 0.5) * 0.5 + edge
        to_png(shape * region * local * grain(rng), name)
