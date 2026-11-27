/**
 * Route /club-pal — la PAL du club, en entier (#238, maquette 8). `?id=` : le club.
 *
 *   PAL du club                          (+)    + : proposer un livre
 *   ▐█▌ Fourth Wing      Rebecca Yarros   ♥ 4   un cœur = je veux le lire
 *       par Emma                                ensuite (rouge : le mien)
 *   · · · · · · · · · · · · · · · · · · · · ·
 *   ▐█▌ La délicatesse   …                ♥ 2
 *   [ Choisir le prochain ]                     l'admin seulement
 */

import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { HeartIcon, PlusIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button3D from '../components/Button3D';
import { CoverImage } from '../components/ui/BookCover';
import GlassButton from '../components/ui/GlassButton';
import PressableScale from '../components/ui/PressableScale';
import SheetPage from '../components/ui/SheetPage';
import { StitchLine } from '../components/ui/Stitch';
import { useClubPal } from '../hooks/useClubPal';
import { getClubMembers } from '../services/supabase/clubs';
import { accentGradient, colors, fonts, inkAlpha, paperFrameGradient, spacing } from '../utils/constants';

export default function ClubPalRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { pal, ready, toggleVote, myUserId } = useClubPal(id ?? null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!id || !myUserId) return;
    getClubMembers(id)
      .then((members) => setIsAdmin(members.some((m) => m.user_id === myUserId && m.role === 'admin' && m.status === 'active')))
      .catch(() => {});
  }, [id, myUserId]);

  return (
    <SheetPage
      title="PAL du club"
      accent="PAL"
      fit={false}
      actions={<GlassButton icon={PlusIcon} onPress={() => router.push('/book-search?for=club')} accessibilityLabel="Proposer un livre" />}
    >
      {ready && (
        <View>
          {pal.length === 0 && <Text style={styles.empty}>Propose le premier livre</Text>}
          {pal.map((book, i) => {
            const mine = book.votes.some((v) => v.user_id === myUserId);
            const proposer = book.proposed_by === myUserId ? 'toi' : book.proposer?.first_name ?? '…';
            return (
              <View key={book.id}>
                {i > 0 && <StitchLine />}
                <View style={styles.row}>
                  {book.cover_url ? <CoverImage uri={book.cover_url} style={styles.cover} /> : <View style={styles.cover} />}
                  <View style={styles.text}>
                    <Text style={styles.title} numberOfLines={2}>
                      {book.book_title}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {book.book_author ? `${book.book_author} · ` : ''}par {proposer}
                    </Text>
                  </View>
                  <PressableScale
                    style={styles.heart}
                    pressedScale={0.85}
                    onPress={() => toggleVote(book)}
                    accessibilityRole="button"
                    accessibilityLabel={`${book.votes.length} cœur${book.votes.length > 1 ? 's' : ''}`}
                    accessibilityState={{ selected: mine }}
                    accessibilityHint={mine ? 'Retire mon cœur' : 'Je veux le lire ensuite'}
                  >
                    <LinearGradient colors={mine ? accentGradient : paperFrameGradient} style={StyleSheet.absoluteFill} />
                    <HeartIcon size={14} color={mine ? colors.white : colors.textPrimary} fill={mine ? colors.white : 'transparent'} strokeWidth={2.4} />
                    <Text style={[styles.count, mine && styles.countMine]}>{book.votes.length}</Text>
                  </PressableScale>
                </View>
              </View>
            );
          })}
          {isAdmin && pal.length > 0 && (
            <View style={styles.cta}>
              <Button3D variant="primary" onPress={() => router.replace(`/club-next?id=${id}`)}>
                Choisir le prochain
              </Button3D>
            </View>
          )}
        </View>
      )}
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textTertiary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  cover: {
    width: 40,
    height: 60,
    borderRadius: 2,
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  meta: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textTertiary,
  },
  heart: {
    minWidth: 56,
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: 18,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: inkAlpha(0.1),
  },
  count: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.textPrimary,
  },
  countMine: {
    color: colors.white,
  },
  cta: {
    marginTop: spacing.xl,
  },
});
