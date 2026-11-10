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
 * - Quand la page a changé, ↺ annuler et ✓ enregistrer apparaissent de part et
 *   d'autre du chiffre, sur sa ligne (retours de test, 2026-11-09). Pas de
 *   « +14 » à côté : il s'envole à l'enregistrement (la feuille de l'accueil).
 *   Au repos, rien : il n'y a jamais de doute sur la page notée.
 * - Au repos, + et ☺+ au bout de la ligne : écrire sur ma page, là où elle est
 *   (`PageNoteActions`, essai B du 2026-11-10 ; avant, des intercalaires sur
 *   le carré Carnet qu'on prenait pour des actions sur la note à la une).
 */

import { CheckIcon, RotateCcwIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { spacing } from '../../utils/constants';
import GlassButton from './GlassButton';
import PageNoteActions from './PageNoteActions';
import PageRuler, { type ClubPin } from './PageRuler';
import RoundButton from './RoundButton';

interface PageSectionProps {
  /** L'air en plus au-dessus qu'en dessous, hors du cadre (voir PageRuler) */
  centerBias?: number;
  /** Page affichée par le sélecteur */
  currentPage: number;
  /** Dernière page enregistrée */
  savedPage: number;
  /** Nombre de pages de MON édition */
  totalPages: number;
  onPageChange: (page: number) => void;
  onSave: () => void;
  onUndo: () => void;
  /** Mon journal (le titre qui l'ouvrait est retiré ; gardé pour y revenir) */
  onJournalPress?: () => void;
  /** Petit écran : marges resserrées, pour que l'accueil tienne sans défiler */
  compact?: boolean;
  /** Taille du chiffre, choisie par l'accueil selon la hauteur de l'écran */
  pickerFontSize?: number;
  /** Les autres membres du club, épinglés sur la règle */
  club?: ClubPin[];
  /** Liseuse ou audio : la règle avance en % */
  unit?: 'pages' | 'percent';
  /** + et ☺+ au repos (un livre du club est ouvert) */
  noteActions?: boolean;
}

export default function PageSection({
  currentPage,
  savedPage,
  totalPages,
  onPageChange,
  onSave,
  onUndo,
  compact = false,
  pickerFontSize = 88,
  club,
  unit,
  noteActions = false,
  centerBias = 0,
}: PageSectionProps) {
  const hasChanged = currentPage !== savedPage;

  return (
    // Remplit la place que l'accueil lui donne ; le chiffre est centré dedans
    <View style={[styles.frame, compact && styles.frameCompact]}>
      <View style={styles.book}>
        <PageRuler
          // + la marge du haut de la règle, qui n'a pas d'équivalent en bas
          centerBias={centerBias + BOOK_TOP}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          fontSize={pickerFontSize}
          club={club}
          unit={unit}
          actions={
            hasChanged ? (
              // En fondu : le verre qui naît dans une vue en fondu reste translucide
              <Animated.View entering={FadeIn.duration(180)} pointerEvents="box-none" style={styles.actions}>
                {/* Secondaire : notre rond en verre, à la taille du ✓ */}
                <GlassButton icon={RotateCcwIcon} accessibilityLabel="Annuler" onPress={onUndo} />
                <RoundButton icon={CheckIcon} variant="dark" label="Enregistrer ma page" onPress={onSave} />
              </Animated.View>
            ) : noteActions ? (
              <Animated.View entering={FadeIn.duration(180)} pointerEvents="box-none" style={styles.actions}>
                <PageNoteActions />
              </Animated.View>
            ) : null
          }
        />
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────
// Mesures de la maquette (échelle 0,865) ramenées en points.

const BOOK_TOP = spacing.xs;

const styles = StyleSheet.create({
  // Pas de cadre : juste de l'air en haut et en bas, aligné sur les bords des cadres
  frame: {
    // Prend la hauteur que l'accueil lui laisse, jamais plus (pas de défilement)
    flex: 1,
    minHeight: 0,
    paddingVertical: spacing.lg,
  },
  frameCompact: {
    paddingVertical: spacing.md,
  },
  book: {
    flex: 1,
    minHeight: 0,
    marginTop: BOOK_TOP,
  },

  // ↺ au bord gauche, ✓ au bord droit, le chiffre entre les deux
  actions: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
