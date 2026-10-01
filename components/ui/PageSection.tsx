/**
 * PageSection — le cadre « Ma page » de l'accueil.
 *
 * Deuxième question de l'accueil : où j'en suis. C'est aussi le geste principal
 * de l'app — enregistrer sa page en un geste.
 *
 * - Hors cadre (essai du 2026-10-01) : ni verre ni couture, le chiffre et la
 *   règle sont posés à même le fond, entre « Le livre » et le bento.
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
import PageRuler, { type ClubPin } from './PageRuler';
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
  /** Les autres membres du club, épinglés sur la règle */
  club?: ClubPin[];
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
  club,
}: PageSectionProps) {
  const delta = currentPage - savedPage;
  const hasChanged = delta !== 0;

  return (
    // Remplit la place que l'accueil lui donne ; le chiffre est centré dedans
    <View style={[styles.frame, compact && styles.frameCompact]}>
      <View style={styles.book}>
        <PageRuler
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          fontSize={pickerFontSize}
          club={club}
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
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────
// Mesures de la maquette (échelle 0,865) ramenées en points.

const styles = StyleSheet.create({
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

  // Pas de cadre : juste de l'air en haut et en bas, aligné sur les bords des cadres
  frame: {
    flexGrow: 1,
    paddingVertical: spacing.lg,
  },
  frameCompact: {
    paddingVertical: spacing.md,
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
