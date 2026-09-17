"""
Génère les textures d'aquarelle de l'app (assets/images/watercolor/).

Chaque texture est BLANCHE : seule sa transparence porte le dessin (la densité du
pigment). L'app la teinte avec une couleur (`tintColor` d'expo-image), donc une
même texture sert pour toutes les couleurs.

Textures produites :
- corner-wash.png  : lavis léger pour un coin de sheet (couleur principale) ;
- corner-bleed.png : deuxième couleur coulée dans le même lavis encore mouillé,
                     vers le bas à gauche. Même taille, même contour : les deux
                     couches se superposent exactement.

Ce qui fait aquarelle, en restant LÉGER (DESIGN.md › Direction artistique) :
- contour irrégulier mais net, déformé par un bruit fractal ;
- un filet de pigment discret au bord, là où le lavis a séché ;
- densité qui varie lentement, auréoles claires, grain fin du papier ;
- couleurs qui se fondent, sans bord net entre elles.

Usage : python3 scripts/generate-watercolor.py
Dépendances : numpy, Pillow.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "assets" / "images" / "watercolor"
W, H = 720, 560
SEED = 5


def value_noise(rng, cell):
    gw, gh = max(2, W // cell + 2), max(2, H // cell + 2)
    grid = (rng.random((gh, gw)) * 255).astype(np.uint8)
    img = Image.fromarray(grid).resize((gw * cell, gh * cell), Image.BICUBIC)
    return np.asarray(img, dtype=np.float32)[:H, :W] / 255.0


def fractal(rng, base_cell, octaves=5):
    total, amp, norm, cell = np.zeros((H, W), np.float32), 1.0, 0.0, base_cell
    for _ in range(octaves):
        total += amp * value_noise(rng, max(2, cell))
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
    wx, wy = fractal(rng, 220) - 0.5, fractal(rng, 220) - 0.5
    dx = (nx + wx * warp - cx) / rx
    dy = (ny + wy * warp - cy) / ry
    return 1.0 - np.sqrt(dx * dx + dy * dy)


def grain(rng):
    return 0.8 + blur(rng.random((H, W)).astype(np.float32), 0.8) * 0.4


def save(alpha, name):
    la = np.zeros((H, W, 2), np.uint8)
    la[..., 0] = 255
    la[..., 1] = (np.clip(alpha, 0, 1) * 255).astype(np.uint8)
    path = OUT / name
    Image.fromarray(la).save(path, optimize=True)
    print(path.name, path.stat().st_size // 1024, "Ko")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(SEED)

    # ── Le lavis ──
    field = ellipse_field(rng, 0.52, 0.48, 0.42, 0.42, 0.28)
    field += (fractal(rng, 60) - 0.5) * 0.08
    shape = blur((field > 0).astype(np.float32), 1.4)
    # Filet de pigment discret : étroit et léger, plus un halo à peine visible
    edge = np.clip(shape - blur(shape, 4), 0, 1) * 1.2 + np.clip(shape - blur(shape, 18), 0, 1) * 0.3

    density = 0.32 + (fractal(rng, 200) - 0.5) * 0.4 + edge
    blooms = blur((fractal(rng, 130) > 0.64).astype(np.float32), 5)
    density -= blur(blooms, 10) * 0.16
    save(shape * density * grain(rng), "corner-wash.png")

    # ── La deuxième couleur, coulée vers le bas à gauche ──
    region = blur(np.clip(ellipse_field(rng, 0.28, 0.74, 0.34, 0.36, 0.4) * 3, 0, 1), 26)
    local = 0.42 + (fractal(rng, 180) - 0.5) * 0.4 + edge
    save(shape * region * local * grain(rng), "corner-bleed.png")
