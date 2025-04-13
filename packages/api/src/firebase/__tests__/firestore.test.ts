import { createFirestoreService } from '../firestore';
import { FirestoreService } from '../firestore';

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn().mockReturnValue({})
}));

jest.mock('firebase/firestore', () => {
  const mockDocData = { name: 'Test Document', value: 123 };
  const mockDocSnapshot = {
    exists: jest.fn().mockReturnValue(true),
    id: 'test-doc-id',
    data: jest.fn().mockReturnValue(mockDocData)
  };
  
  const mockQuerySnapshot = {
    docs: [
      {
        id: 'doc1',
        data: jest.fn().mockReturnValue({ name: 'Document 1', value: 1 })
      },
      {
        id: 'doc2',
        data: jest.fn().mockReturnValue({ name: 'Document 2', value: 2 })
      }
    ]
  };
  
  return {
    getFirestore: jest.fn().mockReturnValue({}),
    collection: jest.fn().mockReturnValue({}),
    doc: jest.fn().mockReturnValue({}),
    getDoc: jest.fn().mockResolvedValue(mockDocSnapshot),
    getDocs: jest.fn().mockResolvedValue(mockQuerySnapshot),
    setDoc: jest.fn().mockResolvedValue(undefined),
    updateDoc: jest.fn().mockResolvedValue(undefined),
    deleteDoc: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockReturnValue({}),
    where: jest.fn().mockReturnValue({}),
    orderBy: jest.fn().mockReturnValue({}),
    limit: jest.fn().mockReturnValue({})
  };
});

describe('FirestoreService', () => {
  let firestoreService: FirestoreService;
  
  beforeEach(() => {
    firestoreService = createFirestoreService({
      apiKey: 'test-api-key',
      authDomain: 'test-auth-domain',
      projectId: 'test-project-id',
      storageBucket: 'test-storage-bucket',
      messagingSenderId: 'test-messaging-sender-id',
      appId: 'test-app-id'
    });
  });
  
  it('should get a document', async () => {
    const doc = await firestoreService.getDocument('test-collection/test-doc');
    
    expect(doc).toEqual({
      id: 'test-doc-id',
      name: 'Test Document',
      value: 123
    });
  });
  
  it('should set a document', async () => {
    const data = { id: 'test-id', name: 'Test Document', value: 123 };
    await expect(firestoreService.setDocument('test-collection/test-doc', data)).resolves.toBeUndefined();
  });
  
  it('should update a document', async () => {
    const data = { name: 'Updated Document' };
    await expect(firestoreService.updateDocument('test-collection/test-doc', data)).resolves.toBeUndefined();
  });
  
  it('should delete a document', async () => {
    await expect(firestoreService.deleteDocument('test-collection/test-doc')).resolves.toBeUndefined();
  });
  
  it('should query documents', async () => {
    const docs = await firestoreService.query('test-collection');
    
    expect(docs).toEqual([
      { id: 'doc1', name: 'Document 1', value: 1 },
      { id: 'doc2', name: 'Document 2', value: 2 }
    ]);
  });
});
