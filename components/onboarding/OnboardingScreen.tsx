/**
 * OnboardingScreen — la page commune des écrans à questions de l'onboarding.
 *
 *    ‹  ●●●●●●●●●●●·········   ✕          retour en verre, fil cousu, fermer (ajout)
 *
 *    Ton 𝓻𝔂𝓽𝓱𝓶𝓮                           titre 30/36, un mot d'accent
 *    …                                     le contenu, en cascade (60 ms)
 *    ·····································   le fil au-dessus du pied
 *    [        Continuer        ]
 *
 * Fond papier grené. Le fil de progression est la couture de GoalTrack
 * (`Seam`) : chocolat pour le chemin fait, sable pour le reste.
 */

import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ChevronLeftIcon, XIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg from 'react-native-svg';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { colors, fonts, motion, spacing } from '../../utils/constants';
import { isAddFlow, stepProgress, type OnboardingStep } from '../../utils/onboardingFlow';
import AccentWord from '../ui/AccentWord';
import GlassButton from '../ui/GlassButton';
import { Seam } from '../ui/GoalTrack';
import { StitchLine } from '../ui/Stitch';

const PAPER_TEXTURE = require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png');

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
  const progress = stepProgress(flow, step);

  const Body = scroll ? ScrollView : View;
  const bodyProps = scroll
    ? { contentContainerStyle: styles.body, keyboardShouldPersistTaps: 'handled' as const, showsVerticalScrollIndicator: false }
    : { style: [styles.body, styles.fill] };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Image source={PAPER_TEXTURE} style={styles.texture} contentFit="cover" />
      <KeyboardAvoidingView style={[styles.fill, styles.column]} behavior="padding">
        <View style={styles.header}>
          <GlassButton icon={ChevronLeftIcon} onPress={onBack ?? (() => router.back())} accessibilityLabel="Retour" />
          {progress !== null ? <ProgressThread progress={progress} /> : <View style={styles.fill} />}
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
            <StitchLine style={styles.footerSeam} />
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

/** Le fil de progression : la couture de GoalTrack, sans nœuds */
function ProgressThread({ progress }: { progress: number }) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  return (
    <View
      style={styles.thread}
      onLayout={onLayout}
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
    >
      {width > 0 && (
        <Svg width={width} height={THREAD_H}>
          <Seam width={width} readUntil={width * progress} y={THREAD_H / 2} />
        </Svg>
      )}
    </View>
  );
}

const THREAD_H = 6;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgLight,
  },
  fill: {
    flex: 1,
  },
  column: {
    width: '100%',
    maxWidth: ONBOARDING_MAX_W,
    alignSelf: 'center',
  },
  texture: {
    ...StyleSheet.absoluteFill,
    opacity: 0.05,
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
  thread: {
    flex: 1,
    height: THREAD_H,
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
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  footerSeam: {
    position: 'absolute',
    top: 0,
    left: spacing.xl,
    right: spacing.xl,
  },
});
