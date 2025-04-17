import { createContext, useContext } from 'react';
import { mobileTheme } from '@speakbetter/ui/theming';

export type ThemeType = typeof mobileTheme;

export const ThemeContext = createContext<ThemeType>(mobileTheme);

export const useTheme = () => useContext(ThemeContext);
