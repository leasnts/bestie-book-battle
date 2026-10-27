"""
Génère le « vrai livre » posé sur chaque couverture : deux calques PNG
transparents, superposés à l'image dans BookCover.

- cover-shade.png  : noir + alpha (ombres : reliure, charnière, bords)
- cover-light.png  : blanc + alpha (lumière : reflet, arête de la charnière)

Deux calques plutôt qu'un : une ombre et un reflet peuvent ainsi se croiser
sans s'annuler, et chacun garde sa couleur (jamais de gris sale sur une
couverture vive).

    python3 scripts/generate-cover-overlay.py [variante] [dossier]

Variantes : broche (mat), pellicule (reflet brillant), grain (papier grené).
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image

W, H = 600, 840  # ratio 50:70 des couvertures de l'app


def gauss(v, mu, sigma):
    return np.exp(-((v - mu) ** 2) / (2 * sigma**2))


def layers(variant: str):
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    u, v = x / W, y / H  # 0..1

    shade = np.zeros((H, W), np.float32)
    light = np.zeros((H, W), np.float32)

    # ── Reliure : le dos s'enroule, le bord gauche s'assombrit
    shade += 0.30 * np.exp(-u / 0.012)
    # le petit renflement du dos, juste avant la charnière
    light += 0.14 * gauss(u, 0.022, 0.010)

    # ── Charnière : un sillon pressé dans le carton, son arête éclairée
    hinge = 0.058
    shade += 0.48 * gauss(u, hinge, 0.0040)
    light += 0.40 * gauss(u, hinge + 0.012, 0.0055)
    # la couverture remonte doucement après le sillon
    shade += 0.10 * np.clip(1 - (u - hinge) / 0.07, 0, 1) * (u > hinge)

    # ── Lumière d'ensemble : venue d'en haut à gauche
    light += 0.10 * np.exp(-(((u - 0.15) / 0.55) ** 2 + ((v - 0.0) / 0.45) ** 2))
    shade += 0.10 * np.clip((u + v - 1.1) / 0.9, 0, 1)

    # ── Bords : le carton s'arrondit, une arête fine prend la lumière en haut
    edge = np.minimum.reduce([W - 1 - x, y, H - 1 - y]) # droite, haut, bas
    shade += 0.22 * np.exp(-edge / 1.6)
    light += 0.18 * np.exp(-y / 2.0) * (u > hinge)

    if variant == 'pellicule':
        # Pelliculage brillant : une bande de reflet en diagonale
        d = u * 0.75 + v * 0.55
        light += 0.30 * gauss(d, 0.36, 0.08)
        light += 0.14 * gauss(d, 0.60, 0.030)

    if variant == 'grain':
        # Papier grené : un grain fin, clair et sombre
        rng = np.random.default_rng(7)
        n = rng.normal(0, 1, (H, W)).astype(np.float32)
        # adoucir d'un pixel pour un grain de papier, pas un bruit numérique
        n = (n + np.roll(n, 1, 0) + np.roll(n, 1, 1) + np.roll(n, (1, 1), (0, 1))) / 2
        light += 0.07 * np.clip(n, 0, None)
        shade += 0.09 * np.clip(-n, 0, None)

    return np.clip(shade, 0, 0.85), np.clip(light, 0, 0.85)


def to_png(alpha, value):
    rgba = np.zeros((H, W, 4), np.uint8)
    rgba[..., :3] = value
    rgba[..., 3] = (alpha * 255).round().astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA')


def main():
    variant = sys.argv[1] if len(sys.argv) > 1 else 'broche'
    out = Path(sys.argv[2] if len(sys.argv) > 2 else Path(__file__).parent.parent / 'assets' / 'images')
    out.mkdir(parents=True, exist_ok=True)
    shade, light = layers(variant)
    to_png(shade, 0).save(out / 'cover-shade.png', optimize=True)
    to_png(light, 255).save(out / 'cover-light.png', optimize=True)
    print(f'✓ {variant} → {out}')


if __name__ == '__main__':
    main()
