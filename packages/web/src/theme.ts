import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#4A55A2',
    },
    secondary: {
      main: '#7986CB',
    },
    success: {
      main: '#4CAF50',
    },
    warning: {
      main: '#FF7043',
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: 'Inter, Arial, sans-serif',
    h1: { fontSize: '24px', fontWeight: 700 },
    h2: { fontSize: '20px', fontWeight: 600 },
    h3: { fontSize: '18px', fontWeight: 500 },
    body1: { fontSize: '16px', fontWeight: 400, color: '#666666' },
    body2: { fontSize: '14px', fontWeight: 400, color: '#666666' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '30px',
          textTransform: 'none',
          padding: '8px 24px',
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#3A4480',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});
