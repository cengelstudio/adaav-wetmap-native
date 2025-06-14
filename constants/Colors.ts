/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

/**
 * Simplified color palette for a modern and clean look
 */

const tintColorLight = '#007AFF';
const tintColorDark = '#fff';

export const Colors = {
  primary: '#007AFF', // iOS Blue
  secondary: '#34C759', // iOS Green
  background: '#F2F2F7', // iOS Light Gray
  white: '#FFFFFF',
  text: '#000000',
  textLight: '#8E8E93', // iOS Gray
  border: '#C7C7CC', // iOS Border Gray
  error: '#FF3B30', // iOS Red
  success: '#34C759', // iOS Green
  warning: '#FF9500', // iOS Orange
  black: '#000000',
  transparent: 'transparent',
  light: {
    text: '#000000',
    background: '#F2F2F7',
    tint: tintColorLight,
    icon: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#FFFFFF',
    background: '#000000',
    tint: tintColorDark,
    icon: '#8E8E93',
    tabIconDefault: '#8E8E93',
    tabIconSelected: tintColorDark,
  },
} as const;

export const DarkColors = {
  ...Colors,
  background: '#000000',
  text: '#FFFFFF',
  textLight: '#8E8E93',
  border: '#38383A',
};
