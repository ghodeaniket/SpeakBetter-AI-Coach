import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  redirectPath?: string;
  children?: React.ReactNode;
}

/**
 * A wrapper for routes that require authentication
 * If user is not authenticated, redirects to the specified path
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  redirectPath = '/login',
  children
}) => {
  const { currentUser, isLoading } = useAuth();
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress size={40} />
      </Box>
    );
  }
  
  // Redirect if not authenticated
  if (!currentUser) {
    return <Navigate to={redirectPath} replace />;
  }
  
  // Return children or outlet for nested routes
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
