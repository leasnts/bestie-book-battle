# Vidéo d'en-tête App Store

Bandeau vidéo en haut de la fiche App Store : 3840 × 1646 (21:9), 30 i/s, 10 s en boucle.

- `npm install` puis `npm run studio` pour la retoucher en direct.
- `npm run render` pour sortir `out/store-header.mp4`.
- La police Welcome Valentines n'est pas dans git (licence perso, #129) : la copier dans `public/fonts/WelcomeValentines.ttf`.
- Captures dans `public/screens/` : simulateur iPhone 17, heure 9:41 (`simctl status_bar`), bouton Expo masqué.
- Le centre (1646 × 661) est la zone visible sur tous les appareils : le nom y reste.
