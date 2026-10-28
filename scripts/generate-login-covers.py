"""
Le mur de couvertures de l'écran de connexion : des livres du catalogue
Explorer, passés en rouge ton sur ton (bichromie entre deux rouges proches du
fond), empilés en 4 colonnes qui défilent à l'écran.

    python3 scripts/generate-login-covers.py

Sortie : assets/images/login/covers-1.png … covers-4.png, une bande verticale
par colonne. Chaque bande se raccorde à elle-même : posée deux fois l'une sous
l'autre, elle défile en boucle sans couture.
"""

import io
import json
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets/images/login"

TITLES = [
    "Fourth Wing", "Les Sept Maris d’Evelyn Hugo", "Babel", "Heartstopper",
    "Le Prince cruel", "Jamais plus", "Verity", "Book Lovers",
    "Love Hypothesis", "Changer l’eau des fleurs", "La Tresse", "Katabasis",
    "Là où chantent les écrevisses", "Demain, et demain, et demain",
    "Il est grand temps de rallumer les étoiles", "Ugly Love",
]
COLUMNS = 4

# Une couverture fait 112 pt de large à l'écran, rendue en @3x.
COVER_W, COVER_H = 336, 504
GAP = 42
RADIUS = 18

# Bichromie : du rouge foncé (ombres) au rouge clair (lumières), autour du fond
# #A62F43 → #92293B. L'écart reste faible : on devine les livres, sans plus.
DARK = np.array([0x6E, 0x1F, 0x2C])
LIGHT = np.array([0xC2, 0x4A, 0x5D])


def covers():
    catalog = json.loads((ROOT / "constants/exploreCatalog.json").read_text())
    found = {}

    def walk(o):
        if isinstance(o, dict):
            url = next((v for k, v in o.items() if "cover" in k.lower() and isinstance(v, str)), None)
            if o.get("title") in TITLES and url:
                found.setdefault(o["title"], url)
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)

    walk(catalog)
    return [found[t] for t in TITLES if t in found]


def tone(url):
    # Les vignettes Apple Books acceptent n'importe quelle taille dans l'URL
    url = url.rsplit("/", 1)[0] + f"/{COVER_W * 2}x{COVER_H * 2}bb.jpg"
    img = Image.open(io.BytesIO(urllib.request.urlopen(url).read())).convert("L")
    img = img.resize((COVER_W, COVER_H), Image.LANCZOS)
    lum = np.asarray(img, dtype=np.float32)[..., None] / 255
    rgb = (DARK + (LIGHT - DARK) * lum).astype(np.uint8)
    out = Image.fromarray(rgb).convert("RGBA")
    mask = Image.new("L", out.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, COVER_W - 1, COVER_H - 1), RADIUS, fill=255)
    out.putalpha(mask)
    return out


def main():
    urls = covers()
    tiles = [tone(u) for u in urls]
    OUT.mkdir(parents=True, exist_ok=True)
    per = len(tiles) // COLUMNS
    for c in range(COLUMNS):
        col = tiles[c::COLUMNS][:per]
        strip = Image.new("RGBA", (COVER_W, per * (COVER_H + GAP)), (0, 0, 0, 0))
        for i, t in enumerate(col):
            strip.paste(t, (0, i * (COVER_H + GAP)), t)
        # Bichromie : 128 teintes suffisent, le fichier pèse trois fois moins
        strip.quantize(128, method=Image.Quantize.FASTOCTREE).save(OUT / f"covers-{c + 1}.png", optimize=True)
    print(f"{len(tiles)} couvertures, {COLUMNS} colonnes de {per}")


if __name__ == "__main__":
    main()
