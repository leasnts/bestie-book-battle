/**
 * Composant ActiveBookCard
 *
 * Premier bloc de l'accueil : le livre que tu es en train de lire.
 *
 * [couverture] [auteur, titre, ⋮]
 *              [pages] [deadline]
 *              [barre de progression du groupe  %]
 *
 * Changer de livre ne se fait plus ici : la pile de couvertures et l'étagère
 * dépliable ont laissé la place au bouton bibliothèque de l'en-tête, qui ouvre
 * la route /library.
 *
 * Le menu ⋮ ouvre les actions du livre (inviter, modifier, deadline, objectif,
 * supprimer) et la modal d'invitation avec le code à partager.
 */

import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Challenge } from '../../types/supabase';
import { borderRadius, colors, fonts, inkAlpha, shadowAlpha, spacing } from '../../utils/constants';
import Button3D from '../Button3D';
import PopEyes from '../PopEyes';
import BookCover, { COVER_RATIO, isChallengeDone, resolveCoverImage } from './BookCover';
import { ProgressBar } from './ProgressBar';
import {
  CalendarIcon,
  ChevronRightIcon,
  CopyIcon,
  EllipsisVerticalIcon,
  FlagIcon,
  PencilIcon,
  ShareIcon,
  Trash2Icon,
  UserPlusIcon,
  XIcon,
} from 'lucide-react-native';

