import { Alert } from 'react-native';

/** La confirmation avant de supprimer un cap : depuis sa fiche, ou en le glissant */
export function confirmDeleteCap(onConfirm: () => void) {
  Alert.alert('Supprimer ce cap ?', 'Il disparaît pour tout le club.', [
    { text: 'Annuler', style: 'cancel' },
    { text: 'Supprimer', style: 'destructive', onPress: onConfirm },
  ]);
}
