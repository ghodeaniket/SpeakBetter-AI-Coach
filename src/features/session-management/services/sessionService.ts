import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../../firebase/config';
import { v4 as uuidv4 } from 'uuid';

// Import new sync-related functionality
import { addPendingOperation } from '../../../services/sync/syncService';

// Session type definition based on Firestore schema
export interface Session {
  id?: string;
  userId: string;
  type: 'freestyle' | 'guided' | 'qa';
  status: 'created' | 'recording' | 'processing' | 'completed' | 'error';
  recordingUrl?: string;
  durationSeconds?: number;
  createdAt: Timestamp | Date; // Can be either Firestore Timestamp or JavaScript Date
  updatedAt?: Timestamp | Date; // Track update time for sync purposes
  hasAnalysis: boolean;
  hasFeedback: boolean;
  title?: string;
  contentId?: string; // ID of the guided reading content or Q&A question
  referenceText?: string; // For guided reading to compare against
  question?: string; // For Q&A to store the question text
  metrics?: {
    wordsPerMinute?: number;
    fillerWordCount?: number;
    fillerWordPercentage?: number;
    clarityScore?: number;
    accuracyScore?: number; // For guided reading
    structureScore?: number; // For Q&A
  };
  offlineId?: string; // ID for offline operations
  pendingSync?: boolean; // Flag to indicate the session is waiting to be synced
}

/**
 * Creates a new session in Firestore
 * @param userId The ID of the user who owns the session
 * @param sessionType The type of session (freestyle, guided, qa)
 * @param contentId Optional ID of the guided reading content or Q&A question
 * @param options Additional session options
 * @returns The ID of the created session
 */
export const createSession = async (
  userId: string, 
  sessionType: 'freestyle' | 'guided' | 'qa',
  contentId?: string,
  options?: {
    referenceText?: string;
    question?: string;
    title?: string;
    dbAccess?: any; // IndexedDB access from useIndexedDB hook
    isOffline?: boolean; // Whether we're currently offline
  }
): Promise<string> => {
  try {
    const now = new Date();
    const offlineId = uuidv4(); // Generate a unique ID for offline mode
    
    const sessionData: Omit<Session, 'id'> = {
      userId,
      type: sessionType,
      status: 'created',
      createdAt: now,
      updatedAt: now,
      hasAnalysis: false,
      hasFeedback: false,
      offlineId
    };

    // Add content ID if provided
    if (contentId) {
      sessionData.contentId = contentId;
    }

    // Add optional data if provided
    if (options?.referenceText) {
      sessionData.referenceText = options.referenceText;
    }

    if (options?.question) {
      sessionData.question = options.question;
    }

    if (options?.title) {
      sessionData.title = options.title;
    }

    // Handle offline mode
    if (options?.isOffline && options?.dbAccess) {
      // Store in IndexedDB
      const sessionWithId: Session = {
        ...sessionData,
        id: offlineId,
        pendingSync: true
      };
      
      await options.dbAccess.add('sessions', sessionWithId);
      
      // Add to pending operations queue for later sync
      if (options.dbAccess) {
        await addPendingOperation(options.dbAccess, {
          operation: 'create',
          entityType: 'session',
          entityId: offlineId,
          data: sessionData,
          userId
        });
      }
      
      return offlineId;
    } else {
      // Online mode - store directly in Firestore
      const docRef = await addDoc(collection(db, 'sessions'), sessionData);
      return docRef.id;
    }
  } catch (error) {
    console.error('Error creating session:', error);
    throw new Error('Failed to create session');
  }
};

/**
 * Updates an existing session in Firestore
 * @param sessionId The ID of the session to update
 * @param data The data to update
 * @param options Options for offline support
 */
