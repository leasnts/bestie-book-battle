/**
 * Route /club-invite?id= — inviter dans un club (#238).
 *
 *        ▛▀▀▀▀▀▜
 *        ▌ QR  ▐       à montrer en rencontre : il ouvre le club
 *        ▙▄▄▄▄▄▟
 *      [ RH2PSN ⧉ ]    le code, copié d'un toucher
 *   [ Partager le lien ]
 *
 * Le lien (et le QR) ouvre l'aperçu du club (app/club-join/[code].tsx) ; le
 * code se tape dans « Rejoindre avec un code » de l'onglet Clubs.
 */

import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams } from 'expo-router';
import { CopyIcon } from 'lucide-react-native';
import React from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Button3D from '../components/Button3D';
import { LinearGradient } from 'expo-linear-gradient';
import { StitchBorder } from '../components/ui/Stitch';
import PressableScale from '../components/ui/PressableScale';
import SheetPage, { SheetFooter } from '../components/ui/SheetPage';
import { useClubStore } from '../stores/clubStore';
import { borderRadius, colors, fonts, lowki, paperFrameGradient, spacing } from '../utils/constants';
import { buzz } from '../utils/feel';
import { nudge } from '../utils/notice';
import { clubInviteLink, clubInviteMessage } from '../utils/share';

const QR = 180;

export default function ClubInviteRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const club = useClubStore((s) => s.clubs[id]);
  if (!club) return null;

  const copy = async () => {
    await Clipboard.setStringAsync(club.invite_code);
    buzz();
    nudge('Code copié', club.invite_code);
  };

  return (
    <SheetPage title="Inviter" accent="Inviter">
      {/* Le QR sur un carré de papier cousu, à sa taille */}
      <View style={styles.qrFrame} accessible accessibilityLabel="QR code du club">
        <LinearGradient colors={paperFrameGradient} style={[StyleSheet.absoluteFill, styles.qrPaper]} />
        <StitchBorder radius={borderRadius.xl} />
        <QRCode value={clubInviteLink(club.invite_code)} size={QR} color={lowki.chocolate.dark} backgroundColor="transparent" />
      </View>

      <PressableScale
        style={styles.code}
        pressedScale={0.97}
        onPress={copy}
        accessibilityRole="button"
        accessibilityLabel={`Copier le code ${club.invite_code.split('').join(' ')}`}
      >
        <Text style={styles.codeText}>{club.invite_code}</Text>
        <CopyIcon size={20} color={colors.textTertiary} strokeWidth={2} />
      </PressableScale>

      <SheetFooter>
        <Button3D variant="primary" onPress={() => Share.share({ message: clubInviteMessage(club.name, club.invite_code) })}>
          Partager le lien
        </Button3D>
      </SheetFooter>
    </SheetPage>
  );
}

const styles = StyleSheet.create({
  qrFrame: {
    alignSelf: 'center',
    width: QR + spacing['3xl'] * 2,
    height: QR + spacing['3xl'] * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPaper: {
    borderRadius: borderRadius.xl,
  },
  code: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 44,
    marginTop: spacing.lg,
  },
  codeText: {
    fontFamily: fonts.display,
    fontSize: 26,
    letterSpacing: 4,
    color: colors.textPrimary,
  },
});
