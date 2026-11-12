/**
 * Combien de pages ? Le total de mon édition, quand personne ne le connaît.
 *
 *    Combien de pages ?
 *
 *             320 p.                la règle de Ma page, sur le nombre de pages
 *    ·············●·······
 *    [ Continuer ]
 *
 * Seulement si « On lit quoi ? » n'a rien trouvé (ni Google, ni Open Library,
 * ni une autre édition du titre) : d'habitude le total arrive avec le livre.
 * Un écran = une question (Lea, 2026-11-12) : le total ici, ma position à
 * « Où en est ta lecture ? », jamais les deux sur la même règle.
 */

import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Button3D from '../../components/Button3D';
import OnboardingScreen, { rise } from '../../components/onboarding/OnboardingScreen';
import PageRuler from '../../components/ui/PageRuler';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { nextStep } from '../../utils/onboardingFlow';

/** Plafond de la règle du total de pages (le même qu'à « Où en est ta lecture ? ») */
const MAX_PAGES = 2000;
/** La hauteur du compteur et de sa règle */
const RULER_H = 200;

export default function TotalScreen() {
  const router = useRouter();
  const flow = useOnboardingStore((s) => s.flow);
  const book = useOnboardingStore((s) => s.book);
  const patch = useOnboardingStore((s) => s.patch);

  if (!book) return null;

  return (
    <OnboardingScreen
      step="total"
      title="Combien de pages ?"
      accent="pages"
      footer={
        <Button3D
          variant="primary"
          disabled={book.pages === 0}
          onPress={() => router.push(nextStep(flow, 'livre'))}
          style={styles.wide}
        >
          Continuer
        </Button3D>
      }
    >
      <Animated.View entering={rise(1)} style={styles.ruler}>
        <View style={styles.rulerBox}>
          <PageRuler
            currentPage={book.pages}
            totalPages={MAX_PAGES}
            onPageChange={(pages) => patch({ book: { ...book, pages }, start: 0 })}
            unit="count"
            fontSize={80}
          />
        </View>
      </Animated.View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  wide: {
    width: '100%',
  },
  ruler: {
    flex: 1,
    justifyContent: 'center',
  },
  rulerBox: {
    height: RULER_H,
  },
});
