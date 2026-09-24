/**
 * PageSection — le cadre « Ma page » de l'accueil.
 *
 * Deuxième question de l'accueil : où j'en suis. C'est aussi le geste principal
 * de l'app — enregistrer sa page en un geste.
 *
 * - En-tête : « Ma page » (touchable, sans chevron) ouvre mon journal ; à droite, ma série en **jours**
 *   (jamais « soirs » : on ne suppose pas quand les gens lisent).
 * - Le sélecteur qui défile est gardé (pas de − / +), resserré pour tenir dans
 *   le cadre. Ma page est en **pages de mon édition**, d'où le « sur 624 ».
 * - La rangée du bas a une **hauteur fixe** et trois places fixes. Seules les
 *   icônes changent, jamais l'endroit où l'on appuie (DESIGN.md › Boutons-icônes) :
 *
 *   |        | gauche                  | centre   | droite                  |
 *   |--------|-------------------------|----------|-------------------------|
 *   | repos  | porte du carnet         | —        | post-it : noter ma page |
 *   | défilé | ↺ annuler               | « +14 »  | ✓ enregistrer           |
 *
 * Le post-it note toujours la page **enregistrée** : pendant un défilement il
 * laisse la place au ✓, il n'y a jamais de doute sur la page notée. La porte du
 * carnet (`NotesDoor`) montre ce qui compte à ce moment-là.
 */

import { CheckIcon, FlameIcon, RotateCcwIcon, StickyNoteIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, inkAlpha, shadowAlpha, spacing } from '../../utils/constants';
import GlassSection from './GlassSection';
import PageScrollPicker from './PageScrollPicker';
import PressableScale from './PressableScale';

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
  /** « Ma page » → mon journal */
  onJournalPress: () => void;
  /** Noter ma page enregistrée. Sans elle, la place reste vide. */
  onNotePress?: () => void;
  /** La porte du carnet, à gauche au repos. Sans elle, la place reste vide. */
  notesDoor?: React.ReactNode;
  /** Petit écran : marges resserrées, pour que l'accueil tienne sans défiler */
  compact?: boolean;
  /** Taille du chiffre, choisie par l'accueil selon la hauteur de l'écran */
  pickerFontSize?: number;
}

/** Bouton rond de la rangée du bas : même taille et même place, seule l'icône change */
function IconButton({
  icon: Icon,
  variant,
  label,
  hint,
  onPress,
}: {
  icon: typeof CheckIcon;
  variant: 'dark' | 'ghost';
  label: string;
  hint?: string;
  onPress: () => void;
}) {
  return (
    <PressableScale
      style={[styles.iconButton, variant === 'dark' ? styles.iconButtonDark : styles.iconButtonGhost]}
      pressedScale={0.9}
      hitSlop={6}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
    >
      <Icon
        size={20}
        color={variant === 'dark' ? colors.white : colors.dark900}
        strokeWidth={2.2}
      />
    </PressableScale>
  );
}

export default function PageSection({
  currentPage,
  savedPage,
  totalPages,
  streakDays,
  onPageChange,
  onSave,
  onUndo,
  onJournalPress,
  onNotePress,
  notesDoor,
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
    <GlassSection compact={compact} style={styles.frame}>
      <View style={styles.head}>
        <PressableScale
          style={styles.journalLink}
          pressedScale={0.96}
          hitSlop={8}
          onPress={onJournalPress}
          accessibilityRole="button"
          accessibilityLabel="Ma page"
          accessibilityHint="Ouvre mon journal de lecture"
        >
          <Text style={styles.title}>Ma page</Text>
        </PressableScale>

        {streakDays > 0 && (
          <View style={styles.streak} accessible accessibilityLabel={`Série de ${streakDays} jours`}>
            <FlameIcon size={14} color={colors.textTertiary} fill={colors.textTertiary} />
            <Text style={styles.streakText}>{streakDays} j</Text>
          </View>
        )}
      </View>

      {/* Le chiffre et son « sur 624 », ensemble, centrés dans la place du cadre */}
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

      <Text style={styles.total}>sur {totalPages}</Text>
      </View>

      <View style={styles.row}>
        {/* Gauche : la porte du carnet est plus large qu'un rond, la place s'adapte */}
        <View style={[styles.slot, styles.slotLeft]}>
          {hasChanged ? (
            <IconButton
              icon={RotateCcwIcon}
              variant="ghost"
              label="Annuler"
              hint="Revient à ma dernière page enregistrée"
              onPress={onUndo}
            />
          ) : (
            notesDoor
          )}
        </View>

        {/* Centre : ce que je viens de lire */}
        <View style={styles.delta}>
          {hasChanged && (
            <Text style={styles.deltaText}>
              {delta > 0 ? '+' : '−'}
              {Math.abs(delta)}
            </Text>
          )}
        </View>

        {/* Droite */}
        <View style={styles.slot}>
          {hasChanged ? (
            <IconButton
              icon={CheckIcon}
              variant="dark"
              label="Enregistrer ma page"
              onPress={onSave}
            />
          ) : (
            onNotePress && (
              <IconButton
                icon={StickyNoteIcon}
                variant="dark"
                label="Noter ma page"
                hint={`Écrit une note à la page ${savedPage}`}
                onPress={onNotePress}
              />
            )
          )}
        </View>
      </View>
    </GlassSection>
  );
}

// ─── Styles ────────────────────────────────────────────────────────
// Mesures de la maquette (échelle 0,865) ramenées en points.

/** Trois nombres visibles à la fois : le mien au centre, ses deux voisins effacés */
const PICKER_ITEM_WIDTH = 120;
/** Le chiffre et sa zone reprennent la maquette (68 et 76 px à l'échelle 0,865) */
const PICKER_FONT_SIZE = 68;
const BUTTON_SIZE = 42;

const styles = StyleSheet.create({
  // minHeight : le titre grandit avec le réglage système au lieu d'être coupé
  head: {
    minHeight: 21,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  journalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  title: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  streak: {
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

  // Hauteur fixe : les boutons apparaissent sans rien déplacer
  row: {
    height: BUTTON_SIZE,
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slot: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
  },
  slotLeft: {
    width: undefined,
    minWidth: BUTTON_SIZE,
    flexShrink: 1,
    alignItems: 'flex-start',
  },
  delta: {
    flex: 1,
    alignItems: 'center',
  },
  deltaText: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 17,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },

  iconButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonDark: {
    backgroundColor: colors.dark900,
    shadowColor: shadowAlpha(0.25),
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  iconButtonGhost: {
    backgroundColor: inkAlpha(0.07),
  },
});
