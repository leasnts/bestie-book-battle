/**
 * Route /leaderboard — classement complet
 *
 * Présentée comme un sheet iOS natif (`presentation: 'formSheet'`, configuré
 * dans app/_layout.tsx). C'est iOS qui dessine le sheet : poignée, paliers de
 * hauteur, glissement élastique pour fermer, assombrissement du fond et recul
 * de l'écran parent. Rien de tout ça n'est réimplémenté ici.
 *
 * Pourquoi une route et pas un composant `<Modal>` :
 * un sheet natif est un *view controller* présenté par la pile de navigation.
 * Le déclarer comme route est la seule façon pour qu'Expo Router le pousse
 * dans la pile native — et donc que son contenu soit mis en page correctement.
 *
 * Les données viennent directement des stores Zustand, via le même hook que
 * la section de l'accueil : aucune donnée n'est passée en paramètre d'URL.
 *
 * Piège à ne pas reproduire : ne pas activer le flag expérimental
 * `featureFlags.experiment.synchronousScreenUpdatesEnabled` de
 * react-native-screens pour « corriger » la mise en page d'un formSheet. Il a
 * une contrepartie native — un binaire déjà compilé l'ignore, un binaire
 * fraîchement compilé l'applique — et rend l'app entièrement blanche. La mise
 * en page correcte tient à une seule chose : la liste est l'enfant DIRECT de
 * l'écran (cf. LeaderboardList), sans `View` intermédiaire.
 *
 * Ouvert depuis la fiche du livre (`?from=book`), le classement se pose
 * par-dessus elle : un bouton retour, à gauche du titre, y ramène. Les lignes
 * n'y ouvrent pas le journal de chacun : ça ne se fait que depuis l'accueil.
 */

import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { ChevronLeftIcon } from 'lucide-react-native';
import React, { useLayoutEffect } from 'react';
import { useLeaderboardParticipants } from '../hooks/useLeaderboardParticipants';
import LeaderboardList from '../components/ui/LeaderboardList';
import { sheetIconItem, sheetTitleItem } from '../components/ui/SheetHeader';

export default function LeaderboardRoute() {
  const { participants, myUserId } = useLeaderboardParticipants();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const navigation = useNavigation();
  const router = useRouter();

  // Via setOptions et pas <Stack.Screen> : la liste doit rester l'enfant
  // direct de l'écran.
  useLayoutEffect(() => {
    if (from !== 'book') return;
    navigation.setOptions({
      unstable_headerLeftItems: () => [
        sheetIconItem({
          icon: ChevronLeftIcon,
          onPress: () => router.back(),
          accessibilityLabel: 'Retour à la fiche du livre',
        }),
        sheetTitleItem('Classement'),
      ],
    });
  }, [from, navigation, router]);

  return (
    <LeaderboardList participants={participants} myUserId={myUserId} readOnly={from === 'book'} />
  );
}
