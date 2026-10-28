/**
 * Écran de connexion - "chapi"
 *
 * Il prolonge le splash sans couture : même fond rouge, mêmes yeux, même
 * « chapi » et même tagline, au point près (BrandLockup). Le splash disparaît
 * d'un coup sur cette image identique (voir AnimatedSplash, `handoff`), puis :
 * 1. le rouge du splash se fond dans une aquarelle rouge et chocolat (le
 *    papier du profil, en plus sombre) ;
 * 2. « chapi » et la tagline s'effacent ; les yeux descendent en petit et en
 *    crème au-dessus de la question « On lit ensemble ? », un grand titre à
 *    gauche juste au-dessus des boutons, qui montent depuis le bas ;
 * 3. les yeux baissent le regard vers les boutons, clignent, et restent vivants.
 *
 * Deux façons d'entrer : Apple, ou un code reçu par email (feuille auth/email).
 * « J'ai un lien ou un code » : rejoindre une lecture, la connexion vient après.
 * Rejoué depuis le profil (déjà connecté·e), les boutons passent aux questions.
 *
 * Flow :
 * - Nouveaux utilisateurs → onboarding (écran rôle)
 * - Utilisateurs existants avec projet(s) → home (tabs)
 * - Utilisateurs existants sans projet → onboarding (écran rôle, addChallenge)
 */

import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MailIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button3D from '../../components/Button3D';
import AccentWord from '../../components/ui/AccentWord';
import AppleLogo from '../../components/brand/AppleLogo';
import { BRAND_BG, BrandTagline, BrandWord, LivingEye, LOCKUP, LOGO_SIZE } from '../../components/brand/BrandLockup';
import { useAfterLogin } from '../../hooks/useAfterLogin';
import { isAppleAuthAvailable } from '../../services/supabase/auth';
import { useAuthStore } from '../../stores/authStore';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useSplashStore } from '../../stores/splashStore';
import { colors, fonts, inkGradient, lowki, spacing } from '../../utils/constants';
import { feel } from '../../utils/feel';
import { firstStep } from '../../utils/onboardingFlow';

/** L'aquarelle du fond (scripts/generate-profile-wash.py login) */
const WASH = require('../../assets/images/watercolor/login-wash.png');