/** Formate une date ISO en JJ/MM/AAAA */
function formatDateDDMMYYYY(iso: string | null | undefined): string {
  if (!iso) return '--/--/----';
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// ─── Props ───────────────────────────────────────────────────────────

interface ActiveBookCardProps {
  /** Le livre en cours */
  challenge: Challenge;
  /** Pourcentage de progression moyen du groupe */
  progressPercentage: number;
  /** Appelé pour supprimer (quitter) le livre */
  onDeleteBook?: () => void;
  /** Appelé pour modifier le livre */
  onEditBook?: () => void;
  /** Appelé pour modifier la deadline globale du livre */
  onEditDeadline?: () => void;
  /** Appelé pour définir un objectif intermédiaire (ex: lire X pages d'ici mercredi) */
  onSetIntermediateGoal?: () => void;
}

// Hauteur de la couverture quand le texte passe dessous (gros corps de texte)
const STACKED_COVER_H = 110;

// ─── Composant principal ──────────────────────────────────────────

export default function ActiveBookCard({
  challenge,
  progressPercentage,
  onDeleteBook,
  onEditBook,
  onEditDeadline,
  onSetIntermediateGoal,
}: ActiveBookCardProps) {
  /*
    Au-delà d'un certain corps de texte, la carte passe de deux colonnes à une.

    Côte à côte, la couverture épouse la hauteur du bloc texte. Quand le texte
    double, il entraînerait la couverture avec lui — elle occuperait la moitié
    de l'écran et le titre se réduirait à « La bi… ». On restructure au lieu
    d'étirer : la couverture reprend une taille fixe et le texte passe dessous.
  */
  const { fontScale } = useWindowDimensions();
  const stackVertically = fontScale >= 1.35;

  const [menuVisible, setMenuVisible] = useState(false);
  const [inviteVisible, setInviteVisible] = useState(false);

  const bookTitle = challenge.book_title;
  const bookAuthor = challenge.book_author || '';
  const totalPages = challenge.total_pages;
  const coverUrl = challenge.cover_url;
  const inviteCode = challenge.invite_code || '';

  // ─── Handlers menu ────────────────────────────────────────────

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

  return (
    <Animated.View
      style={[styles.card, stackVertically && styles.cardStacked]}
      entering={FadeIn.duration(250)}
    >
      {/* Couverture */}
      <View style={[styles.coverArea, stackVertically && styles.coverAreaFixed]}>
        <BookCover coverUrl={coverUrl} done={isChallengeDone(challenge)} />
      </View>

      {/* Infos du livre + menu */}
      <View style={[styles.bookInfo, stackVertically && styles.bookInfoStacked]}>
        <View style={styles.bookHeader}>
          <View style={styles.bookTexts}>
            <Text style={styles.author} numberOfLines={2}>
              {bookAuthor || 'Auteur inconnu'}
            </Text>
            <Text style={styles.title} numberOfLines={2}>
              {bookTitle}
            </Text>
          </View>

          <Pressable
            onPress={() => setMenuVisible(true)}
            style={styles.menuButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Actions du livre"
          >
            <EllipsisVerticalIcon size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Badges (pages + deadline) + barre de progression */}
        <View style={styles.bookFooter}>
          <View style={[styles.badgesRow, stackVertically && styles.badgesRowWrap]}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalPages}p</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{formatDateDDMMYYYY(challenge.target_end_date)}</Text>
            </View>
          </View>
          <View style={styles.progressBarRow}>
            <View style={styles.progressBarContainer}>
              <ProgressBar
                percentage={progressPercentage}
                height={8}
                color={colors.dark900}
                backgroundColor={inkAlpha(0.05)}
                showPercentage={false}
                animated
              />
            </View>
            <Text style={styles.progressBarPercentage}>{Math.round(progressPercentage)}%</Text>
          </View>
        </View>
      </View>

      {/* Bottom Sheet — Actions du livre */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => setMenuVisible(false)}
      >
        <Animated.View
          style={styles.sheetOverlay}
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
        >
          <Pressable style={styles.sheetBackdrop} onPress={() => setMenuVisible(false)} />
        </Animated.View>

        <Animated.View
          style={styles.sheetContainer}
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(200)}
        >
          {/* Titre + couverture du livre */}
          <View style={styles.sheetHeader}>
            <Image
              source={resolveCoverImage(coverUrl)}
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
              <XIcon size={22} color={colors.textSubtle} />
            </Pressable>
          </View>

          <View style={styles.sheetDivider} />

          <View style={styles.sheetActions}>
            <SheetAction icon={UserPlusIcon} label="Inviter un ami" onPress={handleInvitePress} />
            <SheetAction icon={PencilIcon} label="Modifier le livre" onPress={handleEditPress} />
            <SheetAction
              icon={CalendarIcon}
              label="Modifier la deadline"
              onPress={handleEditDeadlinePress}
            />
            <SheetAction
              icon={FlagIcon}
              label="Définir un objectif intermédiaire"
              onPress={handleSetIntermediateGoalPress}
            />
          </View>

          <View style={styles.sheetDivider} />

          {/* Action destructive isolée */}
          <View style={styles.sheetActions}>
            <SheetAction
              icon={Trash2Icon}
              label="Supprimer définitivement le livre"
              onPress={handleDeletePress}
              destructive
            />
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
          <Pressable style={styles.sheetBackdrop} onPress={() => setInviteVisible(false)} />
        </Animated.View>

        <Animated.View
          style={styles.sheetContainer}
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(200)}
        >
          <View style={styles.inviteCloseRow}>
            <Pressable
              onPress={() => setInviteVisible(false)}
              hitSlop={12}
              style={styles.sheetCloseBtn}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
              <XIcon size={22} color={colors.textSubtle} />
            </Pressable>
          </View>

          {/* Carte livre + code — structure identique à l'onboarding */}
          <View style={styles.inviteCardWrapper}>
            <View style={styles.inviteBookCard}>
              <Image
                source={require('../../assets/images/61ea1e0c638b5b9c8100383a37a5b488848db623.png')}
                style={styles.inviteCardTexture}
                contentFit="cover"
              />

              <View style={styles.inviteBookCardContent}>
                <Image
                  source={resolveCoverImage(coverUrl)}
                  style={styles.inviteCoverImage}
                  contentFit="cover"
                />
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

            {/* Zone code (sous le bloc sombre) */}
            <View style={styles.inviteCodeZone}>
              <Text style={styles.inviteCodeLabel}>Code pour rejoindre :</Text>
              <View style={styles.inviteCodeRow}>
                <Text style={styles.inviteCodeText}>
                  {inviteCode ? inviteCode.split('').join(' ') : '------'}
                </Text>
                <Pressable
                  onPress={handleCopyCode}
                  style={({ pressed }) => [styles.inviteCopyButton, pressed && { opacity: 0.6 }]}
                  accessibilityRole="button"
                  accessibilityLabel="Copier le code d'invitation"
                >
                  <CopyIcon size={20} color={colors.textPlaceholder} />
                </Pressable>
              </View>
            </View>

            {/* PopEyes en overlay — dépasse du bloc */}
            <View style={styles.inviteMascotOverlay} pointerEvents="none">
              <PopEyes size="large" />
            </View>
          </View>

          <View style={styles.inviteFooter}>
            <Button3D
              onPress={handleShareInvite}
              variant="primary"
              icon={ShareIcon}
              iconPosition="left"
              style={{ width: '100%' }}
            >
              Inviter un.e ami.e
            </Button3D>
          </View>
        </Animated.View>
      </Modal>
    </Animated.View>
  );
}

