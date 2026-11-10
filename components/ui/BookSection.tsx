/**
 * BookSection — le cadre « Le livre » de l'accueil.
 *
 * Première question de l'accueil : qu'est-ce qu'on lit, et qu'est-ce qu'on vise.
 * La couverture à gauche ; à droite, le titre, l'autrice, puis la piste du livre.
 * Sous la piste, sous mon point, où j'en suis (`42 %`) ; la date de fin au bout.
 * Pas une phrase.
 *
 * Le % a remplacé le J-x (Lea, 2026-11-10). Avant, le J-x avait quitté le
 * dessus du titre (2026-09-24) puis remplacé le % du
 * club sous la piste (2026-10-01) : le groupe, c'est le classement.
 *
 * Plus de ligne de repères en bas (« Club · 26 % du livre », « Cap · 9/38 ») :
 * l'accueil doit tenir sans défiler. Le nombre de membres au cap reste dans la
 * fiche du livre.
 *
 * Ma série n'est plus là : elle vit dans une gélule en haut à droite de
 * l'accueil (StreakPill, Lea, 2026-10-09).
 *
 * Tout le cadre s'ouvre d'un toucher : c'est la fiche du livre qui porte les
 * réglages (fin, caps, club), plus aucun menu ⋮ sur l'accueil.
 */

import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Challenge } from '../../types/supabase';
import { colors, fonts, spacing } from '../../utils/constants';
import { type TrackCap } from '../../utils/track';
import { AccentUnit } from './AccentWord';
import BookCover, { COVER_RATIO, isChallengeDone } from './BookCover';
import GlassSection from './GlassSection';
import GoalTrack from './GoalTrack';

interface BookSectionProps {
  challenge: Challenge;
  /** La couverture de mon édition, sinon celle du bbb */
  coverUrl: string | null;
  /** Ma progression, 0 à 100 */
  myPercent: number;
  caps: TrackCap[];
  /**
   * Mon % sous la piste. Faux quand il est déjà à l'écran ailleurs : seule dans
   * un livre lu en %, Ma page l'affiche déjà en grand (Lea, 2026-11-10 : jamais
   * de redondance)
   */
  showPercent?: boolean;
  /** Petit écran : marges resserrées, pour que l'accueil tienne sans défiler */
  compact?: boolean;
  /** Toucher le cadre → la fiche du livre */
  onPress: () => void;
}

export default function BookSection({
  challenge,
  coverUrl,
  myPercent,
  caps,
  showPercent = true,
  compact = false,
  onPress,
}: BookSectionProps) {
  // La couverture prend toujours la hauteur du texte à côté d'elle (titre sur
  // une ou deux lignes, texte agrandi…) : on la mesure.
  const [textsHeight, setTextsHeight] = useState(0);
  return (
    <GlassSection
      compact={compact}
      onPress={onPress}
      accessibilityLabel={`${challenge.book_title}, ${challenge.book_author ?? 'autrice inconnue'}`}
      accessibilityHint="Ouvre la fiche du livre"
    >
      <View style={styles.head}>
        <View
          style={[
            styles.cover,
            textsHeight > 0 && { width: textsHeight * COVER_RATIO, height: textsHeight },
          ]}
        >
          <BookCover coverUrl={coverUrl} done={isChallengeDone(challenge)} />
        </View>

        <View style={styles.texts} onLayout={(e) => setTextsHeight(e.nativeEvent.layout.height)}>
          {/* Une ligne, toujours : un titre long finit en « … », sans rétrécir ni
              faire grandir le cadre (Lea, 2026-11-10). Pareil pour l'autrice. */}
          <Text style={styles.title} numberOfLines={1} maxFontSizeMultiplier={1.3}>
            {challenge.book_title}
          </Text>
          {!!challenge.book_author && (
            <Text style={styles.author} numberOfLines={1} maxFontSizeMultiplier={1.3}>
              {challenge.book_author}
            </Text>
          )}

          {/* La piste sous l'autrice ; sous mon point, où j'en suis en %, qui
              avance avec le fil. Il a remplacé le J-x (Lea, 2026-11-10) */}
          <View style={styles.track}>
            <GoalTrack
              myPercent={myPercent}
              caps={caps}
              endDate={challenge.target_end_date}
              marker={
                showPercent && (
                // Déjà lu par VoiceOver dans la phrase de la piste
                <Text
                  style={styles.percent}
                  maxFontSizeMultiplier={1.3}
                  importantForAccessibility="no-hide-descendants"
                  accessibilityElementsHidden
                >
                  {Math.round(myPercent)}
                  <AccentUnit size={styles.percent.fontSize} color={styles.percent.color}>%</AccentUnit>
                </Text>
                )
              }
            />
          </View>
        </View>
      </View>
    </GlassSection>
  );
}

// ─── Styles ────────────────────────────────────────────────────────
// Mesures de la maquette (échelle 0,865) ramenées en points.

const COVER_WIDTH = 54;

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  // BookCover remplit son parent : sans hauteur imposée, il s'étirerait sur
  // toute la hauteur du cadre.
  cover: {
    width: COVER_WIDTH,
    aspectRatio: COVER_RATIO,
  },
  texts: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.textPrimary,
  },
  author: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 1,
  },

  track: {
    marginTop: spacing.sm,
  },
  // La hauteur de ligne de la date d'à côté : sans elle, le « % » (police
  // d'accent, plus haute) faisait descendre le chiffre sous la date
  percent: {
    fontFamily: fonts.bodyExtraBold,
    fontSize: 13,
    lineHeight: 17,
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
});
