// Theme exports
// Color palette based on SpeakBetter AI Coach design system

export const colors = {
  primary: '#4A55A2',
  secondary: '#7986CB',
  success: '#4CAF50',
  warning: '#FF7043',
  lightBg: '#F0F5FF',
  background: '#F5F7FA',
  textPrimary: '#333333',
  textSecondary: '#666666'
};

// Theme configuration for web (Material UI)
export const webTheme = {
  palette: {
    primary: {
      main: colors.primary,
    },
    secondary: {
      main: colors.secondary,
    },
    success: {
      main: colors.success,
    },
    warning: {
      main: colors.warning,
    },
    background: {
      default: colors.background,
      paper: '#FFFFFF',
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
    },
  },
  typography: {
    fontFamily: 'Inter, Arial, sans-serif',
    h1: { fontSize: '24px', fontWeight: 700 },
    h2: { fontSize: '20px', fontWeight: 600 },
    h3: { fontSize: '18px', fontWeight: 500 },
    body1: { fontSize: '16px', fontWeight: 400 },
    body2: { fontSize: '14px', fontWeight: 400 },
  },
  shape: {
    borderRadius: 8,
  },
};

// Theme configuration for React Native
export const mobileTheme = {
  colors: {
    ...colors,
    card: '#FFFFFF',
    border: '#E0E4E8',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    fontFamily: {
      regular: 'Inter-Regular',
      medium: 'Inter-Medium',
      semiBold: 'Inter-SemiBold',
      bold: 'Inter-Bold',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    round: 9999,
  },
};
