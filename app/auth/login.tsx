/**
 * Écran de connexion - "chapi"
 *
 * Il prolonge le splash sans couture : même fond rouge, mêmes yeux, même
 * « chapi » et même tagline, au point près (BrandLockup). Le splash disparaît
 * d'un coup sur cette image identique (voir AnimatedSplash, `handoff`), puis :
 * 1. le mur de couvertures, ton sur ton, apparaît et défile lentement ;
 * 2. le bloc de marque remonte un peu, les boutons montent depuis le bas ;
 * 3. les yeux baissent le regard vers les boutons, clignent, et restent vivants.
 *
 * Deux façons d'entrer : Apple, ou un code reçu par email (feuille auth/email).
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
import { Alert, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import Button3D from '../../components/Button3D';
import AppleLogo from '../../components/brand/AppleLogo';
import { BRAND_BG, BrandTagline, BrandWord, LivingEye, LOCKUP, LOGO_SIZE } from '../../components/brand/BrandLockup';
import { useAfterLogin } from '../../hooks/useAfterLogin';
import { isAppleAuthAvailable } from '../../services/supabase/auth';
import { useAuthStore } from '../../stores/authStore';
import { useSplashStore } from '../../stores/splashStore';
import { colors, spacing } from '../../utils/constants';

/** Les bandes de couvertures (scripts/generate-login-covers.py), une par colonne. */
const COVER_STRIPS = [
  require('../../assets/images/login/covers-1.png'),
  require('../../assets/images/login/covers-2.png'),
  require('../../assets/images/login/covers-3.png'),
  require('../../assets/images/login/covers-4.png'),
];
/** Une bande : 4 couvertures de 112 × 168 pt, 14 pt entre elles. */
const COVER_W = 112;
const STRIP_H = 4 * (168 + 14);
const COLUMN_GAP = 14;
/** Les couvertures restent discrètes : on devine les livres sans les lire. */
const WALL_OPACITY = 0.6;
/** Une bande défile sur toute sa hauteur en 40 s : à peine un mouvement. */
const DRIFT_DURATION = 40000;

const ENTRANCE = Easing.inOut(Easing.cubic);
/** Le fond à hauteur du nom (38 % du dégradé BRAND_BG) : la clairière s'y fond. */
const CLEARING = '#9e2d40';

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

/**
 * Les copains : quelques petites paires d'yeux autour du logo, pour dire qu'on
 * lit à plusieurs. Elles apparaissent une à une, sans rebond, regardent les
 * boutons avec le grand et clignent chacune à son rythme.
 * Position (x, y) par rapport au centre du bloc de marque, en points.
 */
const FRIENDS = [
  { x: -128, y: -150, scale: 0.26, tilt: -12, delay: 1300, blink: 2900 },
  { x: 132, y: -168, scale: 0.21, tilt: 9, delay: 1550, blink: 3700 },
  { x: -158, y: 18, scale: 0.2, tilt: 7, delay: 1800, blink: 3300 },
  { x: 156, y: 6, scale: 0.24, tilt: -6, delay: 2050, blink: 4100 },
];

