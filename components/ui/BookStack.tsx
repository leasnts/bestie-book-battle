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
import { Image } from 'expo-image';
import React, { useCallback } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Challenge, ParticipantWithProgress } from '../../types/supabase';
import { colors, spacing } from '../../utils/constants';
import CircularProgress from './CircularProgress';

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
}

// ─── Constantes de taille (Figma) ─────────────────────────────────

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
}: BookStackProps) {
  // On extrait les données du challenge actif
  const bookTitle = activeChallenge.book_title;
  const bookAuthor = activeChallenge.book_author || '';
  const totalPages = activeChallenge.total_pages;
  const coverUrl = activeChallenge.cover_url;

  // Les covers des autres challenges (pour la pile en mode fermé)
  const otherCovers = allChallenges
    .filter((c) => c.id !== activeChallenge.id)
    .map((c) => c.cover_url)
    .slice(0, 3);

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
          style={styles.shelfBar}
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
          <View style={styles.shelfDot} />
          <View style={styles.shelfDot} />
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
                      transform: [{ translateY: -COVER_H }],
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
                    <View style={styles.doneCoverContainer}>
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
            style={{ marginLeft: COVER_GAP }}
            entering={() => {
              'worklet';
              const delay = totalItems * DROP_STAGGER + 60;
              return {
                initialValues: {
                  transform: [{ translateY: -COVER_H }],
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
            <Pressable
              onPress={onAddBook}
              style={({ pressed }) => [
                styles.addButton,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Ionicons name="add" size={24} color={colors.white} />
            </Pressable>
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
        style={styles.activeCard}
        entering={FadeIn.duration(250)}
      >
        {/* Zone couverture : cover active + pile derrière */}
        <View style={styles.coverArea}>
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

          {/* Cover active — au premier plan */}
          <Animated.View
            style={{ zIndex: otherCovers.length + 1 }}
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

        {/* Infos : auteur, titre, badge pages, progression */}
        <Animated.View
          style={styles.bookInfo}
          entering={FadeIn.delay(100).duration(250)}
        >
          <View style={styles.bookDetails}>
            <View style={styles.textAndBadge}>
              <Text style={styles.author} numberOfLines={1}>
                {bookAuthor || 'Auteur inconnu'}
              </Text>
              <Text style={styles.title} numberOfLines={1}>
                {bookTitle}
              </Text>
              <View style={styles.pagesBadge}>
                <Text style={styles.pagesText}>{totalPages}p</Text>
              </View>
            </View>
          </View>

          {/* Progression circulaire */}
          <CircularProgress
            percentage={progressPercentage}
            size={56}
            strokeWidth={4}
          />
        </Animated.View>
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
  // Carte du livre actif — flexDirection: row pour cover + infos côte à côte
  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Zone de la couverture — dimensionnée par la cover active (50×70).
  // Les covers empilées sont en absolute et débordent vers la gauche.
  coverArea: {
    width: COVER_W,
    height: COVER_H,
    overflow: 'visible',
  },
  // Cover empilée (absolute, derrière la cover active)
  stackedCover: {
    position: 'absolute',
    top: 0,
    // left est appliqué dynamiquement : -((otherCovers.length - index) * STACK_VISIBLE)
    // zIndex est appliqué dynamiquement : index
  },
  smallCoverShadow: {
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.26,
    shadowRadius: 4,
    elevation: 4,
  },
  smallCover: {
    width: COVER_W,
    height: COVER_H,
    borderRadius: 2,
  },
  // Conteneur shadow pour la cover active (état non terminé)
  activeCoverShadow: {
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.26,
    shadowRadius: 4,
    elevation: 4,
  },
  activeCover: {
    width: COVER_W,
    height: COVER_H,
    borderRadius: 2,
  },
  bookInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  bookDetails: {
    flex: 1,
    marginRight: spacing.sm,
  },
  textAndBadge: {
    gap: 8,
  },
  author: {
    fontFamily: 'WorkSans_400Regular',
    fontSize: 12,
    color: colors.textTertiary,
    lineHeight: 18,
  },
  title: {
    fontFamily: 'WorkSans_600SemiBold',
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
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
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 18,
    textAlign: 'center',
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
    width: COVER_W,
    height: COVER_H,
    borderRadius: 2,
  },

  // ── Cover terminée (100%) ──
  // Conteneur global qui porte la shadow de l'ensemble (fond dark + cover)
  doneCoverContainer: {
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.26,
    shadowRadius: 4,
    elevation: 4,
  },
  // Fond dark derrière la cover — 57×76px, déborde de 3px de chaque côté
  // Ce fond crée l'effet "cadre sombre" autour de la couverture terminée
  doneCoverBackground: {
    position: 'absolute',
    left: -3,
    top: -3,
    width: DONE_BG_W,
    height: DONE_BG_H,
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
  // Cover terminée : coins presque carrés (2px)
  shelfCoverDone: {
    width: COVER_W,
    height: COVER_H,
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

  // Bouton + pour ajouter un livre — centré verticalement avec les covers.
  // La FlatList a alignItems: 'flex-end' (covers calées en bas).
  // Le bouton (40px) doit être centré par rapport aux covers (70px).
  // → marginBottom = (COVER_H - ADD_BTN_SIZE) / 2 = (70 - 40) / 2 = 15px
  addButton: {
    width: ADD_BTN_SIZE,
    height: ADD_BTN_SIZE,
    borderRadius: 12,
    backgroundColor: colors.dark900,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: (COVER_H - ADD_BTN_SIZE) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },

  // Barre d'étagère dark — positionnée en absolute, AU PREMIER PLAN
  // (zIndex: 2) pour passer PAR-DESSUS le bas des covers.
  // Ça donne l'effet visuel d'une vraie étagère qui cache le bas des livres.
  shelfBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHELF_BAR_H,
    backgroundColor: colors.dark900,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    zIndex: 2, // AU-DESSUS des covers
  },

  // Dots métalliques aux extrémités de la barre (Figma)
  shelfDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
});
