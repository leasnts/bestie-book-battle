import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// Palette officielle Lowki, ton sur ton (rouge).
export const RED = '#9c1f27';
export const RED_FORM_TOP = '#6c1419';
export const RED_FORM_BOTTOM = '#561115';
export const BEIGE = '#c0a283';

export const ACCENT_FONT = 'Welcome Valentines';

loadFont({family: ACCENT_FONT, url: staticFile('fonts/WelcomeValentines.ttf')});
