/**
 * Écran de connexion - "chapi"
 *
 * Il prolonge le splash sans couture : même fond rouge, mêmes yeux, même
 * « chapi » et même tagline, au point près (BrandLockup). Le splash disparaît
 * d'un coup sur cette image identique (voir AnimatedSplash, `handoff`), puis :
 * 1. le rouge du splash se fond dans une aquarelle surtout rouge et chocolat
 *    (le papier du profil, en plus sombre) ; dessus, un mur de couvertures
 *    grises, presque transparent, défile lentement ;
 * 2. « chapi » et la tagline s'effacent ; les yeux descendent en petit et en
 *    crème au-dessus de la question « On lit ensemble ? », un grand titre à
 *    gauche juste au-dessus des boutons, qui montent depuis le bas ;
 * 3. les yeux baissent le regard vers les boutons, clignent, et restent vivants.
 *
 * Deux façons d'entrer : Apple, ou un code reçu par email (feuille auth/email).
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
import { Alert, Linking, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  type SharedValue,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
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
import { firstStep } from '../../utils/onboardingFlow';

/** Les bandes de couvertures (scripts/generate-login-covers.py gris), une par colonne. */
const COVER_STRIPS = [
  require('../../assets/images/login/covers-1.png'),
  require('../../assets/images/login/covers-2.png'),
  require('../../assets/images/login/covers-3.png'),
  require('../../assets/images/login/covers-4.png'),
];
/** Une bande : 4 couvertures de 112 × 168 pt, 14 pt entre elles. */
/** L'aquarelle du fond (scripts/generate-profile-wash.py login) */
const WASH = require('../../assets/images/watercolor/login-wash.png');
const COVER_W = 112;
const STRIP_H = 4 * (168 + 14);
const COLUMN_GAP = 14;
/** Grises et à peine là : on devine des livres, l'aquarelle reste le fond. */
const WALL_OPACITY = 0.1;
/** Une bande défile sur toute sa hauteur en 40 s : à peine un mouvement. */
const DRIFT_DURATION = 40000;


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

/** Une colonne de couvertures, posée deux fois pour boucler sans couture. */
function CoverColumn({ index, x, drift }: { index: number; x: number; drift: SharedValue<number> }) {
  // Une colonne sur deux monte, l'autre descend, chacune décalée en hauteur
  const up = index % 2 === 0;
  const offset = ((index * 0.37) % 1) * STRIP_H;
  const style = useAnimatedStyle(() => {
    const travel = ((drift.value * STRIP_H + offset) % STRIP_H) * (up ? -1 : 1);
    return { transform: [{ translateY: (up ? 0 : -STRIP_H) + travel }] };
  });
  const source = COVER_STRIPS[index % COVER_STRIPS.length];
  return (
    <Animated.View style={[styles.column, { left: x }, style]}>
      <Image source={source} style={styles.strip} contentFit="fill" />
      <Image source={source} style={styles.strip} contentFit="fill" />
      <Image source={source} style={styles.strip} contentFit="fill" />
    </Animated.View>
  );
}

/** Le mur de couvertures, penché, qui déborde de l'écran de tous les côtés. */
function CoverWall({ drift }: { drift: SharedValue<number> }) {
  const { width, height } = useWindowDimensions();
  // Assez de colonnes pour couvrir l'écran une fois penché
  const span = Math.hypot(width, height);
  const count = Math.ceil(span / (COVER_W + COLUMN_GAP)) + 1;
  const wallW = count * (COVER_W + COLUMN_GAP);
  return (
    <View
      style={[
        styles.wall,
        { width: wallW, height: span, left: (width - wallW) / 2, top: (height - span) / 2 },
      ]}
    >
      {Array.from({ length: count }, (_, i) => (
        <CoverColumn key={i} index={i} x={i * (COVER_W + COLUMN_GAP)} drift={drift} />
      ))}
    </View>
  );
}

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const afterLogin = useAfterLogin();

  const splashGone = useSplashStore((state) => state.splashGone);
  const setLoginMounted = useSplashStore((state) => state.setLoginMounted);


  const wash = useSharedValue(0);
  const drift = useSharedValue(0);
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
    if (!reduceMotion) {
      drift.value = withRepeat(withTiming(1, { duration: DRIFT_DURATION, easing: Easing.linear }), -1, false);
    }
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
  const wallStyle = useAnimatedStyle(() => ({ opacity: wash.value * WALL_OPACITY }));
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
      <Animated.View style={[StyleSheet.absoluteFill, styles.wallFrame, wallStyle]} pointerEvents="none">
        <CoverWall drift={drift} />
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
  wallFrame: {
    overflow: 'hidden',
  },
  wall: {
    position: 'absolute',
    transform: [{ rotate: '-10deg' }],
  },
  column: {
    position: 'absolute',
    top: 0,
    width: COVER_W,
  },
  strip: {
    width: COVER_W,
    height: STRIP_H,
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