function Friend({
  friend,
  start,
  gazeX,
  gazeY,
}: {
  friend: (typeof FRIENDS)[number];
  start: boolean;
  gazeX: SharedValue<number>;
  gazeY: SharedValue<number>;
}) {
  const appear = useSharedValue(0);
  const lid = useSharedValue(1);

  useEffect(() => {
    if (!start) return;
    appear.value = withDelay(friend.delay, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    const blink = withSequence(
      withTiming(0.08, { duration: 90, easing: Easing.in(Easing.quad) }),
      withTiming(1, { duration: 160, easing: Easing.out(Easing.cubic) }),
    );
    lid.value = withDelay(friend.delay + 600, withRepeat(withSequence(blink, withDelay(friend.blink, withTiming(1, { duration: 0 }))), -1));
  }, [start]);

  const style = useAnimatedStyle(() => ({
    opacity: appear.value,
    transform: [
      { translateX: friend.x },
      { translateY: friend.y },
      { rotate: `${friend.tilt}deg` },
      { scale: friend.scale * (0.6 + 0.4 * appear.value) },
    ],
  }));

  return (
    <Animated.View style={[styles.friend, style]} pointerEvents="none">
      <LivingEye side="left" gazeX={gazeX} gazeY={gazeY} lid={lid} />
      <LivingEye side="right" gazeX={gazeX} gazeY={gazeY} lid={lid} />
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

  // Le bloc de marque remonte juste assez pour laisser la place aux boutons
  const lift = -Math.min(72, screenHeight * 0.08);

  const wall = useSharedValue(0);
  const drift = useSharedValue(0);
  const lockupY = useSharedValue(0);
  const buttons = useSharedValue(0);
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

    wall.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    if (!reduceMotion) {
      drift.value = withRepeat(withTiming(1, { duration: DRIFT_DURATION, easing: Easing.linear }), -1, false);
    }
    lockupY.value = withDelay(150, withTiming(lift, { duration: 700, easing: ENTRANCE }));
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

  const wallStyle = useAnimatedStyle(() => ({ opacity: wall.value * WALL_OPACITY }));
  const veilStyle = useAnimatedStyle(() => ({ opacity: wall.value }));
  const lockupStyle = useAnimatedStyle(() => ({ transform: [{ translateY: lockupY.value }] }));
  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttons.value,
    transform: [{ translateY: 24 * (1 - buttons.value) }],
  }));

  const handleAppleLogin = async () => {
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

      <Animated.View style={[StyleSheet.absoluteFill, styles.wallFrame, wallStyle]} pointerEvents="none">
        <CoverWall drift={drift} />
      </Animated.View>

      {/* Une clairière derrière le nom, un fondu sous les boutons : les couvertures
          ne passent jamais sous le texte. */}
      <Animated.View style={[StyleSheet.absoluteFill, veilStyle]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="clearing" cx="50%" cy="42%" rx="70%" ry="30%">
            <Stop offset="0" stopColor={CLEARING} stopOpacity={1} />
            <Stop offset="0.6" stopColor={CLEARING} stopOpacity={0.9} />
            <Stop offset="1" stopColor={CLEARING} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#clearing)" />
      </Svg>
      <LinearGradient
        colors={['rgba(146, 41, 59, 0)', BRAND_BG[1]]}
        locations={[0, 0.45]}
        style={[styles.bottomFade, { height: 300 + insets.bottom }]}
      />
      </Animated.View>

      {/* Point d'ancrage au centre de l'écran, comme au splash */}
      <View style={styles.center}>
        <Animated.View style={lockupStyle}>
          <View style={[styles.logo, { transform: [{ translateY: LOCKUP.eyesY }] }]}>
            <LivingEye side="left" gazeX={gazeX} gazeY={gazeY} lid={lid} />
            <LivingEye side="right" gazeX={gazeX} gazeY={gazeY} lid={lid} />
          </View>
          <BrandWord />
          <BrandTagline />
          {FRIENDS.map((friend, i) => (
            <Friend key={i} friend={friend} start={splashGone} gazeX={gazeX} gazeY={gazeY} />
          ))}
        </Animated.View>
      </View>

      <Animated.View
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
          onPress={() => router.push('/auth/email')}
          variant="secondary"
          iconComponent={<MailIcon size={22} color={colors.textPrimary} />}
          iconPosition="left"
          style={{ width: buttonWidth }}
        >
          Continuer avec un email
        </Button3D>
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
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  center: {
    width: 0,
    height: 0,
  },
  friend: {
    position: 'absolute',
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    left: -LOGO_SIZE / 2,
    top: -LOGO_SIZE / 2,
  },
  logo: {
    position: 'absolute',
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    left: -LOGO_SIZE / 2,
    top: -LOGO_SIZE / 2,
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
