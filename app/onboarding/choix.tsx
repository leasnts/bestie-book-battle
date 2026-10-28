/**
 * Commencer ou rejoindre ? Le choix de la V1, gardé : juste après la
 * connexion (ou au « + » pour ajouter un livre), on lance sa lecture ou on
 * rejoint celle de quelqu'un avec son code. Toucher une carte suffit.
 * Les liens d'invitation, eux, passent directement à l'invitation.
 */

import { useRouter } from 'expo-router';
import { BookPlusIcon, ChevronRightIcon, MailOpenIcon, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import OnboardingScreen, { rise } from '../../components/onboarding/OnboardingScreen';
import PressableScale from '../../components/ui/PressableScale';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { colors, fonts, inkAlpha, shadowAlpha, spacing } from '../../utils/constants';
import { feel } from '../../utils/feel';
import { firstStep, isAddFlow } from '../../utils/onboardingFlow';

export default function ChoixScreen() {
  const router = useRouter();
  const adding = useOnboardingStore((s) => isAddFlow(s.flow));

  const start = () => {
    feel('tic');
    const flow = adding ? 'add' : 'create';
    useOnboardingStore.getState().patch({ flow });
    router.push(firstStep(flow));
  };

  const join = () => {
    feel('tic');
    useOnboardingStore.getState().patch({ flow: adding ? 'addJoin' : 'join' });
    router.push('/onboarding/code');
  };

  return (
    <OnboardingScreen step="choix" title="Ta lecture" accent="lecture">
      <View style={styles.cards}>
        <Animated.View entering={rise(1)}>
          <Choice icon={BookPlusIcon} title="Commencer une lecture" hint="Je choisis le livre" onPress={start} />
        </Animated.View>
        <Animated.View entering={rise(2)}>
          <Choice icon={MailOpenIcon} title="Rejoindre une lecture" hint="J'ai un code" onPress={join} />
        </Animated.View>
      </View>
    </OnboardingScreen>
  );
}

/** Une carte de papier qu'on touche pour choisir */
function Choice({ icon: Icon, title, hint, onPress }: { icon: LucideIcon; title: string; hint: string; onPress: () => void }) {
  return (
    <PressableScale style={styles.card} pressedScale={0.98} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${title}. ${hint}`}>
      <Icon size={26} color={colors.textPrimary} strokeWidth={1.8} />
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
      <ChevronRightIcon size={20} color={colors.textTertiary} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  cards: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: inkAlpha(0.08),
    shadowColor: shadowAlpha(1),
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 17,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: colors.textSecondary,
  },
});
