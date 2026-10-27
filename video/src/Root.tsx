import {Composition} from 'remotion';
import {StoreHeader} from './StoreHeader';
import {HeaderGiant, HeaderThread} from './ChapiHeader';

// Format imposé par Apple pour l'en-tête vidéo de la fiche App Store (21:9).
const header = {width: 3840, height: 1646, fps: 30, durationInFrames: 300} as const;

export const RemotionRoot = () => (
  <>
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
