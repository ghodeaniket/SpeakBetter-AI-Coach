import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from './ThemeContext';
import { ThemeType } from './ThemeContext';

type StylesFunction<T> = (theme: ThemeType) => T;

export function useStyles<T extends StyleSheet.NamedStyles<T>>(stylesFunction: StylesFunction<T>) {
  const theme = useTheme();
  
  // Memoize the styles to prevent unnecessary recalculations
  return useMemo(() => StyleSheet.create(stylesFunction(theme)), [theme, stylesFunction]);
}
