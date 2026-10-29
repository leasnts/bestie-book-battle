/**
 * OnboardingScreen — la page commune des écrans à questions de l'onboarding.
 *
 *    ‹        ● ● ● ○ ○ ○ ○         ✕    retour en verre, un nœud par question, fermer (ajout)
 *
 *    Ton 𝓻𝔂𝓽𝓱𝓶𝓮                           titre 30/36, un mot d'accent
 *    …                                     le contenu, en cascade (60 ms)
 *    ⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇⌇   la feuille du pied, bord frangé, toute la largeur
 *    [        Continuer        ]
 *
 * Fond papier uni, celui de l'accueil (`colors.bgApp`). Au centre de l'en-tête,
 * un nœud par question du parcours, ceux de la piste du livre (`GoalTrack`) :
 * rouges jusqu'à la question en cours (un peu plus gros), sable ensuite.
 */

import { useRouter } from 'expo-router';
import { ChevronLeftIcon, XIcon } from 'lucide-react-native';
import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { colors, fonts, motion, spacing } from '../../utils/constants';
import { isAddFlow, stepPosition, type OnboardingStep } from '../../utils/onboardingFlow';
import AccentWord from '../ui/AccentWord';
import GlassButton from '../ui/GlassButton';
import { KnotGradients } from '../ui/GoalTrack';
import TornEdge from './TornEdge';

/** Sur un grand écran (iPhone Duo déplié), l'onboarding garde une largeur de téléphone */
export const ONBOARDING_MAX_W = 520;

/** Taille des titres de l'onboarding (DESIGN.md › Typography, display) */
export const ONBOARDING_TITLE = 30;

/** L'entrée en cascade d'un bloc : `entering={rise(i)}` */
export const rise = (index: number) =>
  FadeInDown.duration(motion.duration.entrance)
    .delay(80 + index * motion.stagger)
    .easing(Easing.bezier(...motion.easing.easeOutQuart))
    .withInitialValues({ transform: [{ translateY: 12 }] });

interface OnboardingScreenProps {
  step: OnboardingStep;
  title: string;
  /** Le mot du titre en Welcome Valentines */
  accent?: string;
  children: React.ReactNode;
  /** Les boutons du pied, collés en bas */
  footer?: React.ReactNode;
  /** Par défaut : écran précédent */
  onBack?: () => void;
  /** Le contenu défile (formulaire long, clavier) */
  scroll?: boolean;
}

export default function OnboardingScreen({
  step,
  title,
  accent,
  children,
  footer,
  onBack,
  scroll = false,
}: OnboardingScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flow = useOnboardingStore((s) => s.flow);
  const position = stepPosition(flow, step);

  const Body = scroll ? ScrollView : View;
  const bodyProps = scroll
    ? { contentContainerStyle: styles.body, keyboardShouldPersistTaps: 'handled' as const, showsVerticalScrollIndicator: false }
    : { style: [styles.body, styles.fill] };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <KeyboardAvoidingView style={[styles.fill, styles.column]} behavior="padding">
        <View style={styles.header}>
          <GlassButton icon={ChevronLeftIcon} onPress={onBack ?? (() => router.back())} accessibilityLabel="Retour" />
          <View style={styles.fill}>{position && <ProgressKnots {...position} />}</View>
          {isAddFlow(flow) ? (
            <GlassButton icon={XIcon} onPress={() => router.navigate('/(tabs)')} accessibilityLabel="Fermer" />
          ) : (
            <View style={styles.spacer} />
          )}
        </View>

        <Body {...bodyProps}>
          <Animated.View entering={rise(0)}>
            <Text style={styles.title} accessibilityRole="header">
              <AccentWord text={title} accent={accent} size={ONBOARDING_TITLE} />
            </Text>
          </Animated.View>
          {children}
        </Body>

        {footer && (
          <Animated.View entering={rise(4)} style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.lg }]}>
            <TornEdge color={FOOTER_PAPER} />
            {footer}
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Le petit libellé au-dessus d'une question (« Quand ? ») */
export function QuestionLabel({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

/** Un nœud par question, centrés : rouges jusqu'à celle-ci, sable après */
function ProgressKnots({ index, total }: { index: number; total: number }) {
  const width = (total - 1) * KNOT_GAP + 2 * KNOT_CURRENT;
  return (
    <View
      style={styles.knots}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Question ${index + 1} sur ${total}`}
      accessibilityValue={{ min: 1, max: total, now: index + 1 }}
    >
      <Svg width={width} height={2 * KNOT_CURRENT}>
        <KnotGradients />
        {Array.from({ length: total }, (_, i) => (
          <Circle
            key={i}
            cx={KNOT_CURRENT + i * KNOT_GAP}
            cy={KNOT_CURRENT}
            r={i === index ? KNOT_CURRENT : KNOT}
            fill={i <= index ? 'url(#knotReached)' : 'url(#knotAhead)'}
          />
        ))}
      </Svg>
    </View>
  );
}

/** La feuille du pied, au bord frangé : un cran plus claire que le fond */
const FOOTER_PAPER = '#f6f1ea';

const KNOT = 4.5;
const KNOT_CURRENT = 6;
const KNOT_GAP = 18;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  fill: {
    flex: 1,
  },
  column: {
    width: '100%',
    maxWidth: ONBOARDING_MAX_W,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  spacer: {
    width: 44,
  },
  knots: {
    alignItems: 'center',
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: ONBOARDING_TITLE,
    lineHeight: 36,
    letterSpacing: -0.3,
    color: colors.textPrimary,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textTertiary,
    marginBottom: -spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.md,
    backgroundColor: FOOTER_PAPER,
  },
});
