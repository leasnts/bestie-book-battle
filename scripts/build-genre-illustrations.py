"""
Prépare les illustrations des genres de l'onglet Explorer (assets/images/genres/).

Les originaux de Lea (aquarelles en niveaux de gris, fond transparent) deviennent
des masques : blancs, l'opacité suit la densité de l'encre (plus c'est foncé,
plus c'est opaque). L'app les teinte (`tintColor`) pour le ton sur ton : la
texture de l'aquarelle reste, la couleur vient du cadre.

Usage : python3 scripts/build-genre-illustrations.py ~/Desktop/BBB/Illustration
Dépendances : numpy, Pillow.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image

OUT = Path(__file__).resolve().parent.parent / "assets" / "images" / "genres"
# ~110 pt de haut dans l'app, en @3x
SIZE = 360

SOURCES = {
    "contemporary": "Tasse fumante.png",
    "thriller": "Empreinte digitale.png",
    "fantasy": "Château et lune.png",
    "feel-good": "Soleil.png",
    "science-fiction": "Fusée.png",
    "romance": "Cœur.png",
    "historical": "Sablier.png",
    "classics": "Plume d’écriture.png",
    "horror": "Fantôme.png",
    "young-adult": "Cartable.png",
    "comics": "Bulles de dialogue.png",
    "romantasy": "Couronne.png",
    "self-help": "Jeune pousse.png",
    "nonfiction": "Encrier.png",
}


def main(src: Path):
    OUT.mkdir(parents=True, exist_ok=True)
    for key, name in SOURCES.items():
        im = Image.open(src / name).convert("RGBA")
        im = im.crop(im.getbbox())
        im.thumbnail((SIZE, SIZE), Image.LANCZOS)
        rgba = np.asarray(im, dtype=np.float32) / 255
        ink = 1 - (0.299 * rgba[..., 0] + 0.587 * rgba[..., 1] + 0.114 * rgba[..., 2])
        # Le blanc de l'aquarelle garde un peu de matière, le noir est plein
        alpha = rgba[..., 3] * np.clip(0.15 + 0.85 * ink, 0, 1)
        out = np.dstack([np.ones_like(alpha), np.ones_like(alpha), np.ones_like(alpha), alpha])
        Image.fromarray((out * 255).astype(np.uint8)).save(OUT / f"{key}.png", optimize=True)
        print(f"✓ {key}")


if __name__ == "__main__":
    main(Path(sys.argv[1]).expanduser())
