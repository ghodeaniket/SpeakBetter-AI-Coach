/**
 * Auth Example Component
 * Demonstrates how to use services in a React component
 */

import React, { useState, useEffect } from 'react';
import { useAuthService, useUserService } from '../providers';
import { User } from '@speakbetter/core/models/user';

/**
 * Auth Example Component
 * Shows authentication state and provides login/logout functionality
 */
export const AuthExample: React.FC = () => {
  const authService = useAuthService();
  const userService = useUserService();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [authService]);
  
  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const authUser = await authService.signInWithGoogle();
      
      // Check if user profile exists, create if not
      const userExists = await userService.userExists(authUser.uid);
      if (!userExists) {
        await userService.createUser({
          uid: authUser.uid,
          displayName: authUser.displayName,
          email: authUser.email,
          photoURL: authUser.photoURL
        });
      } else {
        // Update last login time
        await userService.updateLastLoginTime(authUser.uid);
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError('Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignOut = async () => {
    try {
      setError(null);
      await authService.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out');
    }
  };
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      
      {user ? (
        <div>
          <p>Signed in as: {user.displayName || user.email}</p>
          {user.photoURL && (
            <img 
              src={user.photoURL} 
              alt="Profile" 
              style={{ width: 50, height: 50, borderRadius: '50%' }} 
            />
          )}
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      ) : (
        <div>
          <p>Not signed in</p>
          <button onClick={handleGoogleSignIn}>Sign in with Google</button>
        </div>
      )}
    </div>
  );
};