export const updateSession = async (
  sessionId: string, 
  data: Partial<Omit<Session, 'id' | 'userId' | 'createdAt'>>,
  options?: {
    dbAccess?: any; // IndexedDB access from useIndexedDB hook
    isOffline?: boolean; // Whether we're currently offline
    userId?: string; // Required for offline operations
  }
): Promise<void> => {
  try {
    // Add updated timestamp
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    // Handle offline mode
    if (options?.isOffline && options?.dbAccess && options?.userId) {
      // First, try to get the existing session from IndexedDB
      let existingSession = await options.dbAccess.getById('sessions', sessionId);
      
      if (!existingSession) {
        // If not in IndexedDB, try to get from Firestore (might be cached)
        try {
          existingSession = await getSession(sessionId);
          
          if (existingSession) {
            // Store in IndexedDB for future offline access
            await options.dbAccess.add('sessions', existingSession);
          }
        } catch (error) {
          console.error('Error getting session from Firestore in offline mode:', error);
        }
      }
      
      if (existingSession) {
        // Update the session in IndexedDB
        const updatedSession = {
          ...existingSession,
          ...updateData,
          pendingSync: true
        };
        
        await options.dbAccess.update('sessions', updatedSession);
        
        // Add to pending operations queue for later sync
        await addPendingOperation(options.dbAccess, {
          operation: 'update',
          entityType: 'session',
          entityId: sessionId,
          data: updateData,
          userId: options.userId
        });
      } else {
        throw new Error('Session not found in offline storage');
      }
    } else {
      // Online mode - update directly in Firestore
      const sessionRef = doc(db, 'sessions', sessionId);
      await updateDoc(sessionRef, updateData);
    }
  } catch (error) {
    console.error('Error updating session:', error);
    throw new Error('Failed to update session');
  }
};

/**
 * Gets a session by ID
 * @param sessionId The ID of the session to get
 * @param options Options for offline support
 * @returns The session data or null if not found
 */
