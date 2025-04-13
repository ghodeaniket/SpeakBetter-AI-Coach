import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query as firestoreQuery, 
  where, 
  orderBy, 
  limit, 
  QueryConstraint, 
  DocumentData, 
  DocumentReference,
  Query
} from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { FirebaseConfig } from './auth';

export interface FirestoreService {
  getDocument<T>(path: string): Promise<T | null>;
  setDocument<T>(path: string, data: T): Promise<void>;
  updateDocument<T>(path: string, data: Partial<T>): Promise<void>;
  deleteDocument(path: string): Promise<void>;
  query<T>(collection: string, ...queryConstraints: QueryConstraint[]): Promise<T[]>;
}

export const createFirestoreService = (config: FirebaseConfig): FirestoreService => {
  const app = initializeApp(config);
  const db = getFirestore(app);

  return {
    getDocument: async <T>(path: string): Promise<T | null> => {
      const docRef = doc(db, path) as DocumentReference<T>;
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as T : null;
    },
    
    setDocument: async <T>(path: string, data: T): Promise<void> => {
      // Remove any id field from the data, as it should be part of the path
      const { id, ...dataWithoutId } = data as any;
      await setDoc(doc(db, path), dataWithoutId as DocumentData);
    },
    
    updateDocument: async <T>(path: string, data: Partial<T>): Promise<void> => {
      // Remove any id field from the data, as it should be part of the path
      const { id, ...dataWithoutId } = data as any;
      await updateDoc(doc(db, path), dataWithoutId as DocumentData);
    },
    
    deleteDocument: async (path: string): Promise<void> => {
      await deleteDoc(doc(db, path));
    },
    
    query: async <T>(collectionName: string, ...queryConstraints: QueryConstraint[]): Promise<T[]> => {
      const q = firestoreQuery(collection(db, collectionName), ...queryConstraints) as Query<T>;
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    }
  };
};

// Export convenience functions for common Firestore query constraints
export { where, orderBy, limit } from 'firebase/firestore';
