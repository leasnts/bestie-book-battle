/**
 * IsbnScanner — scanner le code-barres au dos d'un livre (#74).
 *
 *    ┌───────────────────────────────────┐
 *    │                               (✕) │
 *    │                                   │   la caméra, plein écran
 *    │    ┌ · · · · · · · · · · · · ┐    │
 *    │    ·     ||| |||| | |||       ·    │   la fenêtre cousue : le code-barres
 *    │    └ · · · · · · · · · · · · ┘    │   se pose dedans
 *    │      Le code-barres au dos        │
 *    └───────────────────────────────────┘
 *
 * Plein écran (Modal en fondu), au-dessus de la recherche qui l'a ouvert.
 * Le premier ISBN lu (EAN-13 en 978/979, clé juste) referme le scanner et
 * remonte à `onScan` ; les autres codes-barres (prix, magasin) sont ignorés.
 * L'ISBN se tape aussi à la main dans la recherche : refermer suffit.
 * Sans accès à la caméra : un mot et le chemin vers les Réglages.
 */

import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { XIcon } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Linking, Modal, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button3D from '../Button3D';
import { borderRadius, creamAlpha, fonts, fontSize, inkAlpha, spacing } from '../../utils/constants';
import { buzz } from '../../utils/feel';
import { parseIsbn } from '../../utils/isbn';
import GlassButton from './GlassButton';
import { StitchBorder } from './Stitch';

/** Un code-barres est large et bas : la fenêtre aussi */
const WINDOW_RATIO = 0.5;
const SIDE = spacing['3xl'];

interface IsbnScannerProps {
  visible: boolean;
  onScan: (isbn: string) => void;
  onClose: () => void;
}

export default function IsbnScanner({ visible, onScan, onClose }: IsbnScannerProps) {
  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      {visible && <Scanner onScan={onScan} onClose={onClose} />}
    </Modal>
  );
}

function Scanner({ onScan, onClose }: Omit<IsbnScannerProps, 'visible'>) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  // La caméra lit le même code plusieurs fois par seconde : un seul compte
  const done = useRef(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) requestPermission();
  }, [permission, requestPermission]);

  const handleScanned = ({ data }: BarcodeScanningResult) => {
    if (done.current) return;
    const isbn = parseIsbn(data);
    if (!isbn) return;
    done.current = true;
    buzz('success');
    onScan(isbn);
  };

  const windowWidth = width - SIDE * 2;
  const blocked = permission && !permission.granted && !permission.canAskAgain;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      {permission?.granted && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['ean13'] }}
          onBarcodeScanned={handleScanned}
        />
      )}

      {blocked ? (
        <View style={[styles.blocked, { paddingBottom: insets.bottom + spacing.xl }]}>
          <Text style={styles.blockedText}>L'appareil photo est coupé pour chapi</Text>
          <Button3D variant="secondary" onPress={() => Linking.openSettings()}>
            Réglages
          </Button3D>
        </View>
      ) : (
        <View style={styles.center} pointerEvents="none">
          <View style={{ width: windowWidth, height: windowWidth * WINDOW_RATIO }}>
            <StitchBorder radius={borderRadius.xl} inset={0} color={creamAlpha(0.95)} weight={3} />
          </View>
          <Text style={styles.hint}>Le code-barres au dos</Text>
        </View>
      )}

      <View style={[styles.close, { top: insets.top + spacing.sm }]}>
        <GlassButton icon={XIcon} onPress={onClose} accessibilityLabel="Fermer le scanner" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: inkAlpha(1),
  },
  center: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.md,
    color: creamAlpha(0.95),
    textAlign: 'center',
    marginTop: spacing.xl,
    // Lisible sur n'importe quel décor filmé
    textShadowColor: inkAlpha(0.6),
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  close: {
    position: 'absolute',
    right: spacing.lg,
  },
  blocked: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  blockedText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.md,
    color: creamAlpha(0.95),
  },
});
