/**
 * MaskedView — `@react-native-masked-view/masked-view`, retypé.
 *
 * Ses types s'appuient sur `NativeMethods`, que React Native 0.88 a retiré : le
 * composant marche toujours, mais TypeScript ne le reconnaît plus comme JSX.
 * Tout l'app passe par ici ; le jour où le paquet publie des types à jour, ce
 * fichier redevient un simple ré-export.
 */

import RNMaskedView from '@react-native-masked-view/masked-view';
import type { ComponentType, ReactElement } from 'react';
import type { ViewProps } from 'react-native';

type MaskedViewProps = ViewProps & {
  maskElement: ReactElement;
  androidRenderingMode?: 'software' | 'hardware';
};

const MaskedView = RNMaskedView as unknown as ComponentType<MaskedViewProps>;

export default MaskedView;
