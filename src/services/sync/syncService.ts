/**
 * Service for synchronizing data between local IndexedDB and Firebase
 * Handles offline data operations and syncs when connection is restored
 */

import { getFirestore, doc, setDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Types for sync operations
export interface SyncOperation {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entityType: 'session' | 'recording' | 'analysis' | 'feedback';
  entityId: string;
  data: any;
  timestamp: number;
  userId: string;
  retryCount: number;
  audioBlob?: Blob;
}

// IndexedDB configuration
export const syncDbConfig = {
  name: 'speakbetter-sync-db',
  version: 1,
  stores: {
    pendingOperations: {
      keyPath: 'id',
      indexes: [
        { name: 'byTimestamp', keyPath: 'timestamp' },
        { name: 'byEntityType', keyPath: 'entityType' },
        { name: 'byUserId', keyPath: 'userId' }
      ],
    },
    syncMetadata: {
      keyPath: 'id'
    }
  }
};

/**
 * Adds a pending operation to be synced when online
 */
export const addPendingOperation = async (
  dbAccess: any, // This would be the result from useIndexedDB
  operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>
): Promise<string> => {
  const id = `${operation.entityType}_${operation.entityId}_${Date.now()}`;
  const timestamp = Date.now();

  const syncOp: SyncOperation = {
    ...operation,
    id,
    timestamp,
    retryCount: 0
  };

  await dbAccess.add('pendingOperations', syncOp);
  return id;
};

/**
 * Processes all pending sync operations
 */
export const processPendingOperations = async (
  dbAccess: any,
  userId: string
): Promise<{
  success: number;
  failed: number;
  remaining: number;
}> => {
  try {
    // Get all pending operations for this user
    const pendingOps = await dbAccess.getAll('pendingOperations');
    const userPendingOps = pendingOps.filter(
      (op: SyncOperation) => op.userId === userId
    );
    
    let success = 0;
    let failed = 0;
    
    // Process operations in order by timestamp
    const sortedOps = userPendingOps.sort(
      (a: SyncOperation, b: SyncOperation) => a.timestamp - b.timestamp
    );
    
    for (const operation of sortedOps) {
      try {
        await processOperation(operation);
        // If successful, remove from pending operations
        await dbAccess.remove('pendingOperations', operation.id);
        success++;
      } catch (error) {
        console.error('Failed to process operation:', error);
        // Increment retry count
        const updatedOp = {
          ...operation,
          retryCount: operation.retryCount + 1
        };
        await dbAccess.update('pendingOperations', updatedOp);
        failed++;
      }
    }
    
    // Check for any remaining operations
    const remainingOps = await dbAccess.getAll('pendingOperations');
    const remainingUserOps = remainingOps.filter(
      (op: SyncOperation) => op.userId === userId
    );
    
    return {
      success,
      failed,
      remaining: remainingUserOps.length
    };
  } catch (error) {
    console.error('Error processing pending operations:', error);
    throw error;
  }
};

/**
 * Process an individual sync operation
 */
const processOperation = async (operation: SyncOperation): Promise<void> => {
  const { entityType, entityId, data, operation: opType, audioBlob } = operation;
  const db = getFirestore();
  
  // Handle audio upload first if present
  let audioUrl = data.audioUrl;
  if (audioBlob && entityType === 'recording') {
    audioUrl = await uploadAudio(audioBlob, entityId, operation.userId);
    data.audioUrl = audioUrl;
  }
  
  // Process based on operation type
  switch (opType) {
    case 'create':
    case 'update': {
      const docRef = getEntityRef(db, entityType, entityId);
      
      // Add server timestamp and ensure data has the correct format for Firestore
      const processedData = {
        ...data,
        updatedAt: Timestamp.now(),
        // For new records, add createdAt
        ...(opType === 'create' ? { createdAt: Timestamp.now() } : {})
      };
      
      await setDoc(docRef, processedData, { merge: true });
      break;
    }
    
    case 'delete': {
      // In most cases, we'll just mark as deleted rather than actually deleting
      const docRef = getEntityRef(db, entityType, entityId);
      await setDoc(docRef, { deleted: true, updatedAt: Timestamp.now() }, { merge: true });
      break;
    }
    
    default:
      throw new Error(`Unknown operation type: ${opType}`);
  }
};

/**
 * Helper to get the entity reference based on entity type
 */
const getEntityRef = (db: any, entityType: string, entityId: string) => {
  const collectionMap: Record<string, string> = {
    session: 'sessions',
    recording: 'recordings',
    analysis: 'speechAnalysis',
    feedback: 'feedback'
  };
  
  const collectionName = collectionMap[entityType];
  if (!collectionName) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }
  
  return doc(db, collectionName, entityId);
};

