/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  primary: '#FF8C00', // Orange
  secondary: '#2E5A1C', // Dark Green
  background: '#f5f5f5',
  white: '#ffffff',
  text: '#000000',
  textLight: '#666666',
  border: '#e0e0e0',
  error: '#dc3545',
  success: '#4CAF50',
  warning: '#FFC107',
  black: '#000000',
  transparent: 'transparent',
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
} as const;

export const DarkColors = {
  ...Colors,
  background: '#121212',
  text: '#FFFFFF',
  textLight: '#AAAAAA',
  border: '#333333',
};
