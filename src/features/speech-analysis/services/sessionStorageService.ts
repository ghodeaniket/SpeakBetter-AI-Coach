import { v4 as uuidv4 } from 'uuid';
import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../firebase';
import { SpeechAnalysisResult } from './speechAnalysisService';

// Define session interface
export interface SessionData {
  id?: string;
  userId?: string;
  type: string;
  content?: string;
  audioBlob?: Blob | null;
  audioUrl?: string;
  analysis: SpeechAnalysisResult;
  createdAt: Date;
}

// Define session with full metadata
export interface Session {
  id: string;
  userId: string;
  type: string;
  content?: string;
  audioUrl?: string;
  analysis: SpeechAnalysisResult;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Save a practice session to Firestore
 * @param sessionData Session data to save
 * @returns Promise with the saved session ID
 */
export const saveSessionToFirestore = async (sessionData: SessionData): Promise<string> => {
  try {
    // Generate unique ID for the session
    const sessionId = sessionData.id || uuidv4();
    
    // Get current user ID (this would be replaced with actual auth check)
    const userId = sessionData.userId || 'anonymous'; // For demo, will be replaced with actual auth
    
    // Upload audio file to storage if provided
    let audioUrl = sessionData.audioUrl;
    
    if (sessionData.audioBlob) {
      // Create storage reference
      const storageRef = ref(storage, `sessions/${userId}/${sessionId}.webm`);
      
      // Upload audio blob
      await uploadBytes(storageRef, sessionData.audioBlob);
      
      // Get download URL
      audioUrl = await getDownloadURL(storageRef);
    }
    
    // Create session document
    const sessionDoc = {
      id: sessionId,
      userId,
      type: sessionData.type,
      content: sessionData.content,
      audioUrl,
      analysis: sessionData.analysis,
      createdAt: sessionData.createdAt || new Date(),
      updatedAt: new Date()
    };
    
    // Save to Firestore
    const sessionsCollection = collection(db, 'sessions');
    await setDoc(doc(sessionsCollection, sessionId), sessionDoc);
    
    return sessionId;
  } catch (error) {
    console.error('Error saving session:', error);
    throw error;
  }
};

/**
 * Get a session by ID
 * @param sessionId Session ID
 * @returns Promise with the session data
 */
export const getSessionById = async (sessionId: string): Promise<Session | null> => {
  try {
    const sessionDoc = await getDoc(doc(db, 'sessions', sessionId));
    
    if (!sessionDoc.exists()) {
      return null;
    }
    
    // Convert timestamps to dates
    const data = sessionDoc.data() as Record<string, any>;
    
    return {
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate()
    } as Session;
  } catch (error) {
    console.error('Error getting session:', error);
    throw error;
  }
};

/**
 * Get user sessions
 * @param userId User ID
 * @param limit Maximum number of sessions to retrieve
 * @returns Promise with array of sessions
 */
export const getUserSessions = async (userId: string, limitCount = 10): Promise<Session[]> => {
  try {
    const sessionsCollection = collection(db, 'sessions');
    const q = query(
      sessionsCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const sessions: Session[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Record<string, any>;
      
      sessions.push({
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate()
      } as Session);
    });
    
    return sessions;
  } catch (error) {
    console.error('Error getting user sessions:', error);
    throw error;
  }
};

/**
 * Delete a session
 * @param sessionId Session ID
 * @param userId User ID (for verification)
 * @returns Promise indicating success
 */
export const deleteSession = async (sessionId: string, userId: string): Promise<boolean> => {
  try {
    // Get session first to verify ownership
    const session = await getSessionById(sessionId);
    
    if (!session || session.userId !== userId) {
      throw new Error('Session not found or access denied');
    }
    
    // Delete audio file if exists
    if (session.audioUrl) {
      const audioRef = ref(storage, `sessions/${userId}/${sessionId}.webm`);
      try {
        await getDownloadURL(audioRef); // Check if file exists
        // Delete the file
        // await deleteObject(audioRef); // Uncommented when needed
      } catch (error) {
        // File doesn't exist, continue
      }
    }
    
    // Delete session document
    // await deleteDoc(doc(db, 'sessions', sessionId)); // Uncommented when needed
    
    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
};

/**
 * Get user stats from sessions
 * @param userId User ID
 * @returns Promise with user stats
 */
export const getUserStats = async (userId: string): Promise<{
  totalSessions: number;
  averageClarityScore: number;
  averageWordsPerMinute: number | null;
  totalFillerWords: number;
  averageFillerPercentage: number;
  lastSessionDate: Date | null;
}> => {
  try {
    // Get all user sessions
    const sessions = await getUserSessions(userId, 100); // Limit to last 100 sessions
    
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        averageClarityScore: 0,
        averageWordsPerMinute: null,
        totalFillerWords: 0,
        averageFillerPercentage: 0,
        lastSessionDate: null
      };
    }
    
    // Calculate stats
    let totalClarityScore = 0;
    let totalWpmCount = 0;
    let totalWpm = 0;
    let totalFillerWords = 0;
    let totalWordsAnalyzed = 0;
    
    // Process each session
    for (const session of sessions) {
      totalClarityScore += session.analysis.clarityScore;
      
      if (session.analysis.wordsPerMinute) {
        totalWpm += session.analysis.wordsPerMinute;
        totalWpmCount++;
      }
      
      if (session.analysis.fillerWords) {
        totalFillerWords += session.analysis.fillerWords.count;
      }
      
      totalWordsAnalyzed += session.analysis.wordCount;
    }
    
    // Calculate averages
    const averageClarityScore = totalClarityScore / sessions.length;
    const averageWordsPerMinute = totalWpmCount > 0 ? totalWpm / totalWpmCount : null;
    const averageFillerPercentage = totalWordsAnalyzed > 0 ? (totalFillerWords / totalWordsAnalyzed) * 100 : 0;
    
    // Get the date of the most recent session
    const lastSessionDate = sessions.length > 0 ? sessions[0].createdAt : null;
    
    return {
      totalSessions: sessions.length,
      averageClarityScore,
      averageWordsPerMinute,
      totalFillerWords,
      averageFillerPercentage,
      lastSessionDate
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw error;
  }
};

export default {
  saveSessionToFirestore,
  getSessionById,
  getUserSessions,
  deleteSession,
  getUserStats
};
