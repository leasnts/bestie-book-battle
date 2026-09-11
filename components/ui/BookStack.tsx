/**
 * Composant BookStack — Double état (fermé / ouvert)
 *
 * === ÉTAT FERMÉ (isOpen = false) ===
 * Affiche une pile de couvertures empilées avec le livre actif
 * au premier plan montrant auteur, titre, nombre de pages et progression circulaire.
 * Les petites covers se superposent avec un margin négatif.
 * Cliquer dessus ouvre l'étagère (passe en état ouvert).
 *
 * === ÉTAT OUVERT (isOpen = true) ===
 * Les covers se "déplient" : affichage en étagère horizontale scrollable.
 * Chaque cover est cliquable pour changer de challenge actif.
 * Les livres "terminés" ont un fond dark avec inner shadow et un badge ✓.
 * En bas : une barre de pagination sombre avec des dots aux extrémités.
 * À droite : un bouton + pour ajouter un nouveau projet.
 * Cliquer sur une cover → appelle onSelectChallenge → repasse en fermé.
 *
 * Ce n'est PAS un modal : c'est un composant inline qui alterne entre 2 rendus.
 */

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Challenge, ParticipantWithProgress } from '../../types/supabase';
import { borderRadius, colors, spacing } from '../../utils/constants';
import Button3D from '../Button3D';
import PopEyes from '../PopEyes';
import IconCalendar from '../icons/IconCalendar';
import IconChevronRight from '../icons/IconChevronRight';
import IconCopy from '../icons/IconCopy';
import IconPencil from '../icons/IconPencil';
import IconTrash from '../icons/IconTrash';
import IconUserPlus from '../icons/IconUserPlus';
import { ProgressBar } from './ProgressBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Formate une date ISO en JJ/MM/AAAA */
function formatDateDDMMYYYY(iso: string | null | undefined): string {
  if (!iso) return '--/--/----';
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// ─── Badge marque-page ✓ (SVG) ──────────────────────────────────
/**
 * Petit badge en forme de marque-page/ruban avec un checkmark blanc.
 * S'affiche en haut à gauche des couvertures de livres terminés.
 *
 * Comment ça marche :
 * - On dessine un rectangle avec une encoche en V en bas (forme de ruban)
 * - On superpose un trait en forme de ✓ (checkmark) en blanc
 * - Le tout via react-native-svg pour un rendu net à toutes les tailles
 */
const BookmarkCheckBadge = () => (
  <View style={styles.doneBadge}>
    <Svg width={14} height={18} viewBox="0 0 14 18" fill="none">
      {/* Corps du marque-page : rectangle + V-notch en bas */}
      <Path
        d="M0 0H14V14.5L7 11.5L0 14.5V0Z"
        fill={colors.dark900}
      />
      {/* Checkmark blanc centré dans la partie haute du ruban */}
      <Path
        d="M3.5 6.5L6 9L10.5 4.5"
        stroke="#FFFFFF"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

// ─── Props ───────────────────────────────────────────────────────────

interface BookStackProps {
  /** Le challenge actuellement sélectionné (affiché en détail quand fermé) */
  activeChallenge: Challenge;
  /** Tous les challenges de l'utilisateur (affichés dans l'étagère quand ouvert) */
  allChallenges: Challenge[];
  /** Pourcentage de progression moyen du challenge actif */
  progressPercentage: number;
  /** Liste des participants avec leur progression (pour déterminer si un livre est terminé) */
  participants?: ParticipantWithProgress[];
  /** Indique si l'étagère est ouverte (true) ou fermée (false) */
  isOpen: boolean;
  /** Bascule ouvert/fermé */
  onToggle: () => void;
  /** Appelé quand l'utilisateur choisit un livre dans l'étagère */
  onSelectChallenge: (challenge: Challenge) => void;
  /** Appelé quand on appuie sur le bouton + */
  onAddBook: () => void;
  /** Appelé pour supprimer le challenge actif */
  onDeleteBook?: () => void;
  /** Appelé pour inviter un ami au challenge actif */
  onInviteFriend?: () => void;
  /** Appelé pour modifier le challenge actif */
  onEditBook?: () => void;
  /** Appelé pour modifier la deadline globale du livre */
  onEditDeadline?: () => void;
  /** Appelé pour définir un objectif intermédiaire (ex: lire X pages d'ici mercredi) */
  onSetIntermediateGoal?: () => void;
}

// ─── Constantes de taille (Figma) ─────────────────────────────────

// Ratio cover livre : 50:70 (largeur:hauteur)
const COVER_RATIO_W = 50;
const COVER_RATIO_H = 70;

// Étagère ouverte : les covers ont la MÊME taille et ratio que la cover détaillée
// (celle de la section fermée). La cover détaillée ≈ hauteur bookInfo (~110px).
const SHELF_COVER_H = 110;
const SHELF_COVER_W = Math.round((SHELF_COVER_H * COVER_RATIO_W) / COVER_RATIO_H); // 79

const COVER_W = 50;
const COVER_H = 70;
const COVER_GAP = 12;          // gap entre covers en mode ouvert
const STACK_OVERLAP = -40;      // overlap en mode fermé (marginRight négatif)
const STACK_VISIBLE = COVER_W + STACK_OVERLAP; // 10px visible par cover empilée
const DONE_BG_W = 57;          // fond dark derrière les covers "terminées"
const DONE_BG_H = 76;
const SHELF_BAR_H = 24;        // hauteur de la barre d'étagère
const SHELF_OVERLAP = 14;      // de combien la barre chevauche le bas des covers
const ADD_BTN_SIZE = 40;

// Image par défaut si pas de couverture
const DEFAULT_COVER = require('../../assets/images/random_cover_1.png');

/**
 * Résout la source d'image : gère les URLs et les images locales.
 * Si c'est une URL http(s), on renvoie { uri: url }.
 * Sinon, on renvoie l'image par défaut.
 */
const resolveImage = (ref: string | null | undefined) => {
  if (!ref) return DEFAULT_COVER;
  if (ref.startsWith('http://') || ref.startsWith('https://')) {
    return { uri: ref };
  }
  return DEFAULT_COVER;
};

// ─── Constantes d'animation ──────────────────────────────────────
// Délai entre chaque cover qui tombe sur l'étagère (ms)
const DROP_STAGGER = 40;
// Config spring pour l'atterrissage des covers (rebond léger et rapide)
const DROP_SPRING = { damping: 14, stiffness: 220, mass: 0.6 };
// Durée de la rétraction des covers vers la pile (ms)
const RETRACT_DURATION = 180;

// ─── Vis métallique de l'étagère ──────────────────────────────────
// Le design Figma utilise un conic-gradient pour créer un effet de vis
// métallique chromée. Comme React Native SVG ne supporte pas les gradients
// coniques, on découpe le cercle en 24 tranches de 15° chacune avec des
// couleurs interpolées entre les stops du gradient Figma.
// Résultat : un reflet métallique réaliste, identique au design.

const SCREW_SIZE = 10;
const SCREW_SEGMENTS = 24;
const SCREW_STEP = 360 / SCREW_SEGMENTS; // 15° par tranche

/** Interpolation linéaire entre deux valeurs */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Retourne la luminosité (0-255) à un angle donné (0-360°).
 * Reproduit exactement le conic-gradient du SVG Figma :
 *   from 90deg → les stops commencent à droite (3h)
 *   0°offset (=90° abs) : #D9D9D9 (217) — gris clair
 *   180°offset (=270° abs) : #808080 (128) — gris moyen
 *   270°offset (=360° abs) : #FFFFFF (255) — blanc (reflet vif)
 *   315°offset (=45° abs) : #7F7F7F (127) — gris
 *   360°offset (=90° abs) : #737373 (115) — gris foncé (cassure)
 */
function screwGray(deg: number): number {
  deg = ((deg % 360) + 360) % 360;
  if (deg >= 90 && deg < 270) return Math.round(lerp(217, 128, (deg - 90) / 180));
  if (deg >= 270)             return Math.round(lerp(128, 255, (deg - 270) / 90));
  if (deg < 45)               return Math.round(lerp(255, 127, deg / 45));
  return                             Math.round(lerp(127, 115, (deg - 45) / 45));
}

/** Construit le chemin SVG d'une tranche de camembert (pie slice) */
function screwSlice(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startDeg));
  const y1 = cy + r * Math.sin(toRad(startDeg));
  const x2 = cx + r * Math.cos(toRad(endDeg));
  const y2 = cy + r * Math.sin(toRad(endDeg));
  return `M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 0,1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;
}

// Pré-calcul de toutes les tranches (exécuté 1 seule fois au chargement du module)
const SCREW_DATA = Array.from({ length: SCREW_SEGMENTS }, (_, i) => {
  const start = i * SCREW_STEP;
  const end = (i + 1) * SCREW_STEP;
  const gray = screwGray(start);
  return {
    d: screwSlice(5, 5, 5, start, end),
    fill: `rgb(${gray},${gray},${gray})`,
  };
});

/** Vis métallique avec gradient conique — remplace les simples dots */
function ShelfScrew() {
  return (
    <Svg width={SCREW_SIZE} height={SCREW_SIZE} viewBox="0 0 10 10">
      {SCREW_DATA.map((slice, i) => (
        <Path key={i} d={slice.d} fill={slice.fill} />
      ))}
    </Svg>
  );
}

// ─── Composant principal ──────────────────────────────────────────

export default function BookStack({
  activeChallenge,
  allChallenges,
  progressPercentage,
  participants = [],
  isOpen,
  onToggle,
  onSelectChallenge,
  onAddBook,
  onDeleteBook,
  onInviteFriend,
  onEditBook,
  onEditDeadline,
  onSetIntermediateGoal,
}: BookStackProps) {
  /*
    Au-delà d'un certain corps de texte, la carte du livre passe de deux
    colonnes à une seule.

    En disposition côte à côte, la couverture est en `alignItems: 'stretch'` :
    elle épouse la hauteur du bloc texte. C'est ce qu'on veut à taille normale.
    Mais quand le texte double, il entraîne la couverture avec lui — elle occupe
    alors la moitié de l'écran, et la colonne de droite devient si étroite que
    le titre se réduit à « La bi… ».

    On restructure au lieu d'étirer : la couverture reprend sa taille fixe et
    le texte passe dessous, sur toute la largeur.
  */
  const { fontScale } = useWindowDimensions();
  const stackVertically = fontScale >= 1.35;

  // État local pour le menu contextuel et la modal d'invitation
  const [menuVisible, setMenuVisible] = useState(false);
  const [inviteVisible, setInviteVisible] = useState(false);

  // On extrait les données du challenge actif
  const bookTitle = activeChallenge.book_title;
  const bookAuthor = activeChallenge.book_author || '';
  const totalPages = activeChallenge.total_pages;
  const coverUrl = activeChallenge.cover_url;
  const inviteCode = activeChallenge.invite_code || '';
  const targetEndDate = activeChallenge.target_end_date;

  // Les covers des autres challenges (pour la pile en mode fermé)
  const otherCovers = allChallenges
    .filter((c) => c.id !== activeChallenge.id)
    .map((c) => c.cover_url)
    .slice(0, 3);

  // ─── Handlers menu ────────────────────────────────────────────

  const handleMenuPress = useCallback((e: any) => {
    e.stopPropagation(); // Empêche l'ouverture de l'étagère
    setMenuVisible(!menuVisible);
  }, [menuVisible]);

  const handleDeletePress = useCallback(() => {
    setMenuVisible(false);
    Alert.alert(
      'Supprimer définitivement le livre',
      `Tu veux retirer « ${bookTitle} » de ta bibliothèque ? Tu pourras toujours le rejoindre plus tard avec le code d'invitation.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: () => onDeleteBook?.(),
        },
      ]
    );
  }, [bookTitle, onDeleteBook]);

  const handleInvitePress = useCallback(() => {
    setMenuVisible(false);
    // Petit délai pour laisser le bottom sheet se fermer avant d'ouvrir la modal
    setTimeout(() => setInviteVisible(true), 250);
  }, []);

  // Copier le code d'invitation dans le presse-papier
  const handleCopyCode = useCallback(async () => {
    if (!inviteCode) return;
    await Clipboard.setStringAsync(inviteCode);
    Alert.alert('Copié !', 'Le code a été copié dans le presse-papier.');
  }, [inviteCode]);

  // Partager le code d'invitation via Share natif
  const handleShareInvite = useCallback(async () => {
    if (!inviteCode) return;
    try {
      const code = inviteCode.split('').join(' ');
      await Share.share({
        message: `Rejoins-moi pour lire « ${bookTitle} » ensemble sur bestiebookbattle !\n\nCode d'invitation : ${code}`,
      });
    } catch (_) {
      // L'utilisateur a annulé le partage
    }
  }, [inviteCode, bookTitle]);

  const handleEditPress = useCallback(() => {
    setMenuVisible(false);
    onEditBook?.();
  }, [onEditBook]);

  const handleEditDeadlinePress = useCallback(() => {
    setMenuVisible(false);
    setTimeout(() => onEditDeadline?.(), 250);
  }, [onEditDeadline]);

  const handleSetIntermediateGoalPress = useCallback(() => {
    setMenuVisible(false);
    setTimeout(() => onSetIntermediateGoal?.(), 250);
  }, [onSetIntermediateGoal]);

  // ─── Handler étagère ouverte ────────────────────────────────

  const handleCoverPress = useCallback(
    (challenge: Challenge) => {
      onSelectChallenge(challenge);
    },
    [onSelectChallenge]
  );

  // ─── RENDU : ÉTAT OUVERT (étagère) ──────────────────────────
  //
  // On utilise un ScrollView au lieu de FlatList pour avoir le contrôle
  // complet sur les animations d'entrée/sortie de chaque cover individuelle.
  // (FlatList recycle ses items, ce qui casse les animations mount/unmount)

  if (isOpen) {
    const totalItems = allChallenges.length;

    return (
      <Animated.View
        style={styles.openContainer}
        exiting={FadeOut.duration(150)}
      >
        {/* Barre d'étagère — glisse depuis le bas */}
        <Animated.View
          style={styles.shelfBarOuter}
          entering={() => {
            'worklet';
            return {
              initialValues: { transform: [{ translateY: 20 }], opacity: 0 },
              animations: {
                transform: [{ translateY: withDelay(80, withSpring(0, DROP_SPRING)) }],
                opacity: withDelay(80, withTiming(1, { duration: 150 })),
              },
            };
          }}
        >
          <BlurView intensity={20} tint="dark" style={styles.shelfBar}>
            <ShelfScrew />
            <ShelfScrew />
          </BlurView>
        </Animated.View>

        {/* Rangée scrollable de couvertures */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.shelfList}
          contentContainerStyle={styles.shelfContent}
        >
          {allChallenges.map((item, index) => {
            const isDone =
              item.status === 'completed' ||
              item.average_progress_percentage >= 100;

            // Chaque cover "tombe" depuis le haut avec un délai échelonné.
            // Le spring donne un petit rebond comme si la cover atterrissait sur l'étagère.
            const dropDelay = index * DROP_STAGGER;

            return (
              <Animated.View
                key={item.id}
                style={index > 0 ? { marginLeft: COVER_GAP } : undefined}
                entering={() => {
                  'worklet';
                  return {
                    initialValues: {
                      transform: [{ translateY: -SHELF_COVER_H }],
                      opacity: 0,
                    },
                    animations: {
                      transform: [
                        { translateY: withDelay(dropDelay, withSpring(0, DROP_SPRING)) },
                      ],
                      opacity: withDelay(dropDelay, withTiming(1, { duration: 100 })),
                    },
                  };
                }}
              >
                <Pressable
                  onPress={() => handleCoverPress(item)}
                  style={({ pressed }) => [
                    styles.shelfCoverWrapper,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  {isDone ? (
                    <View style={[styles.doneCoverContainer, styles.shelfDoneCover]}>
                      <View style={styles.doneCoverBackground}>
                        <View style={styles.doneCoverInnerShadow} />
                      </View>
                      <Image
                        source={resolveImage(item.cover_url)}
                        style={styles.shelfCoverDone}
                        contentFit="cover"
                      />
                      <BookmarkCheckBadge />
                    </View>
                  ) : (
                    <View style={styles.shelfCoverShadow}>
                      <Image
                        source={resolveImage(item.cover_url)}
                        style={styles.shelfCover}
                        contentFit="cover"
                      />
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}

          {/* Bouton + — tombe en dernier */}
          <Animated.View
            style={[styles.addButtonWrapper, { marginLeft: COVER_GAP }]}
            entering={() => {
              'worklet';
              const delay = totalItems * DROP_STAGGER + 60;
              return {
                initialValues: {
                  transform: [{ translateY: -SHELF_COVER_H }],
                  opacity: 0,
                },
                animations: {
                  transform: [
                    { translateY: withDelay(delay, withSpring(0, DROP_SPRING)) },
                  ],
                  opacity: withDelay(delay, withTiming(1, { duration: 100 })),
                },
              };
            }}
          >
            <Button3D
              onPress={onAddBook}
              variant="primary"
              icon="add"
              iconOnly
              size="compact"
            />
          </Animated.View>
        </ScrollView>
      </Animated.View>
    );
  }

  // ─── RENDU : ÉTAT FERMÉ (pile empilée) ──────────────────────
  //
  // Le livre actif est ancré à GAUCHE. Les covers empilées sont en absolute
  // derrière lui, décalées vers la gauche (peuvent sortir de l'écran).
  //
  // À la fermeture, les covers se rétractent vers la gauche en se resserrant.

  const isActiveDone =
    activeChallenge.status === 'completed' ||
    activeChallenge.average_progress_percentage >= 100;

  return (
    <Pressable onPress={onToggle} style={styles.closedContainer}>
      <Animated.View
        style={[styles.activeCard, stackVertically && styles.activeCardStacked]}
        entering={FadeIn.duration(250)}
      >
        {/* Zone couverture : cover active + pile derrière */}
        <View style={[styles.coverArea, stackVertically && styles.coverAreaFixed]}>
          {/* Covers empilées — chacune se rétracte vers sa position finale
              avec un léger délai, donnant l'effet de "re-stacking". */}
          {otherCovers.map((cover, index) => {
            const retractDelay = index * 30;
            return (
              <Animated.View
                key={`bg-cover-${index}`}
                style={[
                  styles.stackedCover,
                  {
                    left: -((otherCovers.length - index) * STACK_VISIBLE),
                    zIndex: index,
                  },
                ]}
                entering={() => {
                  'worklet';
                  // Les covers arrivent depuis la droite (position 0 = au niveau de l'active)
                  // et glissent vers leur position finale (negative left)
                  return {
                    initialValues: {
                      transform: [{ translateX: (otherCovers.length - index) * STACK_VISIBLE }],
                      opacity: 0.5,
                    },
                    animations: {
                      transform: [
                        { translateX: withDelay(retractDelay, withSpring(0, {
                          damping: 16,
                          stiffness: 180,
                        })) },
                      ],
                      opacity: withDelay(retractDelay, withTiming(1, { duration: RETRACT_DURATION })),
                    },
                  };
                }}
              >
                <View style={styles.smallCoverShadow}>
                  <Image
                    source={resolveImage(cover)}
                    style={styles.smallCover}
                    contentFit="cover"
                  />
                </View>
              </Animated.View>
            );
          })}

          {/* Cover active — au premier plan, remplit coverArea */}
          <Animated.View
            style={[styles.activeCoverWrapper, { zIndex: otherCovers.length + 1 }]}
            entering={FadeIn.duration(200)}
          >
            {isActiveDone ? (
              <View style={styles.doneCoverContainer}>
                <View style={styles.doneCoverBackground}>
                  <View style={styles.doneCoverInnerShadow} />
                </View>
                <Image
                  source={resolveImage(coverUrl)}
                  style={styles.shelfCoverDone}
                  contentFit="cover"
                />
                <BookmarkCheckBadge />
              </View>
            ) : (
              <View style={styles.activeCoverShadow}>
                <Image
                  source={resolveImage(coverUrl)}
                  style={styles.activeCover}
                  contentFit="cover"
                />
              </View>
            )}
          </Animated.View>
        </View>

        {/* Section infos du livre + menu */}
        <Animated.View
          style={[styles.bookInfo, stackVertically && styles.bookInfoStacked]}
          entering={FadeIn.delay(100).duration(250)}
        >
          {/* En-tête : textes à gauche, menu à droite */}
          <View style={styles.bookHeader}>
            <View style={styles.bookTexts}>
              <Text style={styles.author} numberOfLines={2}>
                {bookAuthor || 'Auteur inconnu'}
              </Text>
              <Text style={styles.title} numberOfLines={2}>
                {bookTitle}
              </Text>
            </View>

            {/* Bouton menu (⋮) — trois points verticaux comme Figma */}
            <Pressable
              onPress={handleMenuPress}
              style={styles.menuButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Actions du livre"
            >
              <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Ligne du bas : badges (pages + deadline) + barre de progression */}
          <View style={styles.bookFooter}>
            <View style={[styles.badgesRow, stackVertically && styles.badgesRowWrap]}>
              <View style={styles.pagesBadge}>
                <Text style={styles.pagesText}>{totalPages}p</Text>
              </View>
              <View style={styles.deadlineBadge}>
                <Text style={styles.deadlineText}>{formatDateDDMMYYYY(targetEndDate)}</Text>
              </View>
            </View>
            <View style={styles.progressBarRow}>
              <View style={styles.progressBarContainer}>
                <ProgressBar
                  percentage={progressPercentage}
                  height={8}
                  color={colors.dark900}
                  backgroundColor="rgba(0,0,0,0.05)"
                  showPercentage={false}
                  animated
                />
              </View>
              <Text style={styles.progressBarPercentage}>
                {Math.round(progressPercentage)}%
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Bottom Sheet — Actions du livre */}
        <Modal
          visible={menuVisible}
          transparent
          animationType="none"
          statusBarTranslucent
          onRequestClose={() => setMenuVisible(false)}
        >
          {/* Overlay sombre avec blur */}
          <Animated.View
            style={styles.sheetOverlay}
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
          >
            <Pressable
              style={styles.sheetBackdrop}
              onPress={() => setMenuVisible(false)}
            />
          </Animated.View>

          {/* Le sheet — glisse depuis le bas, sans rebond */}
          <Animated.View
            style={styles.sheetContainer}
            entering={SlideInDown.duration(300)}
            exiting={SlideOutDown.duration(200)}
          >
            {/* Titre + couverture du livre */}
            <View style={styles.sheetHeader}>
              <Image
                source={resolveImage(coverUrl)}
                style={styles.sheetCover}
                contentFit="cover"
              />
              <View style={styles.sheetHeaderTexts}>
                <Text style={styles.sheetTitle} numberOfLines={1}>
                  {bookTitle}
                </Text>
                <Text style={styles.sheetSubtitle} numberOfLines={1}>
                  {bookAuthor || 'Auteur inconnu'}
                </Text>
              </View>
              <Pressable
                onPress={() => setMenuVisible(false)}
                hitSlop={12}
                style={styles.sheetCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
              >
                <Ionicons name="close" size={22} color={colors.textSubtle} />
              </Pressable>
            </View>

            <View style={styles.sheetDivider} />

            {/* Actions */}
            <View style={styles.sheetActions}>
              <Pressable
                onPress={handleInvitePress}
                style={({ pressed }) => [
                  styles.sheetAction,
                  pressed && styles.sheetActionPressed,
                ]}
                accessibilityRole="button"
              >
                <View style={styles.sheetActionIcon}>
                  <IconUserPlus size={20} color={colors.textPrimary} />
                </View>
                <View style={styles.sheetActionTexts}>
                  <Text style={styles.sheetActionTitle}>Inviter un ami</Text>
                </View>
                <IconChevronRight size={18} color={colors.textSubtle} />
              </Pressable>

              <Pressable
                onPress={handleEditPress}
                style={({ pressed }) => [
                  styles.sheetAction,
                  pressed && styles.sheetActionPressed,
                ]}
                accessibilityRole="button"
              >
                <View style={styles.sheetActionIcon}>
                  <IconPencil size={20} color={colors.textPrimary} />
                </View>
                <View style={styles.sheetActionTexts}>
                  <Text style={styles.sheetActionTitle}>Modifier le livre</Text>
                </View>
                <IconChevronRight size={18} color={colors.textSubtle} />
              </Pressable>

              <Pressable
                onPress={handleEditDeadlinePress}
                style={({ pressed }) => [
                  styles.sheetAction,
                  pressed && styles.sheetActionPressed,
                ]}
                accessibilityRole="button"
              >
                <View style={styles.sheetActionIcon}>
                  <IconCalendar size={20} color={colors.textPrimary} />
                </View>
                <View style={styles.sheetActionTexts}>
                  <Text style={styles.sheetActionTitle}>Modifier la deadline</Text>
                </View>
                <IconChevronRight size={18} color={colors.textSubtle} />
              </Pressable>

              <Pressable
                onPress={handleSetIntermediateGoalPress}
                style={({ pressed }) => [
                  styles.sheetAction,
                  pressed && styles.sheetActionPressed,
                ]}
                accessibilityRole="button"
              >
                <View style={styles.sheetActionIcon}>
                  <Ionicons name="flag-outline" size={20} color={colors.textPrimary} />
                </View>
                <View style={styles.sheetActionTexts}>
                  <Text style={styles.sheetActionTitle}>Définir un objectif intermédiaire</Text>
                </View>
                <IconChevronRight size={18} color={colors.textSubtle} />
              </Pressable>
            </View>

            <View style={styles.sheetDivider} />

            {/* Action destructive isolée */}
            <View style={styles.sheetActions}>
              <Pressable
                onPress={handleDeletePress}
                style={({ pressed }) => [
                  styles.sheetAction,
                  pressed && styles.sheetActionPressed,
                ]}
                accessibilityRole="button"
              >
                <View style={[styles.sheetActionIcon, styles.sheetActionIconDanger]}>
                  <IconTrash size={20} color={colors.error} />
                </View>
                <View style={styles.sheetActionTexts}>
                  <Text style={[styles.sheetActionTitle, styles.sheetActionDanger]}>
                    Supprimer définitivement le livre
                  </Text>
                </View>
              </Pressable>
            </View>
          </Animated.View>
        </Modal>

        {/* Modal d'invitation — identique à l'écran onboarding/complete */}
        <Modal
          visible={inviteVisible}
          transparent
          animationType="none"
          statusBarTranslucent
          onRequestClose={() => setInviteVisible(false)}
        >
          <Animated.View
            style={styles.sheetOverlay}
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
          >
            <Pressable
              style={styles.sheetBackdrop}
              onPress={() => setInviteVisible(false)}
            />
          </Animated.View>

          <Animated.View
            style={styles.sheetContainer}
            entering={SlideInDown.duration(300)}
            exiting={SlideOutDown.duration(200)}
          >
            {/* Croix de fermeture */}
            <View style={styles.inviteCloseRow}>
              <Pressable
                onPress={() => setInviteVisible(false)}
                hitSlop={12}
                style={styles.sheetCloseBtn}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
              >
                <Ionicons name="close" size={22} color={colors.textSubtle} />
              </Pressable>
            </View>

            {/* Carte livre + code — structure identique à l'onboarding */}
            <View style={styles.inviteCardWrapper}>
              {/* Carte dark du livre (au premier plan) */}
              <View style={styles.inviteBookCard}>
                {/* Texture de fond */}
                <Image
                  source={require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png')}
                  style={styles.inviteCardTexture}
                  contentFit="cover"
                />

                <View style={styles.inviteBookCardContent}>
                  {/* Cover image */}
                  <Image
                    source={resolveImage(coverUrl)}
                    style={styles.inviteCoverImage}
                    contentFit="cover"
                  />

                  {/* Infos livre */}
                  <View style={styles.inviteBookInfo}>
                    <Text style={styles.inviteAuthor} numberOfLines={1}>
                      {bookAuthor || 'Auteur inconnu'}
                    </Text>
                    <Text style={styles.inviteBookTitle} numberOfLines={2}>
                      {bookTitle}
                    </Text>
                    <View style={styles.invitePagesBadge}>
                      <Text style={styles.invitePagesText}>{totalPages} pages</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Zone code (en arrière-plan, sous le bloc noir) */}
              <View style={styles.inviteCodeZone}>
                <Text style={styles.inviteCodeLabel}>Code pour rejoindre :</Text>
                <View style={styles.inviteCodeRow}>
                  <Text style={styles.inviteCodeText}>
                    {inviteCode ? inviteCode.split('').join(' ') : '------'}
                  </Text>
                  <Pressable
                    onPress={handleCopyCode}
                    style={({ pressed }) => [
                      styles.inviteCopyButton,
                      pressed && { opacity: 0.6 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Copier le code d'invitation"
                  >
                    <IconCopy size={20} color={colors.textPlaceholder} />
                  </Pressable>
                </View>
              </View>

              {/* Pop eyes en overlay — dépasse du bloc */}
              <View style={styles.inviteMascotOverlay} pointerEvents="none">
                <PopEyes size="large" />
              </View>
            </View>

            {/* Bouton partager */}
            <View style={styles.inviteFooter}>
              <Button3D
                onPress={handleShareInvite}
                variant="primary"
                icon="share-outline"
                iconPosition="left"
                style={{ width: '100%' }}
              >
                Inviter un.e ami.e
              </Button3D>
            </View>
          </Animated.View>
        </Modal>
      </Animated.View>
    </Pressable>
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ═══ ÉTAT FERMÉ ═══
  closedContainer: {
    width: '100%',
    overflow: 'visible', // Les covers empilées peuvent sortir à gauche
  },
  // Carte du livre actif — flexDirection: row pour cover + infos côte à côte.
  // alignItems: stretch = la cover prend la hauteur de la section (bookInfo).
  activeCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  /** En gros corps de texte : une seule colonne, couverture au-dessus */
  activeCardStacked: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  // Zone de la couverture — s'adapte à la hauteur de la section en gardant le ratio 50:70.
  // Même ratio que les covers de l'étagère (SHELF_COVER_W / SHELF_COVER_H).
  coverArea: {
    flex: 0,
    alignSelf: 'stretch',
    aspectRatio: COVER_RATIO_W / COVER_RATIO_H,
    overflow: 'visible',
  },
  /** Taille arrêtée : la couverture ne suit plus la hauteur du texte */
  coverAreaFixed: {
    alignSelf: 'flex-start',
    height: SHELF_COVER_H,
  },
  // Cover empilée (absolute, derrière la cover active) — remplit coverArea
  stackedCover: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: '100%',
    // left est appliqué dynamiquement : -((otherCovers.length - index) * STACK_VISIBLE)
    // zIndex est appliqué dynamiquement : index
  },
  smallCoverShadow: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.26,
    shadowRadius: 4,
    elevation: 4,
  },
  smallCover: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  // Conteneur shadow pour la cover active (état non terminé)
  activeCoverShadow: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.26,
    shadowRadius: 4,
    elevation: 4,
  },
  activeCover: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  // Wrapper de la cover active — remplit coverArea (position absolute)
  activeCoverWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  bookInfo: {
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  /** En colonne unique, le texte occupe toute la largeur */
  bookInfoStacked: {
    flex: 0,
    alignSelf: 'stretch',
    paddingHorizontal: 0,
  },
  // En-tête : textes + menu
  bookHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  bookTexts: {
    flex: 1,
    gap: 8,
  },
  menuButton: {
    padding: 4,
    marginLeft: spacing.sm,
  },
  // Pied : badges (pages + deadline) + barre
  bookFooter: {
    flexDirection: 'column',
    gap: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
  },
  /*
    En gros corps de texte, les deux badges ne tiennent plus côte à côte.
    On passe en colonne plutôt qu'en `flexWrap` : dans une rangée qui revient
    à la ligne, chaque badge s'étire sur toute la largeur et son texte finit
    rogné. En colonne, chacun garde la largeur de son contenu.
  */
  badgesRowWrap: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  progressBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarContainer: {
    flex: 1,
    minWidth: 0,
  },
  progressBarPercentage: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: 14,
    color: colors.textPlaceholder,
  },
  // Ancien styles maintenant inutilisés mais conservés pour compatibilité
  bookDetails: {
    flex: 1,
    marginRight: spacing.sm,
  },
  textAndBadge: {
    gap: 8,
  },
  author: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: 16,
    color: colors.textTertiary,
  },
  title: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 18,
    color: colors.textPrimary,
  },
  pagesBadge: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  pagesText: {
    fontFamily: 'WorkSans_500Medium',
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  deadlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  deadlineText: {
    fontFamily: 'WorkSans_500Medium',
    fontSize: 14,
    color: colors.textPrimary,
  },

  // ═══ BOTTOM SHEET — ACTIONS DU LIVRE ═══

  // Overlay sombre couvrant tout l'écran
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  // Zone pressable pour fermer le sheet en touchant l'overlay
  sheetBackdrop: {
    flex: 1,
  },
  // Conteneur principal du bottom sheet — ancré en bas de l'écran
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32, // espace pour le home indicator
    // Shadow vers le haut
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
  },
  // Handle — petite barre horizontale indiquant que le sheet est draggable
  // Header — couverture + titre/auteur du livre sélectionné
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 16,
  },
  sheetCloseBtn: { padding: 4, marginLeft: 'auto' },
  inviteCloseRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  sheetCover: {
    width: 44,
    height: 62,
    borderRadius: 4,
  },
  sheetHeaderTexts: {
    flex: 1,
    gap: 4,
  },
  sheetTitle: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
  },
  sheetSubtitle: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: 13,
    color: colors.textTertiary,
  },
  // Séparateur fin entre les sections
  sheetDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginHorizontal: 24,
  },
  // Zone d'actions — contient les lignes d'action
  sheetActions: {
    paddingVertical: 8,
  },
  // Ligne d'action individuelle
  sheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 16,
  },
  sheetActionPressed: {
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  // Icône dans un cercle léger
  sheetActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetActionIconDanger: {
    backgroundColor: colors.errorLight,
  },
  // Textes de l'action (titre + description)
  sheetActionTexts: {
    flex: 1,
    gap: 2,
  },
  sheetActionTitle: {
    fontFamily: 'WorkSans_500Medium',
    fontSize: 15,
    color: colors.textPrimary,
  },
  sheetActionDesc: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: 12,
    color: colors.textTertiary,
  },
  sheetActionDanger: {
    color: colors.error,
  },

  // ═══ MODAL D'INVITATION (identique à onboarding/complete) ═══

  // Wrapper carte + code — overflow visible pour le PopEyes
  inviteCardWrapper: {
    position: 'relative',
    overflow: 'visible',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  // Carte dark du livre — premier plan (z-index 2)
  inviteBookCard: {
    backgroundColor: colors.dark800,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
    zIndex: 2,
    elevation: 2,
  },
  inviteCardTexture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
  },
  // PopEyes en overlay — dépasse du bloc en haut à droite
  inviteMascotOverlay: {
    position: 'absolute',
    top: -48,
    right: spacing.sm,
    zIndex: 9999,
    elevation: 9999,
  },
  // Contenu de la carte : cover + infos côte à côte
  inviteBookCardContent: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  inviteCoverImage: {
    aspectRatio: 52 / 73,
    borderRadius: borderRadius.xs,
    borderWidth: 1,
    borderColor: colors.alphaWhite10,
    alignSelf: 'stretch',
  },
  inviteBookInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  inviteAuthor: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: 14,
    color: colors.textSubtle,
  },
  inviteBookTitle: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 16,
    color: colors.white,
  },
  invitePagesBadge: {
    backgroundColor: colors.alphaWhite20,
    borderWidth: 1,
    borderColor: colors.alphaWhite10,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  invitePagesText: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: 12,
    color: colors.white,
  },
  // Zone code — fond clair, sous le bloc noir
  inviteCodeZone: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.alphaBlack02,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
    marginTop: -1,
    zIndex: 1,
    elevation: 1,
  },
  inviteCodeLabel: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: 14,
    color: colors.textPlaceholder,
  },
  inviteCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inviteCodeText: {
    fontFamily: 'Rokkitt_500Medium',
    fontSize: 36,
    color: colors.textPrimary,
    letterSpacing: -0.72,
  },
  inviteCopyButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bgLight,
  },
  inviteFooter: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },

  // ═══ ÉTAT OUVERT (étagère) ═══

  // Conteneur principal — overflow visible pour que les covers
  // ne soient pas coupées quand on scrolle au-delà de la zone.
  // paddingBottom réserve la place pour la barre d'étagère.
  openContainer: {
    width: '100%',
    overflow: 'visible',
    paddingBottom: SHELF_BAR_H - SHELF_OVERLAP, // espace net sous les covers
  },

  // La FlatList elle-même — overflow visible pour pas couper les covers
  // zIndex: 1 = SOUS la barre d'étagère (la barre passe par-dessus les covers)
  shelfList: {
    overflow: 'visible',
    zIndex: 1,
  },

  // contentContainer de la FlatList
  shelfContent: {
    alignItems: 'flex-end',    // covers alignées en bas (posées sur l'étagère)
    paddingHorizontal: spacing.lg,
    overflow: 'visible',
  },

  // ── Cover en cours (non terminée) ──
  // Wrapper avec radius 2px (comme Figma) et shadow latérale
  shelfCoverWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  shelfCoverShadow: {
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.26,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden', // Clip l'image aux coins arrondis du conteneur
  },
  shelfCover: {
    width: SHELF_COVER_W,
    height: SHELF_COVER_H,
    borderRadius: 2,
  },

  // ── Cover terminée (100%) ──
  // Conteneur global qui porte la shadow — remplit le parent (état fermé flexible)
  // En mode étagère, shelfDoneCover override avec dimensions fixes
  doneCoverContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.26,
    shadowRadius: 4,
    elevation: 4,
  },
  shelfDoneCover: {
    width: SHELF_COVER_W,
    height: SHELF_COVER_H,
  },
  // Fond dark derrière la cover — déborde de 3px de chaque côté
  doneCoverBackground: {
    position: 'absolute',
    left: -3,
    top: -3,
    right: -3,
    bottom: -3,
    borderRadius: 2,
    backgroundColor: colors.dark900,
    overflow: 'hidden',
  },
  // Overlay pour simuler les inner shadows du Figma
  // En React Native on ne peut pas faire box-shadow: inset, donc on utilise
  // des bordures à épaisseur variable avec des couleurs semi-transparentes :
  // - haut/gauche : reflet lumineux (blanc transparent)
  // - bas/droite : ombre profonde (noir transparent)
  doneCoverInnerShadow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 2,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderRightWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.20)',
    borderLeftColor: 'rgba(255,255,255,0.15)',
    borderBottomColor: 'rgba(0,0,0,0.35)',
    borderRightColor: 'rgba(0,0,0,0.20)',
  },
  // Cover terminée — remplit le parent (fermé = 100% du wrapper, étagère = 100% du conteneur COVER_W×COVER_H)
  shelfCoverDone: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  // Badge marque-page SVG — positionné en haut à gauche
  // Il déborde légèrement au-dessus de la cover (top: -2)
  doneBadge: {
    position: 'absolute',
    top: -2,
    left: 4,
    width: 14,
    height: 18,
  },

  // Wrapper du bouton + — aligné verticalement avec les covers.
  // Le bouton 40px est centré par rapport à la hauteur des covers (SHELF_COVER_H).
  addButtonWrapper: {
    alignSelf: 'flex-end',
    marginBottom: (SHELF_COVER_H - ADD_BTN_SIZE) / 2,
  },

  // Wrapper animé de la barre d'étagère — positionnée en absolute, AU PREMIER PLAN
  // (zIndex: 2) pour passer PAR-DESSUS le bas des covers.
  // overflow: 'hidden' est essentiel pour que le blur respecte le borderRadius.
  shelfBarOuter: {
    position: 'absolute',
    bottom: -6,
    left: 0,
    right: 0,
    height: SHELF_BAR_H,
    borderRadius: 10,
    overflow: 'hidden',           // clip le blur aux coins arrondis
    zIndex: 2,                    // AU-DESSUS des covers
  },

  // Contenu de la barre d'étagère — BlurView avec fond noir 30% d'opacité
  // L'effet de blur crée une transparence vitrée plutôt qu'un noir plein.
  shelfBar: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },

});
