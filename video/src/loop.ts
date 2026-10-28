import {useCurrentFrame, useVideoConfig} from 'remotion';

// Tout bouge en sinus sur la durée exacte de la vidéo : la dernière image
// retombe sur la première, la boucle de l'App Store ne se voit pas.
export const useLoop = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const turn = (frame / durationInFrames) * Math.PI * 2;
  return {frame, durationInFrames, turn};
};