/**
 * Upload audio to Firebase Storage
 */
const uploadAudio = async (
  audioBlob: Blob,
  recordingId: string,
  userId: string
): Promise<string> => {
  const storage = getStorage();
  const audioRef = ref(storage, `recordings/${userId}/${recordingId}.webm`);
  
  await uploadBytes(audioRef, audioBlob);
  const downloadURL = await getDownloadURL(audioRef);
  
  return downloadURL;
};

/**
 * Get data that needs to be synchronized to local storage
 * Fetches recent remote data that may not be in local storage
 */
export const getRemoteDataForSync = async (
  userId: string,
  lastSyncTimestamp: number
): Promise<{
  sessions: any[];
  recordings: any[];
  analyses: any[];
  feedback: any[];
}> => {
  const db = getFirestore();
  const lastSyncDate = new Date(lastSyncTimestamp);
  const firestoreTimestamp = Timestamp.fromDate(lastSyncDate);
  
  // Fetch sessions
  const sessionsQuery = query(
    collection(db, 'sessions'),
    where('userId', '==', userId),
    where('updatedAt', '>', firestoreTimestamp)
  );
  const sessionsSnapshot = await getDocs(sessionsQuery);
  const sessions = sessionsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  // Fetch speech analyses
  const analysesQuery = query(
    collection(db, 'speechAnalysis'),
    where('userId', '==', userId),
    where('updatedAt', '>', firestoreTimestamp)
  );
  const analysesSnapshot = await getDocs(analysesQuery);
  const analyses = analysesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  // Fetch feedback
  const feedbackQuery = query(
    collection(db, 'feedback'),
    where('userId', '==', userId),
    where('updatedAt', '>', firestoreTimestamp)
  );
  const feedbackSnapshot = await getDocs(feedbackQuery);
  const feedback = feedbackSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  // Return all fetched data
  return {
    sessions,
    recordings: [], // We don't sync full recordings from server to client
    analyses,
    feedback
  };
};

/**
 * Update the last sync timestamp
 */
export const updateSyncMetadata = async (
  dbAccess: any,
  userId: string
): Promise<void> => {
  const now = Date.now();
  
  try {
    // Try to update the existing metadata
    const existingMetadata = await dbAccess.getById('syncMetadata', userId);
    
    if (existingMetadata) {
      await dbAccess.update('syncMetadata', {
        ...existingMetadata,
        lastSyncTimestamp: now
      });
    } else {
      // Create new metadata if it doesn't exist
      await dbAccess.add('syncMetadata', {
        id: userId,
        lastSyncTimestamp: now,
        createdAt: now
      });
    }
  } catch (error) {
    console.error('Error updating sync metadata:', error);
    throw error;
  }
};

/**
 * Get the last sync timestamp for a user
 */
export const getLastSyncTimestamp = async (
  dbAccess: any,
  userId: string
): Promise<number> => {
  try {
    const metadata = await dbAccess.getById('syncMetadata', userId);
    return metadata?.lastSyncTimestamp || 0;
  } catch (error) {
    console.error('Error getting last sync timestamp:', error);
    return 0; // Default to 0 if not found or error
  }
};