// ─── Ligne d'action du menu ────────────────────────────────────────

function SheetAction({
  icon: Icon,
  label,
  onPress,
  destructive = false,
}: {
  icon: typeof PencilIcon;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.sheetAction, pressed && styles.sheetActionPressed]}
      accessibilityRole="button"
    >
      <View style={[styles.sheetActionIcon, destructive && styles.sheetActionIconDanger]}>
        <Icon size={20} color={destructive ? colors.error : colors.textPrimary} />
      </View>
      <Text
        style={[styles.sheetActionTitle, destructive && styles.sheetActionDanger]}
        numberOfLines={2}
      >
        {label}
      </Text>
      {!destructive && <ChevronRightIcon size={18} color={colors.textSubtle} />}
    </Pressable>
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ═══ CARTE ═══
  // Couverture + infos côte à côte. alignItems: stretch = la couverture prend
  // la hauteur du bloc texte.
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  /** En gros corps de texte : une seule colonne, couverture au-dessus */
  cardStacked: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  coverArea: {
    alignSelf: 'stretch',
    aspectRatio: COVER_RATIO,
  },
  /** Taille arrêtée : la couverture ne suit plus la hauteur du texte */
  coverAreaFixed: {
    alignSelf: 'flex-start',
    height: STACKED_COVER_H,
  },
  bookInfo: {
    flex: 1,
    paddingLeft: spacing.lg,
    gap: 8,
  },
  /** En colonne unique, le texte occupe toute la largeur */
  bookInfoStacked: {
    flex: 0,
    alignSelf: 'stretch',
    paddingLeft: 0,
  },
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
  bookFooter: {
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
    En colonne plutôt qu'en `flexWrap` : dans une rangée qui revient à la
    ligne, chaque badge s'étire et son texte finit rogné.
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
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPlaceholder,
  },
  author: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textTertiary,
  },
  title: {
    fontFamily: fonts.display,
    lineHeight: 26,
    fontSize: 21,
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: inkAlpha(0.08),
    borderWidth: 1,
    borderColor: inkAlpha(0.08),
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textPrimary,
  },

  // ═══ BOTTOM SHEET — ACTIONS DU LIVRE ═══
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: shadowAlpha(0.45),
  },
  sheetBackdrop: {
    flex: 1,
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32, // espace pour le home indicator
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
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
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  sheetSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textTertiary,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginHorizontal: 24,
  },
  sheetActions: {
    paddingVertical: 8,
  },
  sheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 16,
  },
  sheetActionPressed: {
    backgroundColor: inkAlpha(0.04),
  },
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
  sheetActionTitle: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.textPrimary,
  },
  sheetActionDanger: {
    color: colors.error,
  },

  // ═══ MODAL D'INVITATION (identique à onboarding/complete) ═══
  inviteCardWrapper: {
    position: 'relative',
    overflow: 'visible',
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
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
  inviteMascotOverlay: {
    position: 'absolute',
    top: -48,
    right: spacing.sm,
    zIndex: 9999,
    elevation: 9999,
  },
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
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textSubtle,
  },
  inviteBookTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
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
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.white,
  },
  inviteCodeZone: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.alphaBlack02,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.lg,
    gap: spacing.xs,
    marginTop: -1,
    zIndex: 1,
    elevation: 1,
  },
  inviteCodeLabel: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textPlaceholder,
  },
  inviteCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inviteCodeText: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.textPrimary,
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
});
