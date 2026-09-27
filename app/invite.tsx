/**
 * Route /invite — inviter quelqu'un sur un de mes livres.
 *
 * Sheet natif (`SheetPage`), ouvert depuis l'onglet Profil. Plusieurs livres :
 * on choisit d'abord sa couverture. Le code se copie d'un toucher (petit
 * « Copié ! » par-dessus), et le bouton ouvre le partage d'iOS.
 */

import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { BookOpenIcon, CopyIcon, ShareIcon } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Button3D from '../components/Button3D';
import SheetPage, { SheetFooter } from '../components/ui/SheetPage';
import { useProjectStore } from '../stores/projectStore';
import { borderRadius, colors, fonts, fontSize, shadows, spacing } from '../utils/constants';

export default function InviteRoute() {
  const challenges = useProjectStore((s) => s.challenges);
  const [selectedId, setSelectedId] = useState<string | null>(challenges[0]?.id ?? null);
  const selected = challenges.find((c) => c.id === selectedId) ?? challenges[0] ?? null;
  const copyToastOpacity = useRef(new Animated.Value(0)).current;

  const handleCopy = async () => {
    if (!selected?.invite_code) return;
    await Clipboard.setStringAsync(selected.invite_code);
    Animated.sequence([
      Animated.timing(copyToastOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(copyToastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const handleShare = async () => {
    if (!selected) return;
    const code = selected.invite_code;
    const deepLink = selected.invite_url || `bestiebookbattle://join/${code}`;
    const message = `Rejoins-moi pour lire "${selected.book_title}" sur bestiebookbattle ! 📚\n\nCode : ${code}\n${deepLink}`;
    try {
      await Share.share({ message, url: deepLink });
    } catch {
      // Annulé
    }
  };

  const hasMultiple = challenges.length > 1;

  return (
    <SheetPage title="Inviter">
      {!selected ? (
        <Text style={styles.emptyText}>Aucun livre en cours</Text>
      ) : (
        <>
          {hasMultiple ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.picker}
              contentContainerStyle={styles.pickerContent}
            >
              {challenges.map((c) => {
                const isSelected = c.id === selected.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setSelectedId(c.id)}
                    style={[styles.bookCard, isSelected && styles.bookCardSelected]}
                    accessibilityRole="button"
                    accessibilityLabel={c.book_title}
                    accessibilityState={{ selected: isSelected }}
                  >
                    {c.cover_url ? (
                      <Image source={{ uri: c.cover_url }} style={styles.bookCardCover} contentFit="cover" />
                    ) : (
                      <View style={[styles.bookCardCover, styles.noCover]}>
                        <BookOpenIcon size={24} color={colors.textTertiary} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.singleBook}>
              {selected.cover_url ? (
                <Image source={{ uri: selected.cover_url }} style={styles.singleBookCover} contentFit="cover" />
              ) : (
                <View style={[styles.singleBookCover, styles.noCover]}>
                  <BookOpenIcon size={28} color={colors.textTertiary} />
                </View>
              )}
              <View style={styles.singleBookTexts}>
                <Text style={styles.singleBookTitle}>{selected.book_title}</Text>
                {!!selected.book_author && (
                  <Text style={styles.singleBookAuthor}>{selected.book_author}</Text>
                )}
              </View>
            </View>
          )}

          <Text style={styles.label}>Code d'invitation</Text>
          <View>
            <Pressable
              style={styles.codeBox}
              onPress={handleCopy}
              accessibilityRole="button"
              accessibilityLabel={`Copier le code ${selected.invite_code}`}
            >
              <Text style={styles.codeText}>{selected.invite_code}</Text>
              <CopyIcon size={20} color={colors.textTertiary} />
            </Pressable>
            <Animated.View style={[styles.copyToast, { opacity: copyToastOpacity }]} pointerEvents="none">
              <Text style={styles.copyToastText}>Copié !</Text>
            </Animated.View>
          </View>

          <SheetFooter>
            <Button3D variant="primary" onPress={handleShare} icon={ShareIcon} iconPosition="left">
              Inviter à participer
            </Button3D>
          </SheetFooter>
        </>
      )}
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.textTertiary,
    marginVertical: spacing.xl,
  },
  picker: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    // Les couvertures défilent jusqu'au bord du sheet
    marginHorizontal: -spacing.lg,
  },
  pickerContent: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  bookCard: {
    width: 84,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.bgSecondary,
  },
  bookCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.white,
  },
  bookCardCover: {
    width: 68,
    height: 95,
    borderRadius: 4,
  },
  noCover: {
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  singleBook: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  singleBookCover: {
    width: 52,
    height: 72,
    borderRadius: 4,
  },
  singleBookTexts: {
    flex: 1,
  },
  singleBookTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  singleBookAuthor: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    ...shadows.xs,
  },
  codeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 28,
    color: colors.textPrimary,
    letterSpacing: 4,
  },
  // Le petit « Copié ! » par-dessus le code, centré
  copyToast: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    transform: [{ translateY: -14 }],
    backgroundColor: colors.dark900,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  copyToastText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSize.sm,
    color: colors.white,
  },
});
