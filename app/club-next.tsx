/**
 * Route /club-next — l'admin choisit la prochaine lecture du book club
 * (#238, maquettes 6 et 7). `?id=` : le club.
 *
 *   Et maintenant ?
 *   (✋) Je choisis                 → la PAL, un toucher = ce livre
 *   (👑) Le plus voté   Fourth Wing → ce livre, « C'est lui »
 *   (🎲) Tirage au sort             → les couvertures défilent puis s'arrêtent,
 *                                     tamponnées « Tiré ! » ; Relancer / C'est lui
 *
 * Le livre choisi devient la lecture « Ensuite » du club : il démarre à la fin
 * de celle en cours (choose_club_next). Possible à tout moment, même avant la
 * fin (Lea, 2026-11-27).
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { CrownIcon, DicesIcon, HandIcon } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button3D from '../components/Button3D';
import OptionList from '../components/onboarding/OptionList';
import { CoverImage } from '../components/ui/BookCover';
import SheetPage from '../components/ui/SheetPage';
import { InkStamp } from '../components/ui/Stamp';
import { useClubPal } from '../hooks/useClubPal';
import { chooseClubNext, type ClubPalBook } from '../services/supabase/clubPal';
import { colors, fonts, spacing } from '../utils/constants';
import { feel } from '../utils/feel';
import { oops } from '../utils/notice';

type Step = 'menu' | 'pick' | 'top' | 'draw';

const ICON = { size: 22, color: colors.textPrimary, strokeWidth: 2 };

export default function ClubNextRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { pal, ready } = useClubPal(id ?? null);
  const [step, setStep] = useState<Step>('menu');
  const [saving, setSaving] = useState(false);

  const choose = async (book: ClubPalBook) => {
    if (saving) return;
    setSaving(true);
    try {
      await chooseClubNext(book.id);
      feel('valider');
      router.back();
    } catch (error) {
      setSaving(false);
      oops('Livre pas choisi', error, { retry: () => choose(book) });
    }
  };

  const top = pal[0] ?? null;

  return (
    <SheetPage
      title={step === 'draw' ? 'Tirage au sort' : step === 'pick' ? 'Je choisis' : 'Et maintenant ?'}
      onBack={step === 'menu' ? undefined : () => setStep('menu')}
    >
      {!ready ? null : pal.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>La PAL du club est vide</Text>
          <Button3D variant="primary" onPress={() => router.replace('/book-search?for=club')}>
            Proposer un livre
          </Button3D>
        </View>
      ) : step === 'menu' ? (
        <OptionList
          options={[
            { key: 'pick', label: 'Je choisis', leading: <HandIcon {...ICON} /> },
            { key: 'top', label: 'Le plus voté', leading: <CrownIcon {...ICON} />, detail: top?.book_title },
            { key: 'draw', label: 'Tirage au sort', leading: <DicesIcon {...ICON} /> },
          ]}
          value={null}
          onChange={(key) => setStep(key as Step)}
          keepUndimmed
        />
      ) : step === 'pick' ? (
        <OptionList
          options={pal.map((b) => ({
            key: b.id,
            label: b.book_title,
            detail: `${b.votes.length} ♥`,
            leading: b.cover_url ? <CoverImage uri={b.cover_url} style={styles.rowCover} /> : <View style={styles.rowCover} />,
          }))}
          value={null}
          onChange={(key) => {
            const book = pal.find((b) => b.id === key);
            if (book) choose(book);
          }}
          keepUndimmed
        />
      ) : step === 'top' && top ? (
        <Chosen book={top} detail={`${top.votes.length} cœur${top.votes.length > 1 ? 's' : ''}`}>
          <Button3D variant="primary" onPress={() => choose(top)} loading={saving}>
            C'est lui
          </Button3D>
        </Chosen>
      ) : (
        <Draw pal={pal} onChoose={choose} saving={saving} />
      )}
    </SheetPage>
  );
}

/** Le livre retenu, en grand */
function Chosen({ book, detail, stamp, children }: { book: ClubPalBook; detail: string; stamp?: boolean; children: React.ReactNode }) {
  return (
    <View style={styles.chosen}>
      <View>
        {book.cover_url ? <CoverImage uri={book.cover_url} style={styles.bigCover} /> : <View style={styles.bigCover} />}
        {stamp && <InkStamp label="Tiré !" delay={0} angle={-10} style={styles.stamp} />}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {book.book_title}
      </Text>
      <Text style={styles.detail}>{detail}</Text>
      <View style={styles.ctas}>{children}</View>
    </View>
  );
}

/**
 * Le tirage : les couvertures défilent vite puis ralentissent, un tic à
 * chacune, et s'arrêtent sur une ; le tampon « Tiré ! » tombe dessus.
 */
function Draw({ pal, onChoose, saving }: { pal: ClubPalBook[]; onChoose: (b: ClubPalBook) => void; saving: boolean }) {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [round, setRound] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDone(false);
    const landing = Math.floor(Math.random() * pal.length);
    // Au moins deux tours, puis jusqu'au livre tiré
    const steps = pal.length * 2 + landing + 1;
    let i = 0;
    const tick = () => {
      i += 1;
      setIndex(i % pal.length);
      feel('tic');
      if (i >= steps) {
        setDone(true);
        feel('valider');
        return;
      }
      // De 60 ms à 320 ms : ça ralentit avant de s'arrêter
      timer.current = setTimeout(tick, 60 + 260 * (i / steps) ** 2);
    };
    timer.current = setTimeout(tick, 60);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [pal.length, round]);

  const book = pal[index] ?? pal[0];
  return (
    <Chosen
      key={done ? `done-${round}` : 'spin'}
      book={book}
      detail={done ? `proposé par ${book.proposer?.first_name ?? '…'}` : ' '}
      stamp={done}
    >
      {done && (
        <View style={styles.row}>
          <View style={styles.half}>
            <Button3D variant="secondary" onPress={() => setRound((r) => r + 1)} disabled={saving}>
              Relancer
            </Button3D>
          </View>
          <View style={styles.half}>
            <Button3D variant="primary" onPress={() => onChoose(book)} loading={saving}>
              C'est lui
            </Button3D>
          </View>
        </View>
      )}
    </Chosen>
  );
}

const styles = StyleSheet.create({
  empty: {
    gap: spacing.lg,
  },
  emptyText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textTertiary,
  },
  rowCover: {
    width: 28,
    height: 42,
    borderRadius: 2,
  },
  // À gauche, comme tous les titres de l'app (jamais centré)
  chosen: {
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  bigCover: {
    width: 150,
    height: 225,
    borderRadius: 3,
  },
  // Posé à cheval sur le bord droit de la couverture, sur le papier
  stamp: {
    left: 110,
    top: 28,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  detail: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textTertiary,
  },
  ctas: {
    alignSelf: 'stretch',
    marginTop: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  half: {
    flex: 1,
  },
});
