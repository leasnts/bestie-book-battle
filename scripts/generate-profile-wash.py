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
- pas de grain ni de granulation : essayés, jugés pas beaux (Lea, 2026-10-23).

Variante « login » (2026-10-28) : le fond plein écran de la connexion, en
surtout rouge et chocolat, avec une touche de beurre et de beige pour avoir
toute la palette ; jamais sous le titre ni les boutons (contraste du crème) →
assets/images/watercolor/login-wash.png.

Usage : python3 scripts/generate-profile-wash.py [login]
Dépendances : numpy, Pillow.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

LOGIN = len(sys.argv) > 1 and sys.argv[1] == "login"
OUT = Path(__file__).resolve().parent.parent / "assets" / "images" / "watercolor" / ("login-wash.png" if LOGIN else "profile-wash.png")
# 390 × 400 pt en @3x : la largeur d'un iPhone, la hauteur de l'en-tête ;
# la connexion : un écran entier (402 × 874 pt), en @2x, l'aquarelle est floue
W, H = (804, 1748) if LOGIN else (1170, 1200)
SEED = 11

BUTTER = (np.array([0xF5, 0xE6, 0xA8]), np.array([0xD6, 0xC3, 0x6F]))
RED = (np.array([0xA6, 0x2F, 0x43]), np.array([0x7C, 0x20, 0x31]))
CHOCOLATE_LIGHT = np.array([0x63, 0x3D, 0x32])
CHOCOLATE_DARK = np.array([0x48, 0x2B, 0x24])
BEIGE = np.array([0xC5, 0xA4, 0x7E])


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

    if LOGIN:
        # Fond : chocolat en haut → rouge foncé en bas ; taches rouges et brunes
        base = CHOCOLATE_LIGHT * (1 - ny[..., None]) + RED[1] * ny[..., None]
        blobs = (
            (RED[0], blob(nx, ny, 0.95, 0.10, 0.85, 0.40, 1.0)),
            (CHOCOLATE_LIGHT, blob(nx, ny, 0.05, 0.25, 0.80, 0.35, 1.0)),
            (RED[0], blob(nx, ny, 0.15, 0.62, 0.80, 0.32, 1.0)),
            (CHOCOLATE_LIGHT, blob(nx, ny, 0.95, 0.72, 0.75, 0.32, 1.0)),
            (RED[1], blob(nx, ny, 0.40, 1.00, 0.90, 0.30, 1.0)),
            # Les touches claires, légères : en haut, loin du texte
            (BUTTER[1], 0.75 * blob(nx, ny, 0.30, 0.04, 0.45, 0.14, 1.0)),
            (BEIGE, 0.7 * blob(nx, ny, 1.00, 0.36, 0.40, 0.14, 1.0)),
        )
    else:
        # Fond : beurre foncé en haut → rouge en bas
        base = BUTTER[1] * (1 - ny[..., None]) + RED[0] * ny[..., None]
        # Les taches, posées par-dessus dans l'ordre de la maquette
        blobs = (
            (BUTTER[0], blob(nx, ny, 0.12, 0.10, 0.60, 0.55, 1.0)),
            (RED[0], blob(nx, ny, 0.92, 0.08, 0.55, 0.55, 1.0)),
            (CHOCOLATE_LIGHT, blob(nx, ny, 0.08, 0.95, 0.60, 0.55, 1.0)),
            (RED[1], blob(nx, ny, 0.95, 0.92, 0.60, 0.55, 1.0)),
        )
    color = np.clip(base, 0, 255)

    for tint, weight in blobs:
        color = color * (1 - weight[..., None]) + tint * weight[..., None]

    # Densité du pigment : plus chargé par endroits
    density = fractal(rng, 180)
    color *= (0.92 + 0.12 * density)[..., None]

    # Auréoles : l'eau repousse le pigment, le papier blanchit doucement
    bloom = np.clip((fractal(rng, 320) - 0.45) * 2.2, 0, 1) ** 1.6
    # Sur la connexion, plus discrètes : sur un fond sombre elles grisaillent
    halo = 0.10 if LOGIN else 0.22
    color = color * (1 - halo * bloom[..., None]) + 255 * halo * bloom[..., None]

    # Filet de pigment séché au bord des auréoles
    edge = np.abs(np.gradient(Image.fromarray((bloom * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3)), axis=0))
    edge = np.clip(np.asarray(edge, np.float32) / 6.0, 0, 1)
    color *= (1 - 0.10 * edge)[..., None]

    OUT.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.clip(color, 0, 255).astype(np.uint8)).save(OUT, optimize=True)
    print(f"→ {OUT.relative_to(OUT.parent.parent.parent.parent)}")


if __name__ == "__main__":
    main()
