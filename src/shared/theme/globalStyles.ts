import { Theme } from '@mui/material/styles';

// Define global styles as a function that takes a theme
const globalStyles = (theme: Theme) => ({
  // Global body styles
  body: {
    backgroundColor: theme.palette.background.default,
    margin: 0,
    padding: 0,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.text.primary,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    overflowX: 'hidden',
  },
  
  // Smoother scrolling
  html: {
    scrollBehavior: 'smooth',
  },
  
  // Remove outline for mouse users but keep for keyboard users
  '*:focus:not(:focus-visible)': {
    outline: 'none',
  },
  
  // Add transition to all interactive elements
  'a, button, .MuiButtonBase-root': {
    transition: 'all 0.2s ease-in-out',
  },
  
  // Custom scrollbar for webkit browsers
  '::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  '::-webkit-scrollbar-track': {
    background: theme.palette.background.default,
  },
  '::-webkit-scrollbar-thumb': {
    background: theme.palette.divider,
    borderRadius: '4px',
  },
  '::-webkit-scrollbar-thumb:hover': {
    background: theme.palette.text.disabled,
  },
});

// Export the global styles function
export default globalStyles;
