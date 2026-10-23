"""
Génère le fond de l'en-tête du profil (assets/images/watercolor/profile-wash.png).

Le papier aquarelle choisi par Lea le 2026-10-23 : le beurre, le rouge et le
chocolat Lowki (sans beige) posés en grandes taches qui se mêlent, sur un papier
grené. Contrairement aux textures de coin (blanches, teintées par l'app), cette
image porte ses couleurs : c'est un seul fond, toujours le même.

Ce qui fait aquarelle :
- les couleurs se fondent en grandes taches (même placement que la maquette) ;
- la densité du pigment varie lentement, avec des auréoles plus claires là où
  l'eau a repoussé le pigment ;
- un grain fin de papier, plus sombre dans les creux.

Usage : python3 scripts/generate-profile-wash.py
Dépendances : numpy, Pillow.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "assets" / "images" / "watercolor" / "profile-wash.png"
# 390 × 400 pt en @3x : la largeur d'un iPhone, la hauteur de l'en-tête
W, H = 1170, 1200
SEED = 11

BUTTER = (np.array([0xF5, 0xE6, 0xA8]), np.array([0xD6, 0xC3, 0x6F]))
RED = (np.array([0xA6, 0x2F, 0x43]), np.array([0x7C, 0x20, 0x31]))
CHOCOLATE_LIGHT = np.array([0x63, 0x3D, 0x32])


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


def blob(nx, ny, cx, cy, rx, ry, reach):
    """Poids d'une tache radiale : 1 au centre, 0 à `reach` de son rayon"""
    d = np.sqrt(((nx - cx) / rx) ** 2 + ((ny - cy) / ry) ** 2)
    t = np.clip(d / reach, 0, 1)
    return (1 - t) ** 2


def main():
    rng = np.random.default_rng(SEED)
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    nx, ny = x / W, y / H

    # Les bords des taches ondulent comme de l'eau, pas des cercles parfaits
    wx, wy = (fractal(rng, 260) - 0.5) * 0.18, (fractal(rng, 260) - 0.5) * 0.18
    nx, ny = nx + wx, ny + wy

    # Fond : beurre foncé en haut → rouge en bas
    base = BUTTER[1] * (1 - ny[..., None]) + RED[0] * ny[..., None]
    color = np.clip(base, 0, 255)

    # Les taches, posées par-dessus dans l'ordre de la maquette
    for tint, weight in (
        (BUTTER[0], blob(nx, ny, 0.12, 0.10, 0.60, 0.55, 1.0)),
        (RED[0], blob(nx, ny, 0.92, 0.08, 0.55, 0.55, 1.0)),
        (CHOCOLATE_LIGHT, blob(nx, ny, 0.08, 0.95, 0.60, 0.55, 1.0)),
        (RED[1], blob(nx, ny, 0.95, 0.92, 0.60, 0.55, 1.0)),
    ):
        color = color * (1 - weight[..., None]) + tint * weight[..., None]

    # Densité du pigment : plus chargé par endroits
    density = fractal(rng, 180)
    color *= (0.92 + 0.12 * density)[..., None]

    # Auréoles : l'eau repousse le pigment, le papier blanchit doucement
    bloom = np.clip((fractal(rng, 320) - 0.45) * 2.2, 0, 1) ** 1.6
    color = color * (1 - 0.22 * bloom[..., None]) + 255 * 0.22 * bloom[..., None]

    # Filet de pigment séché au bord des auréoles
    edge = np.abs(np.gradient(Image.fromarray((bloom * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3)), axis=0))
    edge = np.clip(np.asarray(edge, np.float32) / 6.0, 0, 1)
    color *= (1 - 0.10 * edge)[..., None]

    # Granulation : le pigment se dépose en petits amas dans le grain
    granules = fractal(rng, 10, octaves=2)
    color *= (0.95 + 0.08 * granules)[..., None]

    # Grain du papier : fin, plus sombre dans les creux
    grain = np.asarray(
        Image.fromarray((rng.random((H, W)) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8)),
        np.float32,
    ) / 255.0
    color *= (0.90 + 0.14 * grain)[..., None]

    OUT.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.clip(color, 0, 255).astype(np.uint8)).save(OUT, optimize=True)
    print(f"→ {OUT.relative_to(OUT.parent.parent.parent.parent)}")


if __name__ == "__main__":
    main()
