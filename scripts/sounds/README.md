# Sons de l'app (#160)

Les sons de `assets/sounds/` sont fabriqués ici, hors de l'app, puis rangés en `.wav`.

- `matieres.mjs` : première série (crayon, carton, tampon, marimba, marque-page…), synthétisée.
- `matieres-v2.mjs` : sons refaits (bulle, pichenette, livre qu'on referme), dont des enregistrements CC0 de Kenney (RPG Audio, https://kenney.nl/assets/rpg-audio) convertis en `.wav` dans un dossier `samples/`.

```bash
npm i --no-save node-web-audio-api
node scripts/sounds/matieres.mjs <dossier de sortie> [nom]
node scripts/sounds/matieres-v2.mjs <dossier de sortie> x <dossier samples> [nom]
```

Correspondance avec `utils/feel.ts` : tic = crayon, appui = carton, valider = tampon, poster = note-bulle, reagir = reaction, lue = lue-pichenette, fermer = fermer, objectif = reussite, serie = marque-page, depasser = depasser, fini = fin-referme, erreur = erreur.
