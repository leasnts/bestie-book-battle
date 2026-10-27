import {Composition} from 'remotion';
import {StoreHeader} from './StoreHeader';
import {HeaderGiant, HeaderThread} from './ChapiHeader';
import {HeaderTogether} from './ChapiTogether';
import {HeaderCrowd} from './ChapiCrowd';

// Format imposé par Apple pour l'en-tête vidéo de la fiche App Store (21:9).
const header = {width: 3840, height: 1646, fps: 30, durationInFrames: 300} as const;

export const RemotionRoot = () => (
  <>
  <Composition id="ChapiFoule" component={HeaderCrowd} defaultProps={{theme: 'papier' as const}} {...header} />
  <Composition id="ChapiFouleRouge" component={HeaderCrowd} defaultProps={{theme: 'rouge' as const}} {...header} />
  {/* Résultats de recherche de l'App Store : 3:2. */}
  <Composition id="ChapiFouleRougeRecherche" component={HeaderCrowd} defaultProps={{theme: 'rouge' as const}} {...header} height={2560} />
  <Composition id="ChapiEnsemble" component={HeaderTogether} {...header} />
  <Composition id="ChapiGeantRouge" component={HeaderGiant} defaultProps={{tone: 'rouge' as const}} {...header} />
  <Composition id="ChapiFilRouge" component={HeaderThread} defaultProps={{tone: 'rouge' as const}} {...header} />
  <Composition id="ChapiFilBeurre" component={HeaderThread} defaultProps={{tone: 'beurre' as const}} {...header} />
  <Composition id="ChapiGeantChocolat" component={HeaderGiant} defaultProps={{tone: 'chocolat' as const}} {...header} />
  <Composition
    id="StoreHeader"
    component={StoreHeader}
    width={3840}
    height={1646}
    fps={30}
    durationInFrames={300}
  />
  </>
);
