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
import React, { useCallback, useRef } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
  const scrollRef = useRef<FlatList>(null);
  const scrollX = useRef(0);

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

  // ─── Handlers étagère ouverte ────────────────────────────────

  const handleCoverPress = useCallback(
    (challenge: Challenge) => {
      onSelectChallenge(challenge);
    },
    [onSelectChallenge]
  );

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollX.current = e.nativeEvent.contentOffset.x;
    },
    []
  );

  // ─── RENDU : ÉTAT OUVERT (étagère) ──────────────────────────

  if (isOpen) {
    return (
      // overflow: visible permet aux covers de NE PAS être coupées
      // quand elles sortent de la zone de scroll pendant le drag
      <View style={styles.openContainer}>
        {/* Barre d'étagère dark — positionnée en absolute,
            elle remonte de SHELF_OVERLAP px sur les covers pour
            donner l'effet "posé sur l'étagère" */}
        <View style={styles.shelfBar}>
          <View style={styles.shelfDot} />
          <View style={styles.shelfDot} />
        </View>

        {/* Rangée scrollable de couvertures — au-dessus de la barre */}
        <FlatList
          ref={scrollRef}
          data={allChallenges}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.shelfList}
          contentContainerStyle={styles.shelfContent}
          ItemSeparatorComponent={() => <View style={{ width: COVER_GAP }} />}
          renderItem={({ item }) => {
            // Un livre est "terminé" quand le challenge est marqué completed
            // OU quand la progression moyenne atteint 100%
            const isDone =
              item.status === 'completed' ||
              item.average_progress_percentage >= 100;

            return (
              <Pressable
                onPress={() => handleCoverPress(item)}
                style={({ pressed }) => [
                  styles.shelfCoverWrapper,
                  pressed && { opacity: 0.85 },
                ]}
              >
                {isDone ? (
                  // ── LIVRE TERMINÉ ──
                  // Structure : fond dark (plus grand) + inner shadow overlay
                  //           → cover carrée (2px radius) par-dessus
                  //           → badge marque-page ✓ en haut à gauche
                  <View style={styles.doneCoverContainer}>
                    {/* 1. Fond dark derrière la cover (57×76, déborde de 3px) */}
                    <View style={styles.doneCoverBackground}>
                      {/* Overlay pour simuler les inner shadows Figma */}
                      <View style={styles.doneCoverInnerShadow} />
                    </View>

                    {/* 2. Image de la couverture (coins carrés) */}
                    <Image
                      source={resolveImage(item.cover_url)}
                      style={styles.shelfCoverDone}
                      contentFit="cover"
                    />

                    {/* 3. Badge marque-page SVG avec checkmark */}
                    <BookmarkCheckBadge />
                  </View>
                ) : (
                  // ── LIVRE EN COURS ──
                  // Structure : conteneur avec shadow + coins arrondis (20px)
                  //           → cover arrondie à l'intérieur
                  <View style={styles.shelfCoverShadow}>
                    <Image
                      source={resolveImage(item.cover_url)}
                      style={styles.shelfCover}
                      contentFit="cover"
                    />
                  </View>
                )}
              </Pressable>
            );
          }}
          ListFooterComponent={() => (
            <Pressable
              onPress={onAddBook}
              style={({ pressed }) => [
                styles.addButton,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Ionicons name="add" size={24} color={colors.white} />
            </Pressable>
          )}
          ListFooterComponentStyle={{ marginLeft: COVER_GAP }}
        />
      </View>
    );
  }

  // ─── RENDU : ÉTAT FERMÉ (pile empilée) ──────────────────────
  //
  // Structure : le livre actif est ancré à GAUCHE (avec le padding parent de 16px).
  // Les covers empilées sont positionnées en absolute DERRIÈRE la cover active,
  // décalées vers la gauche. Elles peuvent sortir de l'écran, c'est normal.
  //
  // Pourquoi ? Si l'utilisateur a 10+ livres, le titre/auteur doit toujours
  // rester lisible. En ancrant à gauche, l'espace pour le texte ne rétrécit jamais.

  const isActiveDone =
    activeChallenge.status === 'completed' ||
    activeChallenge.average_progress_percentage >= 100;

  return (
    <Pressable onPress={onToggle} style={styles.closedContainer}>
      <View style={styles.activeCard}>
        {/* Zone couverture : cover active au premier plan + pile derrière */}
        <View style={styles.coverArea}>
          {/* Covers empilées — positionnées en absolute, décalées vers la gauche.
              Chaque cover est décalée de STACK_VISIBLE (10px) de plus que la précédente.
              Les zIndex croissants assurent que les covers les plus proches de l'active
              sont visuellement au-dessus des plus éloignées. */}
          {otherCovers.map((cover, index) => (
            <View
              key={`bg-cover-${index}`}
              style={[
                styles.stackedCover,
                {
                  left: -((otherCovers.length - index) * STACK_VISIBLE),
                  zIndex: index,
                },
              ]}
            >
              <View style={styles.smallCoverShadow}>
                <Image
                  source={resolveImage(cover)}
                  style={styles.smallCover}
                  contentFit="cover"
                />
              </View>
            </View>
          ))}

          {/* Cover active — toujours au premier plan (zIndex le plus haut) */}
          <View style={{ zIndex: otherCovers.length + 1 }}>
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
          </View>
        </View>

        {/* Infos : auteur, titre, badge pages, progression */}
        <View style={styles.bookInfo}>
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
        </View>
      </View>
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
    gap: 4,
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
