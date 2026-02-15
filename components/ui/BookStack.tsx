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
import { Challenge } from '../../types/supabase';
import { colors, spacing } from '../../utils/constants';
import CircularProgress from './CircularProgress';

// ─── Props ───────────────────────────────────────────────────────────

interface BookStackProps {
  /** Le challenge actuellement sélectionné (affiché en détail quand fermé) */
  activeChallenge: Challenge;
  /** Tous les challenges de l'utilisateur (affichés dans l'étagère quand ouvert) */
  allChallenges: Challenge[];
  /** Pourcentage de progression moyen du challenge actif */
  progressPercentage: number;
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
            const isActive = item.id === activeChallenge.id;
            // TODO: déterminer si un challenge est "terminé" (ex. progression >= 100%)
            const isDone = false;

            return (
              <Pressable
                onPress={() => handleCoverPress(item)}
                style={({ pressed }) => [
                  styles.shelfCoverWrapper,
                  pressed && { opacity: 0.85 },
                ]}
              >
                {/* Fond dark derrière les livres terminés */}
                {isDone && <View style={styles.doneCoverBackground} />}

                {/* Image de la couverture */}
                <View style={styles.shelfCoverShadow}>
                  <Image
                    source={resolveImage(item.cover_url)}
                    style={[
                      styles.shelfCover,
                      isActive && styles.shelfCoverActive,
                    ]}
                    contentFit="cover"
                  />
                </View>

                {/* Badge ✓ pour livres terminés */}
                {isDone && (
                  <View style={styles.doneBadge}>
                    <Ionicons name="checkmark" size={10} color={colors.white} />
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

  return (
    <Pressable onPress={onToggle} style={styles.closedContainer}>
      <View style={styles.stackRow}>
        {/* Les petites covers d'arrière-plan empilées */}
        {otherCovers.map((cover, index) => (
          <View
            key={`bg-cover-${index}`}
            style={[
              styles.smallCoverWrapper,
              { zIndex: index, marginRight: STACK_OVERLAP },
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

        {/* Le livre actif (premier plan) avec détails */}
        <View style={[styles.activeCoverWrapper, { zIndex: otherCovers.length + 1 }]}>
          <View style={styles.activeCard}>
            {/* Couverture du livre actif */}
            <Image
              source={resolveImage(coverUrl)}
              style={styles.activeCover}
              contentFit="cover"
            />

            {/* Infos : auteur, titre, badge pages */}
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
  },
  stackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  smallCoverWrapper: {
    // marginRight appliqué dynamiquement (STACK_OVERLAP)
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
  activeCoverWrapper: {
    flex: 1,
  },
  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 2,
  },
  activeCover: {
    width: COVER_W,
    height: COVER_H,
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.26,
    shadowRadius: 4,
    elevation: 4,
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
  },
  shelfCover: {
    width: COVER_W,
    height: COVER_H,
    borderRadius: 2,
  },
  shelfCoverActive: {
    // Même radius que les autres covers (2px) — pas de différence visuelle
    borderRadius: 2,
  },

  // Fond dark derrière une cover "terminée" (Figma: 57x76, dark900, inner shadows)
  doneCoverBackground: {
    position: 'absolute',
    left: -3,
    top: -3,
    width: DONE_BG_W,
    height: DONE_BG_H,
    borderRadius: 2,
    backgroundColor: colors.dark900,
  },

  // Badge ✓ en haut à gauche pour les livres terminés
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
