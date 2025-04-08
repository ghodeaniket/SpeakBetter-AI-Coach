import React from 'react';
import { Button, CircularProgress } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../../../shared/contexts/AuthContext';

interface LoginButtonProps {
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
  onLoginSuccess?: () => void;
  onLoginError?: (error: Error) => void;
}

const LoginButton: React.FC<LoginButtonProps> = ({
  variant = 'contained',
  color = 'primary',
  fullWidth = false,
  size = 'medium',
  onLoginSuccess,
  onLoginError
}) => {
  const { signInWithGoogle, isLoading, error } = useAuth();
  const [localLoading, setLocalLoading] = React.useState(false);

  const handleLogin = async () => {
    try {
      setLocalLoading(true);
      const user = await signInWithGoogle();
      if (user && onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      console.error('Login error:', err);
      if (onLoginError) {
        onLoginError(err instanceof Error ? err : new Error('Failed to login'));
      }
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      color={color}
      fullWidth={fullWidth}
      size={size}
      startIcon={localLoading || isLoading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
      onClick={handleLogin}
      disabled={localLoading || isLoading}
    >
      Continue with Google
    </Button>
  );
};

export default LoginButton;
