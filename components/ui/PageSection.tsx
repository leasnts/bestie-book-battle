/**
 * PageSection — le cadre « Ma page » de l'accueil.
 *
 * Deuxième question de l'accueil : où j'en suis. C'est aussi le geste principal
 * de l'app — enregistrer sa page en un geste.
 *
 * - Sans titre : le cadre sort de sous « Le livre » et son haut s'efface, sans
 *   coins ; le bas garde l'arrondi et le bord d'un cadre (retour de Lea, 2026-09-29).
 * - Ma page en grand sur une **règle** qu'on fait glisser (`PageRuler`,
 *   2026-09-30). Ma page est en **pages de mon édition**, d'où le « sur 624 ».
 * - La rangée du bas a une **hauteur fixe** :
 *   - au repos, ma série en **jours** (jamais « soirs » : on ne suppose pas
 *     quand les gens lisent) et la barre d'actions rapides (`QuickNoteBar`) ;
 *   - quand la page a changé, ↺ annuler, « +14 », ✓ enregistrer.
 *   La barre s'efface : il n'y a jamais de doute sur la page notée.
 */

import { CheckIcon, FlameIcon, RotateCcwIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, spacing } from '../../utils/constants';
import GlassSection from './GlassSection';
import PageRuler from './PageRuler';
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
  pickerFontSize = 88,
}: PageSectionProps) {
  const delta = currentPage - savedPage;
  const hasChanged = delta !== 0;

  return (
    // Le cadre remplit la place que l'accueil lui donne ; le chiffre est centré dedans
    <GlassSection compact={compact} fadeTop={PAGE_FADE} style={styles.frame}>
      {/* Le haut est sous « Le livre » : le contenu commence sous le fondu */}
      <View style={styles.tuck} />

      <View style={styles.book}>
        <PageRuler
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          fontSize={pickerFontSize}
        />
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
        <View style={styles.bar}>
          {streakDays > 0 && (
            <View style={styles.streak} accessible accessibilityLabel={`Série de ${streakDays} jours`}>
              <FlameIcon size={14} color={colors.textTertiary} fill={colors.textTertiary} />
              <Text style={styles.streakText}>{streakDays} j</Text>
            </View>
          )}
          {quickBar}
        </View>
      )}
    </GlassSection>
  );
}

// ─── Styles ────────────────────────────────────────────────────────
// Mesures de la maquette (échelle 0,865) ramenées en points.

/** Ce que « Ma page » glisse sous « Le livre », et la hauteur de son fondu */
export const PAGE_TUCK = 28;
const PAGE_FADE = 44;

const styles = StyleSheet.create({
  // minHeight : le titre grandit avec le réglage système au lieu d'être coupé
  tuck: {
    height: PAGE_TUCK - spacing.sm,
  },
  // Ma série, posée à gauche de la barre (les ronds sont ferrés à droite)
  streak: {
    position: 'absolute',
    zIndex: 1,
    left: 0,
    top: 0,
    bottom: 0,
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
  book: {
    flexGrow: 1,
    marginTop: spacing.xs,
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
