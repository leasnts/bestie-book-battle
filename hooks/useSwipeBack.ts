/**
 * useSwipeBack — Hook de navigation retour par glissement horizontal
 *
 * Crée un gesture Pan qui appelle router.back() quand l'utilisateur
 * glisse dans la direction indiquée avec assez de vitesse et de distance.
 *
 * Utilisation :
 *   const swipeGesture = useSwipeBack('left');   // swipe gauche → retour
 *   const swipeGesture = useSwipeBack('right');  // swipe droit  → retour
 *
 * Puis :
 *   <GestureDetector gesture={swipeGesture}>
 *     <View>...</View>
 *   </GestureDetector>
 *
 * Paramètre `direction` :
 * - 'left'  → glisser vers la gauche ferme la page (ex: page Profil)
 * - 'right' → glisser vers la droite ferme la page (ex: page Activité)
 */

import { useCallback } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

// Seuils pour valider le swipe (distance minimale + vitesse minimale)
const MIN_TRANSLATION = 60;  // pixels
const MIN_VELOCITY    = 250; // pixels/seconde

export function useSwipeBack(direction: 'left' | 'right') {
  const router = useRouter();

  // Mémorise la position Y de départ pour vérifier que le geste
  // est bien horizontal (pas un scroll vertical déguisé)
  const startY = useSharedValue(0);

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  const swipeGesture = Gesture.Pan()
    // Le gesture ne s'active qu'après 25px de mouvement horizontal :
    // ça évite qu'un tap ou un micro-glissement déclenche la navigation.
    .activeOffsetX([-25, 25])
    // S'il y a plus de 20px de mouvement vertical en premier,
    // le gesture s'annule (pas de conflit avec un éventuel scroll vertical).
    .failOffsetY([-20, 20])
    .onBegin((event) => {
      startY.set(event.y);
    })
    .onEnd((event) => {
      const tx = event.translationX;
      const vx = event.velocityX;

      if (direction === 'left') {
        // Swipe vers la gauche (translationX négatif)
        if (tx < -MIN_TRANSLATION && vx < -MIN_VELOCITY) {
          runOnJS(goBack)();
        }
      } else {
        // Swipe vers la droite (translationX positif)
        if (tx > MIN_TRANSLATION && vx > MIN_VELOCITY) {
          runOnJS(goBack)();
        }
      }
    });

  return swipeGesture;
}
