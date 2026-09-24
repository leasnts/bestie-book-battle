/**
 * Composant NotificationButton
 *
 * La cloche de l'en-tête de l'accueil, avec pastille rouge quand il y a des
 * notifications non lues. Le style 3D vient de HeaderIconButton.
 */

import { BellIcon } from 'lucide-react-native';
import React from 'react';
import HeaderIconButton from './HeaderIconButton';

interface NotificationButtonProps {
  /** Callback quand on appuie sur le bouton */
  onPress: () => void;
  /** Affiche la pastille rouge (notifications non lues) */
  hasUnread?: boolean;
}

export default function NotificationButton({
  onPress,
  hasUnread = false,
}: NotificationButtonProps) {
  return (
    <HeaderIconButton
      icon={BellIcon}
      onPress={onPress}
      hasBadge={hasUnread}
      accessibilityLabel={hasUnread ? 'Activité, nouveautés non lues' : 'Activité'}
    />
  );
}
