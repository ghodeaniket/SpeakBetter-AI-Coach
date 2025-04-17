import { 
  AuthService, 
  User, 
  UserCredentials, 
  AppError 
} from '@speakbetter/core';
import auth, { 
  FirebaseAuthTypes 
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

/**
 * Converts a Firebase user to our application User model
 */
function convertFirebaseUser(firebaseUser: FirebaseAuthTypes.User): User {
  return {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName,
    email: firebaseUser.email,
    photoURL: firebaseUser.photoURL,
    emailVerified: firebaseUser.emailVerified,
    createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
    lastLoginAt: new Date(firebaseUser.metadata.lastSignInTime || Date.now()),
    settings: {
      selectedVoice: 'default',
      coachPersonality: 'supportive',
      notificationPreferences: {
        email: true,
        inApp: true,
        practiceDays: ['monday', 'wednesday', 'friday']
      }
    }
  };
}

/**
 * Firebase implementation of the AuthService interface for React Native
 */
export class FirebaseAuthAdapter implements AuthService {
  private currentUser: User | null = null;
  
  constructor() {
    // Configure Google Sign-In
    GoogleSignin.configure({
      webClientId: '123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com', // Should be configured with your web client id
    });
    
    // Initialize auth state
    auth().onAuthStateChanged((user) => {
      if (user) {
        this.currentUser = convertFirebaseUser(user);
      } else {
        this.currentUser = null;
      }
    });
  }
  
  /**
   * Get the current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    const user = auth().currentUser;
    if (user) {
      return convertFirebaseUser(user);
    }
    return null;
  }
  
  /**
   * Sign in with email and password
   */
  async signInWithEmailPassword(credentials: UserCredentials): Promise<User> {
    try {
      const result = await auth().signInWithEmailAndPassword(
        credentials.email, 
        credentials.password
      );
      const user = convertFirebaseUser(result.user);
      this.currentUser = user;
      return user;
    } catch (error: any) {
      const appError: AppError = {
        code: error.code || 'auth/unknown',
        message: error.message,
        originalError: error
      };
      throw appError;
    }
  }
  
  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<User> {
    try {
      // Get the users ID token
      const { idToken } = await GoogleSignin.signIn();
      
      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      
      // Sign-in the user with the credential
      const result = await auth().signInWithCredential(googleCredential);
      const user = convertFirebaseUser(result.user);
      this.currentUser = user;
      return user;
    } catch (error: any) {
      const appError: AppError = {
        code: error.code || 'auth/unknown',
        message: error.message,
        originalError: error
      };
      throw appError;
    }
  }
  
  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    try {
      // Sign out of Firebase
      await auth().signOut();
      
      // Check if user is signed in with Google
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) {
        await GoogleSignin.signOut();
      }
      
      this.currentUser = null;
    } catch (error: any) {
      const appError: AppError = {
        code: error.code || 'auth/unknown',
        message: error.message,
        originalError: error
      };
      throw appError;
    }
  }
  
  /**
   * Create a user with email and password
   */
  async createUserWithEmailPassword(credentials: UserCredentials): Promise<User> {
    try {
      const result = await auth().createUserWithEmailAndPassword(
        credentials.email, 
        credentials.password
      );
      const user = convertFirebaseUser(result.user);
      this.currentUser = user;
      return user;
    } catch (error: any) {
      const appError: AppError = {
        code: error.code || 'auth/unknown',
        message: error.message,
        originalError: error
      };
      throw appError;
    }
  }
  
  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error: any) {
      const appError: AppError = {
        code: error.code || 'auth/unknown',
        message: error.message,
        originalError: error
      };
      throw appError;
    }
  }
  
  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<void> {
    try {
      const user = auth().currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }
      await user.updatePassword(newPassword);
    } catch (error: any) {
      const appError: AppError = {
        code: error.code || 'auth/unknown',
        message: error.message,
        originalError: error
      };
      throw appError;
    }
  }
  
  /**
   * Delete the current user
   */
  async deleteUser(): Promise<void> {
    try {
      const user = auth().currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }
      await user.delete();
      this.currentUser = null;
    } catch (error: any) {
      const appError: AppError = {
        code: error.code || 'auth/unknown',
        message: error.message,
        originalError: error
      };
      throw appError;
    }
  }
  
  /**
   * Subscribe to authentication state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return auth().onAuthStateChanged((user) => {
      if (user) {
        callback(convertFirebaseUser(user));
      } else {
        callback(null);
      }
    });
  }
  
  /**
   * Get authentication token
   */
  async getIdToken(): Promise<string | null> {
    try {
      const user = auth().currentUser;
      if (!user) {
        return null;
      }
      return await user.getIdToken();
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Verify user's email
   */
  async sendEmailVerification(): Promise<void> {
    try {
      const user = auth().currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }
      await user.sendEmailVerification();
    } catch (error: any) {
      const appError: AppError = {
        code: error.code || 'auth/unknown',
        message: error.message,
        originalError: error
      };
      throw appError;
    }
  }
}