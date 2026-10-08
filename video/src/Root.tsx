import {Composition} from 'remotion';
import {StoreHeader} from './StoreHeader';

// Format imposé par Apple pour l'en-tête vidéo de la fiche App Store (21:9).
export const RemotionRoot = () => (
  <Composition
    id="StoreHeader"
    component={StoreHeader}
    width={3840}
    height={1646}
    fps={30}
    durationInFrames={300}
  />
);
