import { IndexedDBStorage } from '../indexedDB';

// Mock IndexedDB API
const mockStore = {
  put: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  count: jest.fn()
};

const mockTransaction = {
  objectStore: jest.fn().mockReturnValue(mockStore)
};

const mockDB = {
  transaction: jest.fn().mockReturnValue(mockTransaction),
  objectStoreNames: {
    contains: jest.fn().mockReturnValue(true)
  },
  createObjectStore: jest.fn()
};

const mockOpenRequest = {
  result: mockDB,
  error: null,
  onerror: null as any,
  onsuccess: null as any,
  onupgradeneeded: null as any
};

// Mock indexedDB global
const indexedDB = {
  open: jest.fn().mockReturnValue(mockOpenRequest)
};

// Add indexedDB to global
(global as any).indexedDB = indexedDB;

// Helper function to simulate request success
function simulateRequestSuccess(request: any, result: any) {
  request.result = result;
  request.onsuccess && request.onsuccess(new Event('success'));
  return result;
}

// Helper function to simulate request error
function simulateRequestError(request: any, error: any) {
  request.error = error;
  request.onerror && request.onerror(new Event('error'));
  throw error;
}

describe('IndexedDBStorage', () => {
  const config = {
    dbName: 'test-db',
    dbVersion: 1,
    storeName: 'test-store'
  };
  
  let storage: IndexedDBStorage;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mockOpenRequest handlers
    mockOpenRequest.onerror = null;
    mockOpenRequest.onsuccess = null;
    mockOpenRequest.onupgradeneeded = null;
    
    // Create a new storage instance
    storage = new IndexedDBStorage(config);
    
    // Simulate database open success
    setTimeout(() => {
      if (mockOpenRequest.onsuccess) {
        mockOpenRequest.onsuccess(new Event('success'));
      }
    }, 0);
  });
  
  describe('setItem', () => {
    it('should store an item in IndexedDB', async () => {
      // Arrange
      const key = 'test-key';
      const data = { name: 'Test Data' };
      const putRequest = { onsuccess: null as any, onerror: null as any, error: null };
      
      mockStore.put.mockReturnValueOnce(putRequest);
      
      // Act
      const setPromise = storage.setItem(key, data);
      
      // Simulate request success
      setTimeout(() => {
        simulateRequestSuccess(putRequest, undefined);
      }, 0);
      
      await setPromise;
      
      // Assert
      expect(mockDB.transaction).toHaveBeenCalledWith(config.storeName, 'readwrite');
      expect(mockTransaction.objectStore).toHaveBeenCalledWith(config.storeName);
      expect(mockStore.put).toHaveBeenCalledWith(expect.objectContaining({
        key,
        data,
        storedAt: expect.any(Number)
      }));
    });
    
    it('should handle errors when storing an item', async () => {
      // Arrange
      const key = 'test-key';
      const data = { name: 'Test Data' };
      const error = new Error('Test error');
      const putRequest = { onsuccess: null as any, onerror: null as any, error };
      
      mockStore.put.mockReturnValueOnce(putRequest);
      
      // Act & Assert
      const setPromise = storage.setItem(key, data);
      
      // Simulate request error
      setTimeout(() => {
        try {
          simulateRequestError(putRequest, error);
        } catch (e) {
          // Ignore error here, we're testing it in the promise
        }
      }, 0);
      
      await expect(setPromise).rejects.toMatchObject({
        code: 'storage/set-item-failed',
        message: expect.stringContaining('Failed to set item in IndexedDB')
      });
    });
  });
  
  describe('getItem', () => {
    it('should retrieve an item from IndexedDB', async () => {
      // Arrange
      const key = 'test-key';
      const data = { name: 'Test Data' };
      const storedItem = { key, data, storedAt: Date.now() };
      const getRequest = { onsuccess: null as any, onerror: null as any, error: null, result: storedItem };
      
      mockStore.get.mockReturnValueOnce(getRequest);
      
      // Act
      const getPromise = storage.getItem(key);
      
      // Simulate request success
      setTimeout(() => {
        simulateRequestSuccess(getRequest, storedItem);
      }, 0);
      
      const result = await getPromise;
      
      // Assert
      expect(mockDB.transaction).toHaveBeenCalledWith(config.storeName, 'readonly');
      expect(mockTransaction.objectStore).toHaveBeenCalledWith(config.storeName);
      expect(mockStore.get).toHaveBeenCalledWith(key);
      expect(result).toEqual(data);
    });
    
    it('should return null if item does not exist', async () => {
      // Arrange
      const key = 'non-existent-key';
      const getRequest = { onsuccess: null as any, onerror: null as any, error: null, result: undefined };
      
      mockStore.get.mockReturnValueOnce(getRequest);
      
      // Act
      const getPromise = storage.getItem(key);
      
      // Simulate request success with no result
      setTimeout(() => {
        simulateRequestSuccess(getRequest, undefined);
      }, 0);
      
      const result = await getPromise;
      
      // Assert
      expect(result).toBeNull();
    });
  });
  
  describe('removeItem', () => {
    it('should remove an item from IndexedDB', async () => {
      // Arrange
      const key = 'test-key';
      const deleteRequest = { onsuccess: null as any, onerror: null as any, error: null };
      
      mockStore.delete.mockReturnValueOnce(deleteRequest);
      
      // Act
      const removePromise = storage.removeItem(key);
      
      // Simulate request success
      setTimeout(() => {
        simulateRequestSuccess(deleteRequest, undefined);
      }, 0);
      
      await removePromise;
      
      // Assert
      expect(mockDB.transaction).toHaveBeenCalledWith(config.storeName, 'readwrite');
      expect(mockTransaction.objectStore).toHaveBeenCalledWith(config.storeName);
      expect(mockStore.delete).toHaveBeenCalledWith(key);
    });
  });
  
  describe('clear', () => {
    it('should clear all items from IndexedDB', async () => {
      // Arrange
      const clearRequest = { onsuccess: null as any, onerror: null as any, error: null };
      
      mockStore.clear.mockReturnValueOnce(clearRequest);
      
      // Act
      const clearPromise = storage.clear();
      
      // Simulate request success
      setTimeout(() => {
        simulateRequestSuccess(clearRequest, undefined);
      }, 0);
      
      await clearPromise;
      
      // Assert
      expect(mockDB.transaction).toHaveBeenCalledWith(config.storeName, 'readwrite');
      expect(mockTransaction.objectStore).toHaveBeenCalledWith(config.storeName);
      expect(mockStore.clear).toHaveBeenCalled();
    });
  });
});
