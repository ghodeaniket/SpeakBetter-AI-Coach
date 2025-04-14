import React, { act } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthExample } from '../AuthExample';
import { AuthService, User } from '@speakbetter/core';

// Mock the provider hooks
jest.mock('../../../src/providers', () => ({
  useAuthService: jest.fn(),
  useUserService: jest.fn(),
}));

// Import the mocked providers
import { useAuthService, useUserService } from '../../../src/providers';

describe('AuthExample Component', () => {
  // Mock data
  const mockUser: User = {
    uid: 'test-user-123',
    displayName: 'Test User',
    email: 'test@example.com',
    photoURL: 'https://example.com/photo.jpg',
    createdAt: new Date(),
    lastLoginAt: new Date(),
  };

  // Mock auth service
  const mockAuthService = {
    onAuthStateChanged: jest.fn(),
    signInWithGoogle: jest.fn(),
    signOut: jest.fn(),
  };

  // Mock user service
  const mockUserService = {
    userExists: jest.fn(),
    createUser: jest.fn(),
    updateLastLoginTime: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthService as jest.Mock).mockReturnValue(mockAuthService);
    (useUserService as jest.Mock).mockReturnValue(mockUserService);
  });

  it('should render loading state initially', () => {
    // Set up auth state changed callback that doesn't call the callback immediately
    mockAuthService.onAuthStateChanged.mockImplementation(() => {
      // Return unsubscribe function
      return () => {};
    });

    render(<AuthExample />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render signed out state', () => {
    // Set up auth state changed callback that calls the callback with null user
    mockAuthService.onAuthStateChanged.mockImplementation((callback) => {
      callback(null);
      // Return unsubscribe function
      return () => {};
    });

    render(<AuthExample />);
    expect(screen.getByText('Not signed in')).toBeInTheDocument();
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();
  });

  it('should render signed in state', () => {
    // Set up auth state changed callback that calls the callback with a user
    mockAuthService.onAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      // Return unsubscribe function
      return () => {};
    });

    render(<AuthExample />);
    expect(screen.getByText(`Signed in as: ${mockUser.displayName}`)).toBeInTheDocument();
    expect(screen.getByAltText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('should handle sign in with Google', async () => {
    // Set up auth state changed callback that calls the callback with null user
    mockAuthService.onAuthStateChanged.mockImplementation((callback) => {
      callback(null);
      // Return unsubscribe function
      return () => {};
    });

    // Set up successful sign in
    mockAuthService.signInWithGoogle.mockResolvedValue(mockUser);
    mockUserService.userExists.mockResolvedValue(false);
    mockUserService.createUser.mockResolvedValue(undefined);

    render(<AuthExample />);
    
    // Click sign in button
    fireEvent.click(screen.getByText('Sign in with Google'));
    
    // Wait for sign in process
    await waitFor(() => {
      expect(mockAuthService.signInWithGoogle).toHaveBeenCalledTimes(1);
      expect(mockUserService.userExists).toHaveBeenCalledWith(mockUser.uid);
      expect(mockUserService.createUser).toHaveBeenCalledWith({
        uid: mockUser.uid,
        displayName: mockUser.displayName,
        email: mockUser.email,
        photoURL: mockUser.photoURL
      });
    });
  });

  it('should handle sign out', async () => {
    // Set up auth state changed callback that calls the callback with a user
    mockAuthService.onAuthStateChanged.mockImplementation((callback) => {
      callback(mockUser);
      // Return unsubscribe function
      return () => {};
    });

    // Set up successful sign out
    mockAuthService.signOut.mockResolvedValue(undefined);

    render(<AuthExample />);
    
    // Click sign out button
    fireEvent.click(screen.getByText('Sign Out'));
    
    // Wait for sign out process
    await waitFor(() => {
      expect(mockAuthService.signOut).toHaveBeenCalledTimes(1);
    });
  });

  it('should show error message when sign in fails', async () => {
    // Set up auth state changed callback that calls the callback with null user
    mockAuthService.onAuthStateChanged.mockImplementation((callback) => {
      callback(null);
      // Return unsubscribe function
      return () => {};
    });

    // Set up failed sign in
    mockAuthService.signInWithGoogle.mockRejectedValue(new Error('Sign in failed'));

    render(<AuthExample />);
    
    // Click sign in button
    fireEvent.click(screen.getByText('Sign in with Google'));
    
    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to sign in with Google')).toBeInTheDocument();
    });
  });
});