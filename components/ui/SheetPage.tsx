/**
 * SheetPage — LE squelette de tous les sheets de l'app.
 *
 *    ┌────────────────────────────────┐
 *    │            ───                 │  ← poignée d'iOS
 *    │ (‹)  Titre               (…)   │  ← retour si posé sur un sheet, titre, actions
 *    │      sous-titre                │
 *    │                                │
 *    │  contenu, marges de 16 pt      │
 *    │                                │
 *    │  [ Enregistrer ]               │  ← l'action principale, en bas du contenu
 *    └────────────────────────────────┘
 *
 * C'est la mise en page de la fiche du livre, sortie en composant pour que
 * chaque sheet (formulaire, liste, fiche) ait exactement le même en-tête, les
 * mêmes marges et la même hauteur : un seul type de sheet dans l'app.
 *
 * - La route est un `formSheet` natif : `sheetScreenOptions(null, …)` dans
 *   app/_layout.tsx. Pas de barre native, le titre vit ici.
 * - Ce composant EST la ScrollView de l'écran, sans View autour (condition des
 *   formSheet, cf. app/leaderboard.tsx).
 * - En-tête collant avec fondu dessous (`SheetStickyHeader`).
 * - `fit` (par défaut) : le sheet à la hauteur de son contenu, plafonné sous
 *   l'en-tête de l'accueil (`useFitSheet`). À désactiver pour un sheet à
 *   paliers fixes (recherche, carnet).
 * - Pas de croix : on ferme en glissant vers le bas, comme la fiche du livre.
 *   Posé sur un autre sheet (`onBack`), un rond « ‹ » y ramène.
 */

import { ChevronLeftIcon } from 'lucide-react-native';
import React, { forwardRef, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View, type ScrollViewProps } from 'react-native';
import { useFitSheet } from '../../hooks/useFitSheet';
import { colors, fonts, spacing } from '../../utils/constants';
import GlassButton from './GlassButton';
import { SheetStickyHeader, useSheetScrolled } from './SheetHeader';

/** Marge latérale de tous les sheets */
export const SHEET_GUTTER = spacing.lg;

interface SheetPageProps
  extends Omit<ScrollViewProps, 'children' | 'stickyHeaderIndices' | 'onScroll'> {
  title: string;
  /** Une ligne sous le titre (l'auteur d'un livre, le prénom d'une personne) */
  subtitle?: string | null;
  /** Posé sur un autre sheet : un retour à gauche du titre */
  onBack?: () => void;
  /** À droite du titre : des `GlassButton` de 36 pt */
  actions?: React.ReactNode;
  /** À la hauteur du contenu (par défaut) ; `false` pour un sheet à paliers */
  fit?: boolean;
  /** Le titre sur deux lignes au plus (un titre de livre) ; une par défaut */
  titleLines?: number;
  children: React.ReactNode;
}

const SheetPage = forwardRef<ScrollView, SheetPageProps>(function SheetPage(
  {
    title,
    subtitle,
    onBack,
    actions,
    fit = true,
    titleLines = 1,
    children,
    style,
    contentContainerStyle,
    onContentSizeChange,
    ...scrollProps
  },
  ref,
) {
  const sheet = useSheetScroll({ fit });

  return (
    <ScrollView
      ref={ref}
      {...sheet.scrollProps}
      style={[sheet.scrollProps.style, style]}
      contentContainerStyle={[sheet.scrollProps.contentContainerStyle, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      // Le clavier ne cache jamais le champ ni le bouton du bas
      automaticallyAdjustKeyboardInsets
      onContentSizeChange={(w, h) => {
        sheet.scrollProps.onContentSizeChange(w, h);
        onContentSizeChange?.(w, h);
      }}
      {...scrollProps}
    >
      <SheetPageHeader
        title={title}
        subtitle={subtitle}
        onBack={onBack}
        actions={actions}
        titleLines={titleLines}
        scrolled={sheet.scrolled}
      />
      {children}
    </ScrollView>
  );
});

export default SheetPage;

// ─── Pour une liste (FlatList) ─────────────────────────────────────

/**
 * Les réglages de défilement de `SheetPage`, pour un sheet qui est une
 * FlatList (classement, bibliothèque) : à étaler sur la liste, avec
 * `SheetPageHeader` en `ListHeaderComponent`.
 *
 *    const sheet = useSheetScroll();
 *    <FlatList {...sheet.scrollProps}
 *      ListHeaderComponent={<SheetPageHeader title="…" scrolled={sheet.scrolled} />} … />
 */
export function useSheetScroll({ fit = true }: { fit?: boolean } = {}) {
  const fitSheet = useFitSheet();
  const { scrolled, onScroll, scrollEventThrottle } = useSheetScrolled();
  const { onContentSizeChange: fitOnContentSizeChange } = fitSheet;
  const onContentSizeChange = useCallback(
    (w: number, h: number) => {
      if (fit) fitOnContentSizeChange(w, h);
    },
    [fit, fitOnContentSizeChange],
  );

  return {
    scrolled,
    scrollProps: {
      style: [styles.screen, fit && fitSheet.style],
      contentContainerStyle: styles.content,
      contentInsetAdjustmentBehavior: 'automatic' as const,
      showsVerticalScrollIndicator: false,
      onContentSizeChange,
      // L'en-tête reste en haut quand le sheet défile
      stickyHeaderIndices: [0],
      onScroll,
      scrollEventThrottle,
    },
  };
}

// ─── En-tête ───────────────────────────────────────────────────────

interface SheetPageHeaderProps {
  title: string;
  subtitle?: string | null;
  onBack?: () => void;
  actions?: React.ReactNode;
  titleLines?: number;
  /** Le contenu a défilé : le fondu sous l'en-tête apparaît */
  scrolled: boolean;
  /** Un décor derrière l'en-tête (l'aquarelle de la bibliothèque) */
  background?: React.ReactNode;
  /** Sous le titre, collé avec lui (les filtres de la bibliothèque) */
  children?: React.ReactNode;
}

/** L'en-tête de tous les sheets : retour, titre (et sous-titre), actions */
export function SheetPageHeader({
  title,
  subtitle,
  onBack,
  actions,
  titleLines = 1,
  scrolled,
  background,
  children,
}: SheetPageHeaderProps) {
  return (
    <SheetStickyHeader scrolled={scrolled} gutter={SHEET_GUTTER}>
      {background}
      <View style={styles.header}>
        {onBack && (
          <GlassButton icon={ChevronLeftIcon} size={36} onPress={onBack} accessibilityLabel="Retour" />
        )}
        <View style={styles.headerTexts}>
          <Text style={styles.title} numberOfLines={titleLines} accessibilityRole="header">
            {title}
          </Text>
          {!!subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        {actions && <View style={styles.actions}>{actions}</View>}
      </View>
      {children}
    </SheetStickyHeader>
  );
}

// ─── Pied ──────────────────────────────────────────────────────────

/** L'action principale d'un sheet, en bas du contenu, séparée de ce qui précède */
export function SheetFooter({ children }: { children: React.ReactNode }) {
  return <View style={styles.footer}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.white,
  },
  content: {
    // La marge sous la poignée est portée par l'en-tête collant
    paddingHorizontal: SHEET_GUTTER,
    // iOS ajoute déjà la zone du bas de l'écran (34 pt) sous le contenu
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 36,
    marginBottom: spacing.sm,
  },
  headerTexts: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 31,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textTertiary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignSelf: 'flex-start',
  },
  footer: {
    paddingTop: spacing.xl,
    gap: spacing.md,
  },
});
