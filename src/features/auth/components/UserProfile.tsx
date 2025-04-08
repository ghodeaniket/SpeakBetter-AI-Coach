import React from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Typography
} from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth } from '../../../shared/contexts/AuthContext';

interface UserProfileProps {
  compact?: boolean;
  onLogout?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({
  compact = false,
  onLogout
}) => {
  const { userProfile, isLoading, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [loggingOut, setLoggingOut] = React.useState(false);

  if (isLoading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" p={1}>
        <CircularProgress size={compact ? 24 : 32} />
      </Box>
    );
  }

  if (!userProfile) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" p={1}>
        <AccountCircleIcon color="disabled" fontSize={compact ? "medium" : "large"} />
      </Box>
    );
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
      handleMenuClose();
    }
  };

  // Compact view for headers/navigation
  if (compact) {
    return (
      <>
        <IconButton
          edge="end"
          color="inherit"
          aria-label="user menu"
          onClick={handleMenuOpen}
          size="small"
        >
          <Avatar
            src={userProfile.photoURL || undefined}
            alt={userProfile.displayName || 'User'}
            sx={{ width: 32, height: 32 }}
          >
            {userProfile.displayName ? userProfile.displayName[0].toUpperCase() : 'U'}
          </Avatar>
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ vertical: -50, horizontal: 0 }}
        >
          <MenuItem disabled>
            <Typography variant="body2">
              {userProfile.displayName || userProfile.email}
            </Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? (
              <CircularProgress size={18} sx={{ mr: 1 }} />
            ) : (
              <ExitToAppIcon fontSize="small" sx={{ mr: 1 }} />
            )}
            Sign Out
          </MenuItem>
        </Menu>
      </>
    );
  }

  // Full profile view
  return (
    <Card variant="outlined">
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar
            src={userProfile.photoURL || undefined}
            alt={userProfile.displayName || 'User'}
            sx={{ width: 60, height: 60, mr: 2 }}
          >
            {userProfile.displayName ? userProfile.displayName[0].toUpperCase() : 'U'}
          </Avatar>
          <Box>
            <Typography variant="h6">
              {userProfile.displayName || 'User'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {userProfile.email}
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Button
          variant="outlined"
          color="primary"
          startIcon={loggingOut ? <CircularProgress size={18} /> : <ExitToAppIcon />}
          onClick={handleLogout}
          disabled={loggingOut}
          fullWidth
        >
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
};

export default UserProfile;
