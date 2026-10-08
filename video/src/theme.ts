import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Palette officielle Lowki, ton sur ton (chocolat).
export const CHOCO = '#6b351d';
export const CHOCO_FORM_TOP = '#4b2514';
export const CHOCO_FORM_BOTTOM = '#3f1f12';
export const BEIGE = '#c0a283';

export const ACCENT_FONT = 'Welcome Valentines';


loadFont({family: ACCENT_FONT, url: staticFile('fonts/WelcomeValentines.ttf')});