export const getSession = async (
  sessionId: string,
  options?: {
    dbAccess?: any; // IndexedDB access from useIndexedDB hook
    isOffline?: boolean; // Whether we're currently offline
  }
): Promise<Session | null> => {
  try {
    // Handle offline mode
    if (options?.isOffline && options?.dbAccess) {
      // Try to get from IndexedDB
      const session = await options.dbAccess.getById('sessions', sessionId);
      return session || null;
    }
    
    // Try to get from Firestore
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (sessionSnap.exists()) {
      const sessionData = { id: sessionSnap.id, ...sessionSnap.data() } as Session;
      
      // If we have IndexedDB access, store for offline use
      if (options?.dbAccess) {
        try {
          await options.dbAccess.update('sessions', sessionData);
        } catch (error) {
          console.warn('Could not store session in IndexedDB:', error);
          // No need to fail the entire operation if this fails
        }
      }
      
      return sessionData;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting session:', error);
    
    // If offline and we couldn't get from network, try IndexedDB as fallback
    if (options?.isOffline && options?.dbAccess) {
      try {
        const session = await options.dbAccess.getById('sessions', sessionId);
        return session || null;
      } catch (dbError) {
        console.error('Error getting session from IndexedDB:', dbError);
      }
    }
    
    throw new Error('Failed to get session');
  }
};

/**
 * Gets all sessions for a user
 * @param userId The ID of the user
 * @param options Options for offline support
 * @returns Array of session data
 */
export const getUserSessions = async (
  userId: string,
  options?: {
    dbAccess?: any; // IndexedDB access from useIndexedDB hook
    isOffline?: boolean; // Whether we're currently offline
  }
): Promise<Session[]> => {
  try {
    // Try to get from Firestore first if online
    if (!options?.isOffline) {
      const q = query(
        collection(db, 'sessions'), 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const sessions = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Session[];
      
      // If we have IndexedDB access, store for offline use
      if (options?.dbAccess) {
        try {
          // Store each session individually
          for (const session of sessions) {
            await options.dbAccess.update('sessions', session);
          }
        } catch (error) {
          console.warn('Could not store sessions in IndexedDB:', error);
          // No need to fail the entire operation if this fails
        }
      }
      
      return sessions;
    }
    
    // Offline mode - get from IndexedDB
    if (options?.dbAccess) {
      const allSessions = await options.dbAccess.getAll('sessions');
      // Filter for current user and sort by createdAt (newest first)
      return allSessions
        .filter((session: Session) => session.userId === userId)
        .sort((a: Session, b: Session) => {
          // Convert to timestamps if they're Date objects
          const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt.toMillis();
          const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt.toMillis();
          return bTime - aTime; // descending order
        });
    }
    
    throw new Error('No IndexedDB access provided for offline mode');
  } catch (error) {
    console.error('Error getting user sessions:', error);
    
    // Try to get from IndexedDB as fallback
    if (options?.dbAccess) {
      try {
        const allSessions = await options.dbAccess.getAll('sessions');
        return allSessions
          .filter((session: Session) => session.userId === userId)
          .sort((a: Session, b: Session) => {
            const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : a.createdAt.toMillis();
            const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : b.createdAt.toMillis();
            return bTime - aTime;
          });
      } catch (dbError) {
        console.error('Error getting sessions from IndexedDB:', dbError);
      }
    }
    
    throw new Error('Failed to get user sessions');
  }
};

/**
 * Deletes a session and its associated recording
 * @param sessionId The ID of the session to delete
 * @param userId The ID of the user who owns the session (for verification)
 * @param options Options for offline support
 */
export const deleteSession = async (
  sessionId: string, 
  userId: string,
  options?: {
    dbAccess?: any; // IndexedDB access from useIndexedDB hook
    isOffline?: boolean; // Whether we're currently offline
  }
): Promise<void> => {
  try {
    // First, get the session to verify ownership
    let session: Session | null = null;
    
    if (options?.isOffline && options?.dbAccess) {
      // Try to get from IndexedDB
      session = await options.dbAccess.getById('sessions', sessionId);
    } else {
      // Try to get from Firestore
      session = await getSession(sessionId);
    }
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    if (session.userId !== userId) {
      throw new Error('Unauthorized: You do not own this session');
    }
    
    // Handle offline mode
    if (options?.isOffline && options?.dbAccess) {
      // If the session was created offline and never synced, we can just remove it
      if (session.pendingSync && session.offlineId === session.id) {
        // Delete from IndexedDB
        await options.dbAccess.remove('sessions', sessionId);
        
        // Try to find and remove any pending operations for this session
        const pendingOps = await options.dbAccess.getAll('pendingOperations');
        const relatedOps = pendingOps.filter(
          (op: any) => op.entityType === 'session' && op.entityId === sessionId
        );
        
        for (const op of relatedOps) {
          await options.dbAccess.remove('pendingOperations', op.id);
        }
      } else {
        // Session exists on server, mark for deletion when online
        // Add pending delete operation
        await addPendingOperation(options.dbAccess, {
          operation: 'delete',
          entityType: 'session',
          entityId: sessionId,
          data: { id: sessionId }, // Minimal data needed for deletion
          userId
        });
        
        // Mark as pending delete in local storage
        await options.dbAccess.update('sessions', {
          ...session,
          pendingSync: true,
          status: 'deleted' // Local status to indicate pending deletion
        });
      }
      
      return;
    }
    
    // Online mode - delete from Firestore and Storage
    
    // Delete recording from storage if it exists
    if (session.recordingUrl) {
      try {
        const storageRef = ref(storage, `recordings/${userId}/${sessionId}.webm`);
        await deleteObject(storageRef);
      } catch (storageError) {
        console.warn('Could not delete recording file, it may not exist:', storageError);
        // Continue with session deletion even if recording deletion fails
      }
    }
    
    // Delete the session document from Firestore
    const sessionRef = doc(db, 'sessions', sessionId);
    await deleteDoc(sessionRef);
    
    // If we have IndexedDB access, also remove from local storage
    if (options?.dbAccess) {
      try {
        await options.dbAccess.remove('sessions', sessionId);
      } catch (error) {
        console.warn('Could not remove session from IndexedDB:', error);
        // No need to fail the operation if this fails
      }
    }
  } catch (error) {
    console.error('Error deleting session:', error);
    throw new Error('Failed to delete session');
  }
};

/**
 * Uploads a recording file and updates the session with the URL
 * @param sessionId The ID of the session
 * @param userId The ID of the user
 * @param audioBlob The audio recording blob
 * @param durationSeconds The duration of the recording in seconds
 * @param options Options for offline support
 */
export const uploadSessionRecording = async (
  sessionId: string,
  userId: string,
  audioBlob: Blob,
  durationSeconds: number,
  options?: {
    dbAccess?: any; // IndexedDB access from useIndexedDB hook
    isOffline?: boolean; // Whether we're currently offline
  }
): Promise<string> => {
  try {
    // Handle offline mode
    if (options?.isOffline && options?.dbAccess) {
      // Update local session status to processing
      const session = await options.dbAccess.getById('sessions', sessionId);
      
      if (!session) {
        throw new Error('Session not found in offline storage');
      }
      
      // Create a local object URL for the audio blob
      const tempUrl = URL.createObjectURL(audioBlob);
      
      // Store the audio blob in IndexedDB for later upload
      // We'll use a separate store for audio blobs
      const audioEntry = {
        id: sessionId,
        userId,
        blob: audioBlob,
        createdAt: new Date(),
        durationSeconds
      };
      
      // Store or update the audio blob
      try {
        await options.dbAccess.add('audioRecordings', audioEntry);
      } catch (error) {
        // If add fails (e.g., due to duplicate ID), try update
        await options.dbAccess.update('audioRecordings', audioEntry);
      }
      
      // Update the session with the temporary URL and duration
      const updatedSession = {
        ...session,
        recordingUrl: tempUrl,
        durationSeconds,
        status: 'completed',
        pendingSync: true,
        updatedAt: new Date()
      };
      
      await options.dbAccess.update('sessions', updatedSession);
      
      // Queue sync operation for when we're back online
      await addPendingOperation(options.dbAccess, {
        operation: 'update',
        entityType: 'recording',
        entityId: sessionId,
        data: {
          sessionId,
          status: 'completed',
          durationSeconds
        },
        userId,
        audioBlob
      });
      
      return tempUrl;
    }
    
    // Online mode - store directly in Firebase
    
    // Update session status to processing
    await updateSession(sessionId, { status: 'processing' });
    
    // Upload the recording to Firebase Storage
    const storageRef = ref(storage, `recordings/${userId}/${sessionId}.webm`);
    await uploadBytes(storageRef, audioBlob);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    // Update the session with the recording URL and duration
    await updateSession(sessionId, {
      recordingUrl: downloadURL,
      durationSeconds,
      status: 'completed'
    });
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading session recording:', error);
    
    // Update session status to error
    if (options?.isOffline && options?.dbAccess) {
      try {
        const session = await options.dbAccess.getById('sessions', sessionId);
        if (session) {
          await options.dbAccess.update('sessions', {
            ...session,
            status: 'error',
            updatedAt: new Date(),
            pendingSync: true
          });
        }
      } catch (dbError) {
        console.error('Error updating session status in IndexedDB:', dbError);
      }
    } else {
      await updateSession(sessionId, { status: 'error' });
    }
    
    throw new Error('Failed to upload session recording');
  }
};

/**
 * Initializes the IndexedDB database schema for sessions
 * @returns Object store configuration for useIndexedDB hook
 */
export const getSessionDBConfig = () => {
  return {
    sessions: {
      keyPath: 'id',
      indexes: [
        { name: 'byUserId', keyPath: 'userId' },
        { name: 'byStatus', keyPath: 'status' },
        { name: 'byCreatedAt', keyPath: 'createdAt' },
        { name: 'byType', keyPath: 'type' }
      ]
    },
    audioRecordings: {
      keyPath: 'id',
      indexes: [
        { name: 'byUserId', keyPath: 'userId' },
        { name: 'byCreatedAt', keyPath: 'createdAt' }
      ]
    }
  };
};
