/**
 * PageSection — le cadre « Ma page » de l'accueil.
 *
 * Deuxième question de l'accueil : où j'en suis. C'est aussi le geste principal
 * de l'app — enregistrer sa page en un geste.
 *
 * - Sans titre : le cadre sort de sous « Le livre » et son haut s'efface, sans
 *   coins ; le bas garde l'arrondi et le bord d'un cadre (retour de Lea, 2026-09-29). À droite, ma série en **jours**
 *   (jamais « soirs » : on ne suppose pas quand les gens lisent).
 * - Le sélecteur qui défile est gardé (pas de − / +), resserré pour tenir dans
 *   le cadre. Ma page est en **pages de mon édition**, d'où le « / 624 ».
 * - La rangée du bas a une **hauteur fixe** :
 *   - au repos, la barre d'actions rapides (`QuickNoteBar`) : écrire, vocal,
 *     photo, emoji, sur ma page **enregistrée** ;
 *   - pendant un défilement, ↺ annuler, « +14 », ✓ enregistrer.
 *   La barre s'efface pendant le défilement : il n'y a jamais de doute sur la
 *   page notée.
 */

import { CheckIcon, FlameIcon, RotateCcwIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../../utils/constants';
import GlassSection from './GlassSection';
import PageScrollPicker from './PageScrollPicker';
import RoundButton from './RoundButton';
import { QUICK_BAR_HEIGHT } from './QuickNoteBar';

interface PageSectionProps {
  /** Page affichée par le sélecteur */
  currentPage: number;
  /** Dernière page enregistrée */
  savedPage: number;
  /** Nombre de pages de MON édition */
  totalPages: number;
  /** Jours consécutifs de lecture, 0 = pas de série */
  streakDays: number;
  onPageChange: (page: number) => void;
  onSave: () => void;
  onUndo: () => void;
  /** Mon journal (le titre qui l'ouvrait est retiré ; gardé pour y revenir) */
  onJournalPress?: () => void;
  /** La barre d'actions rapides, au repos */
  quickBar?: React.ReactNode;
  /** Petit écran : marges resserrées, pour que l'accueil tienne sans défiler */
  compact?: boolean;
  /** Taille du chiffre, choisie par l'accueil selon la hauteur de l'écran */
  pickerFontSize?: number;
}

export default function PageSection({
  currentPage,
  savedPage,
  totalPages,
  streakDays,
  onPageChange,
  onSave,
  onUndo,
  quickBar,
  compact = false,
  pickerFontSize = PICKER_FONT_SIZE,
}: PageSectionProps) {
  // Le sélecteur centre la page sur la largeur qu'on lui donne : ici celle du
  // cadre, pas celle de l'écran.
  const [pickerWidth, setPickerWidth] = useState(0);
  const onPickerLayout = (e: LayoutChangeEvent) => setPickerWidth(e.nativeEvent.layout.width);

  const delta = currentPage - savedPage;
  const hasChanged = delta !== 0;

  return (
    // Le cadre remplit la place que l'accueil lui donne ; le chiffre est centré dedans
    <GlassSection compact={compact} fadeTop={PAGE_FADE} style={styles.frame}>
      {/* Le haut est sous « Le livre » : le contenu commence sous le fondu. La
          série se pose dans le coin, sans prendre de hauteur. */}
      <View style={styles.tuck} />
      {streakDays > 0 && (
        <View style={styles.streak} accessible accessibilityLabel={`Série de ${streakDays} jours`}>
          <FlameIcon size={14} color={colors.textTertiary} fill={colors.textTertiary} />
          <Text style={styles.streakText}>{streakDays} j</Text>
        </View>
      )}

      {/* Le chiffre et son « / 624 », ensemble, centrés dans la place du cadre */}
      <View style={styles.center}>
      {/* Les voisins du chiffre sont coupés au bord du cadre */}
      <View style={styles.picker} onLayout={onPickerLayout}>
        {pickerWidth > 0 && (
          <PageScrollPicker
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            savedPage={savedPage}
            width={pickerWidth}
            itemWidth={PICKER_ITEM_WIDTH}
            fontSize={pickerFontSize}
          />
        )}
      </View>

      {/* « / 624 » à l'écran ; VoiceOver lirait « barre oblique », on lui dit « sur » */}
      <Text style={styles.total} accessibilityLabel={`sur ${totalPages} pages`}>
        / {totalPages}
      </Text>
      </View>

      {hasChanged ? (
        <View style={styles.row}>
          <RoundButton
            icon={RotateCcwIcon}
            variant="ghost"
            label="Annuler"
            hint="Revient à ma dernière page enregistrée"
            onPress={onUndo}
          />
          {/* Ce que je viens de lire */}
          <Text style={styles.deltaText}>
            {delta > 0 ? '+' : '−'}
            {Math.abs(delta)}
          </Text>
          <RoundButton icon={CheckIcon} variant="dark" label="Enregistrer ma page" onPress={onSave} />
        </View>
      ) : (
        <View style={styles.bar}>{quickBar}</View>
      )}
    </GlassSection>
  );
}

// ─── Styles ────────────────────────────────────────────────────────
// Mesures de la maquette (échelle 0,865) ramenées en points.

/** Ce que « Ma page » glisse sous « Le livre », et la hauteur de son fondu */
export const PAGE_TUCK = 28;
const PAGE_FADE = 44;

/** Trois nombres visibles à la fois : le mien au centre, ses deux voisins effacés */
const PICKER_ITEM_WIDTH = 120;
/** Le chiffre et sa zone reprennent la maquette (68 et 76 px à l'échelle 0,865) */
const PICKER_FONT_SIZE = 68;

const styles = StyleSheet.create({
  // minHeight : le titre grandit avec le réglage système au lieu d'être coupé
  tuck: {
    height: PAGE_TUCK - spacing.sm,
  },
  streak: {
    position: 'absolute',
    zIndex: 1,
    top: PAGE_TUCK + spacing.sm,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  streakText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },

  frame: {
    flexGrow: 1,
  },
  center: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  picker: {
    marginTop: 2,
    marginHorizontal: -spacing.lg, // le sélecteur va jusqu'aux bords du cadre
    overflow: 'hidden',
  },
  total: {
    marginTop: -5,
    textAlign: 'center',
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textPlaceholder,
    fontVariant: ['tabular-nums'],
  },

  // Hauteur fixe, celle de la barre : les boutons apparaissent sans rien déplacer
  row: {
    height: QUICK_BAR_HEIGHT,
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bar: {
    height: QUICK_BAR_HEIGHT,
    marginTop: spacing.sm,
  },
  deltaText: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 17,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
});
