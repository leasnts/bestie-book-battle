"""
Génère le fond aquarelle de la rangée des genres (assets/images/watercolor/genres-wash.jpg).

Même papier que l'en-tête du profil (scripts/generate-profile-wash.py, Lea
2026-10-23) : le rouge, le chocolat et un peu de beurre Lowki en grandes taches
qui se mêlent, avec des auréoles. Une seule bande, aussi longue que la rangée :
chaque carte en montre sa tranche, et la rangée se lit comme une seule
aquarelle découpée.

Le nom des genres est en blanc, en haut des cartes : le beurre ne monte
jamais dans le haut de la bande, pour que le blanc se lise partout.

Usage : python3 scripts/generate-genre-wash.py
Dépendances : numpy, Pillow.
"""

from pathlib import Path

import numpy as np
from PIL import Image

OUT = Path(__file__).resolve().parent.parent / "assets" / "images" / "watercolor" / "genres-wash.jpg"
# 14 cartes de 156 pt + 13 écarts de 12 pt, en @2x (l'aquarelle est floue : pas besoin de @3x)
CARDS, CARD_W, GAP, CARD_H = 14, 156, 12, 88
SCALE = 2
W, H = (CARDS * CARD_W + (CARDS - 1) * GAP) * SCALE, CARD_H * SCALE
SEED = 7

BUTTER = np.array([0xD6, 0xC3, 0x6F])
RED = np.array([0xA6, 0x2F, 0x43])
RED_DARK = np.array([0x7C, 0x20, 0x31])
CHOCOLATE = np.array([0x63, 0x3D, 0x32])


def value_noise(rng, cell):
    gw, gh = max(2, W // cell + 2), max(2, H // cell + 2)
    grid = (rng.random((gh, gw)) * 255).astype(np.uint8)
    img = Image.fromarray(grid).resize((gw * cell, gh * cell), Image.BICUBIC)
    return np.asarray(img, dtype=np.float32)[:H, :W] / 255.0


def fractal(rng, base_cell, octaves=4):
    total, amp, norm, cell = np.zeros((H, W), np.float32), 1.0, 0.0, base_cell
    for _ in range(octaves):
        total += amp * value_noise(rng, max(2, cell))
        norm += amp
        amp *= 0.5
        cell //= 2
    return total / norm


def main():
    rng = np.random.default_rng(SEED)
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    # Coordonnées en points de carte : les taches gardent la même taille quelle que soit la longueur
    px, py = x / SCALE, y / SCALE

    # Les bords ondulent comme de l'eau
    px = px + (fractal(rng, 200) - 0.5) * 50
    py = py + (fractal(rng, 200) - 0.5) * 24

    color = np.broadcast_to(RED, (H, W, 3)).astype(np.float32).copy()

    # Grandes taches qui se mêlent, à l'échelle de l'en-tête du profil : une
    # tous les ~130 pt, en alternance chocolat / beurre / rouge foncé. Le beurre
    # reste en bas (le nom blanc est en haut), le chocolat va en haut ou en bas.
    spots = int(W / SCALE / 130) + 2
    for i in range(spots):
        cx = (i + rng.uniform(-0.2, 0.2)) * 130
        kind = i % 3
        if kind == 0:
            tint, cy, r, strength = CHOCOLATE, rng.choice([0, CARD_H]), rng.uniform(130, 170), 1.0
        elif kind == 1:
            tint, cy, r, strength = BUTTER, CARD_H * 0.95, rng.uniform(120, 150), 1.0
        else:
            tint, cy, r, strength = RED_DARK, rng.uniform(0, CARD_H), rng.uniform(100, 140), 0.8
        d = np.sqrt(((px - cx) / r) ** 2 + ((py - cy) / (r * 0.8)) ** 2)
        w = strength * np.clip(1 - d, 0, 1) ** 1.2
        color = color * (1 - w[..., None]) + tint * w[..., None]

    # Densité du pigment
    density = fractal(rng, 140)
    color *= (0.94 + 0.1 * density)[..., None]

    # Auréoles claires, discrètes
    bloom = np.clip((fractal(rng, 160) - 0.5) * 2.2, 0, 1) ** 1.6
    color = color * (1 - 0.14 * bloom[..., None]) + 255 * 0.14 * bloom[..., None]

    OUT.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.clip(color, 0, 255).astype(np.uint8)).save(OUT, quality=88, optimize=True)
    print(f"→ {OUT.name} {W}×{H}")


if __name__ == "__main__":
    main()
