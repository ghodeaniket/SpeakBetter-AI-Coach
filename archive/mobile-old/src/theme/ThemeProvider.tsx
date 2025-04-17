import React, { ReactNode } from 'react';
import { mobileTheme } from '@speakbetter/ui/theming';
import { ThemeContext } from './ThemeContext';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // In the future, we could add dark mode support here
  // by changing the theme based on user preferences
  const theme = mobileTheme;

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};