const ENTRANCE = Easing.inOut(Easing.cubic);
/** Les mêmes pages que les Réglages */
const TERMS_URL = 'https://bbb.leasantos.me/terms';
const PRIVACY_URL = 'https://bbb.leasantos.me/privacy';
/** Le crème des textes sur le rouge */
const CREAM = '#FFFBF4';
/** Les yeux, une fois posés au-dessus de la question : leur taille */
const EYES_SCALE = 0.4;
/** Le tracé dans le carré du logo : bord gauche et bas visibles, en points */
const EYES_INK_LEFT = 14;
const EYES_INK_BOTTOM = 184;
/** La question, en grand titre à gauche */
const QUESTION = 42;
const QUESTION_LINE = 52;

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const afterLogin = useAfterLogin();

  const splashGone = useSplashStore((state) => state.splashGone);
  const setLoginMounted = useSplashStore((state) => state.setLoginMounted);


  const wash = useSharedValue(0);
  const buttons = useSharedValue(0);
  const lift = useSharedValue(0);
  const [buttonsHeight, setButtonsHeight] = useState(0);
  /** Le haut de la question : les yeux se posent juste au-dessus */
  const [questionTop, setQuestionTop] = useState(0);
  const gazeX = useSharedValue(0);
  const gazeY = useSharedValue(0);
  const lid = useSharedValue(1);

  // Monté sous le splash : on le lui dit, il peut partir
  useEffect(() => {
    setLoginMounted(true);
    return () => setLoginMounted(false);
  }, [setLoginMounted]);

  // L'entrée ne part qu'une fois le splash parti (ou tout de suite, après une
  // déconnexion) : avant, l'écran doit rester l'image exacte du splash.
  useEffect(() => {
    if (!splashGone) return;

    wash.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    lift.value = withDelay(250, withTiming(1, { duration: 850, easing: ENTRANCE }));
    buttons.value = withDelay(450, withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) }));

    // Le regard descend vers les boutons, puis va de l'un à l'autre, doucement
    gazeY.value = withDelay(800, withTiming(0.95, { duration: 450, easing: ENTRANCE }));
    gazeX.value = withDelay(
      2600,
      withRepeat(
        withSequence(
          withTiming(0.3, { duration: 900, easing: ENTRANCE }),
          withDelay(1800, withTiming(-0.3, { duration: 1100, easing: ENTRANCE })),
          withDelay(1800, withTiming(0, { duration: 900, easing: ENTRANCE })),
          withDelay(2200, withTiming(0, { duration: 0 })),
        ),
        -1,
      ),
    );

    // Un clignement une fois posés, puis de temps en temps
    const blink = () =>
      withSequence(
        withTiming(0.08, { duration: 90, easing: Easing.in(Easing.quad) }),
        withTiming(1, { duration: 160, easing: Easing.out(Easing.cubic) }),
      );
    lid.value = withDelay(1350, withSequence(blink(), withRepeat(withSequence(withDelay(3400, blink()), withDelay(2600, blink())), -1)));
  }, [splashGone]);

  const washStyle = useAnimatedStyle(() => ({ opacity: wash.value }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: 1 - wash.value }));
  // Les yeux rétrécissent autour du centre de l'écran, puis se posent au-dessus
  // de la question, alignés sur elle à gauche, et passent du rouge gravé au crème
  const eyesTop = questionTop - spacing.xl - EYES_SCALE * EYES_INK_BOTTOM;
  const eyesLeft = spacing.xl - EYES_SCALE * EYES_INK_LEFT;
  const eyesX = eyesLeft - screenWidth / 2 + EYES_SCALE * (LOGO_SIZE / 2);
  const eyesY = eyesTop - screenHeight / 2 - EYES_SCALE * (LOCKUP.eyesY - LOGO_SIZE / 2);
  const eyesStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: eyesX * lift.value },
      { translateY: eyesY * lift.value },
      { scale: 1 + (EYES_SCALE - 1) * lift.value },
    ],
  }));
  const darkStyle = useAnimatedStyle(() => ({ opacity: 1 - lift.value }));
  const lightStyle = useAnimatedStyle(() => ({ opacity: lift.value }));
  const questionStyle = useAnimatedStyle(() => ({
    opacity: lift.value,
    transform: [{ translateY: 16 * (1 - lift.value) }],
  }));
  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttons.value,
    transform: [{ translateY: 24 * (1 - buttons.value) }],
  }));

  /** Rejoué depuis le profil : déjà connecté·e, on passe aux questions */
  const replaying = () => {
    if (!useAuthStore.getState().user) return false;
    useOnboardingStore.getState().begin('create');
    router.push(firstStep('create'));
    return true;
  };

  const haveCode = () => {
    feel('tic');
    useOnboardingStore.getState().begin(useAuthStore.getState().user ? 'addJoin' : 'join');
    router.push('/onboarding/code');
  };

  const handleAppleLogin = async () => {
    if (replaying()) return;
    try {
      setIsLoading(true);

      const isAvailable = await isAppleAuthAvailable();
      if (!isAvailable) {
        Alert.alert('Non disponible', "Apple Sign In n'est pas disponible sur cet appareil");
        return;
      }

      const result = await login();
      await afterLogin(result);
    } catch (error: any) {
      // ERR_CANCELED = l'utilisateur a appuyé sur "Annuler" dans la modale Apple
      // Ce n'est pas une vraie erreur, on ignore silencieusement
      if (error.code === 'ERR_CANCELED') {
        return;
      }
      console.error('Login error:', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const buttonWidth = screenWidth - spacing.xl * 2;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={BRAND_BG} style={StyleSheet.absoluteFill} />
      {/* Le rouge du splash se fond dans l'aquarelle, rouge et chocolat */}
      <Animated.View style={[StyleSheet.absoluteFill, washStyle]} pointerEvents="none">
        <Image source={WASH} style={StyleSheet.absoluteFill} contentFit="cover" />
      </Animated.View>

      {/* Point d'ancrage au centre de l'écran, comme au splash */}
      <View style={styles.center}>
        <View>
          <Animated.View style={eyesStyle}>
            <Animated.View style={darkStyle}>
              <View style={[styles.logo, { transform: [{ translateY: LOCKUP.eyesY }] }]}>
                <LivingEye side="left" gazeX={gazeX} gazeY={gazeY} lid={lid} />
                <LivingEye side="right" gazeX={gazeX} gazeY={gazeY} lid={lid} />
              </View>
            </Animated.View>
            <Animated.View style={lightStyle}>
              <View style={[styles.logo, { transform: [{ translateY: LOCKUP.eyesY }] }]}>
                <LivingEye side="left" gazeX={gazeX} gazeY={gazeY} lid={lid} light />
                <LivingEye side="right" gazeX={gazeX} gazeY={gazeY} lid={lid} light />
              </View>
            </Animated.View>
          </Animated.View>
          {/* Reprise du splash, puis effacés : les yeux restent seuls */}
          <BrandWord style={taglineStyle} />
          <BrandTagline style={taglineStyle} />
        </View>
      </View>

      {/* La question, en grand titre à gauche, juste au-dessus des boutons */}
      <Animated.Text
        onLayout={(e) => setQuestionTop(e.nativeEvent.layout.y)}
        style={[styles.question, { bottom: buttonsHeight + spacing['4xl'] }, questionStyle]}
        accessibilityRole="header"
      >
        On lit{'\n'}
        <AccentWord text="ensemble ?" accent="ensemble" size={QUESTION} />
      </Animated.Text>

      <Animated.View
        onLayout={(e) => setButtonsHeight(e.nativeEvent.layout.height)}
        style={[styles.buttons, { paddingBottom: Math.max(insets.bottom, 16) + 16 }, buttonsStyle]}
      >
        <Button3D
          onPress={handleAppleLogin}
          variant="secondary"
          loading={isLoading}
          iconComponent={<AppleLogo size={22} color={colors.textPrimary} />}
          iconPosition="left"
          style={{ width: buttonWidth }}
        >
          Continuer avec Apple
        </Button3D>
        <Button3D
          onPress={() => replaying() || router.push('/auth/email')}
          variant="secondary"
          iconComponent={<MailIcon size={22} color={colors.textPrimary} />}
          iconPosition="left"
          style={{ width: buttonWidth }}
        >
          Continuer avec un email
        </Button3D>
        <Pressable onPress={haveCode} hitSlop={8} accessibilityRole="button" style={styles.code}>
          <Text style={styles.codeText}>J'ai un lien ou un code</Text>
        </Pressable>
        {/* Créer un compte vaut acceptation : pas de case à cocher, les liens suffisent */}
        <Text style={styles.legal}>
          En continuant, tu acceptes les{' '}
          <Text style={styles.legalLink} onPress={() => Linking.openURL(TERMS_URL)} accessibilityRole="link">
            conditions
          </Text>{' '}
          et la{' '}
          <Text style={styles.legalLink} onPress={() => Linking.openURL(PRIVACY_URL)} accessibilityRole="link">
            politique de confidentialité
          </Text>
          .
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BRAND_BG[1],
  },
  center: {
    width: 0,
    height: 0,
  },
  logo: {
    position: 'absolute',
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    left: -LOGO_SIZE / 2,
    top: -LOGO_SIZE / 2,
  },
  question: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    fontFamily: fonts.display,
    fontSize: QUESTION,
    lineHeight: QUESTION_LINE,
    letterSpacing: -0.4,
    color: CREAM,
  },
  code: {
    minHeight: 44,
    justifyContent: 'center',
  },
  codeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: CREAM,
    textDecorationLine: 'underline',
  },
  legal: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(255, 251, 244, 0.8)',
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  legalLink: {
    fontFamily: fonts.bodySemiBold,
    color: CREAM,
    textDecorationLine: 'underline',
  },
  buttons: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    gap: spacing.md,
  },
});
