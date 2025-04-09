import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { PaletteOptions } from '@mui/material/styles/createPalette';

// SpeakBetter color palette based on PRD
const palette: PaletteOptions = {
  primary: {
    main: '#4A55A2',
    light: '#7986CB',
    dark: '#3A4482',
    contrastText: '#FFFFFF'
  },
  secondary: {
    main: '#7986CB',
    light: '#9FA8DA',
    dark: '#5C6BC0',
    contrastText: '#FFFFFF'
  },
  success: {
    main: '#4CAF50',
    light: '#81C784',
    dark: '#388E3C',
    contrastText: '#FFFFFF'
  },
  warning: {
    main: '#FF7043',
    light: '#FFAB91',
    dark: '#E64A19',
    contrastText: '#FFFFFF'
  },
  error: {
    main: '#F44336',
    light: '#E57373',
    dark: '#D32F2F',
    contrastText: '#FFFFFF'
  },
  info: {
    main: '#2196F3',
    light: '#64B5F6',
    dark: '#1976D2',
    contrastText: '#FFFFFF'
  },
  background: {
    default: '#F5F7FA',
    paper: '#FFFFFF'
  },
  text: {
    primary: '#333333',
    secondary: '#666666',
    disabled: '#ABABAB'
  },
  divider: '#E0E4E8'
};

// Declare custom colors
declare module '@mui/material/styles' {
  interface Palette {
    primaryLighter: Palette['primary'];
  }
  
  interface PaletteOptions {
    primaryLighter?: PaletteOptions['primary'];
  }
}

// Create a base theme
let theme = createTheme({
  palette: {
    ...palette,
    primaryLighter: {
      main: '#F0F5FF',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
    },
    subtitle1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: '0.875rem',
      lineHeight: 1.57,
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          textTransform: 'none',
          fontWeight: 500,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.1), 0px 4px 5px 0px rgba(0,0,0,0.07), 0px 1px 10px 0px rgba(0,0,0,0.06)',
          }
        }
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12)',
          transition: 'box-shadow 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
          }
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '24px',
          '&:last-child': {
            paddingBottom: '24px',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          minHeight: 48,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    }
  },
});

// Make typography responsive
theme = responsiveFontSizes(theme);

export default theme;
