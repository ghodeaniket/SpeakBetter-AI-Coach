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

// Session type definition based on Firestore schema
export interface Session {
  id?: string;
  userId: string;
  type: 'freestyle' | 'guided' | 'qa';
  status: 'created' | 'recording' | 'processing' | 'completed' | 'error';
  recordingUrl?: string;
  durationSeconds?: number;
  createdAt: Timestamp | Date; // Can be either Firestore Timestamp or JavaScript Date
  hasAnalysis: boolean;
  hasFeedback: boolean;
  title?: string;
}

/**
 * Creates a new session in Firestore
 * @param userId The ID of the user who owns the session
 * @param sessionType The type of session (freestyle, guided, qa)
 * @returns The ID of the created session
 */
export const createSession = async (
  userId: string, 
  sessionType: 'freestyle' | 'guided' | 'qa'
): Promise<string> => {
  try {
    const sessionData: Omit<Session, 'id'> = {
      userId,
      type: sessionType,
      status: 'created',
      createdAt: Timestamp.now(),
      hasAnalysis: false,
      hasFeedback: false
    };

    const docRef = await addDoc(collection(db, 'sessions'), sessionData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating session:', error);
    throw new Error('Failed to create session');
  }
};

/**
 * Updates an existing session in Firestore
 * @param sessionId The ID of the session to update
 * @param data The data to update
 */
export const updateSession = async (
  sessionId: string, 
  data: Partial<Omit<Session, 'id' | 'userId' | 'createdAt'>>
): Promise<void> => {
  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    await updateDoc(sessionRef, data);
  } catch (error) {
    console.error('Error updating session:', error);
    throw new Error('Failed to update session');
  }
};

/**
 * Gets a session by ID
 * @param sessionId The ID of the session to get
 * @returns The session data or null if not found
 */
export const getSession = async (sessionId: string): Promise<Session | null> => {
  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (sessionSnap.exists()) {
      return { id: sessionSnap.id, ...sessionSnap.data() } as Session;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting session:', error);
    throw new Error('Failed to get session');
  }
};

/**
 * Gets all sessions for a user
 * @param userId The ID of the user
 * @returns Array of session data
 */
export const getUserSessions = async (userId: string): Promise<Session[]> => {
  try {
    const q = query(
      collection(db, 'sessions'), 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as Session[];
  } catch (error) {
    console.error('Error getting user sessions:', error);
    throw new Error('Failed to get user sessions');
  }
};

/**
 * Deletes a session and its associated recording
 * @param sessionId The ID of the session to delete
 * @param userId The ID of the user who owns the session (for verification)
 */
export const deleteSession = async (sessionId: string, userId: string): Promise<void> => {
  try {
    // First, get the session to verify ownership and get the recording URL
    const session = await getSession(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    if (session.userId !== userId) {
      throw new Error('Unauthorized: You do not own this session');
    }
    
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
 */
export const uploadSessionRecording = async (
  sessionId: string,
  userId: string,
  audioBlob: Blob,
  durationSeconds: number
): Promise<string> => {
  try {
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
    await updateSession(sessionId, { status: 'error' });
    throw new Error('Failed to upload session recording');
  }
};
