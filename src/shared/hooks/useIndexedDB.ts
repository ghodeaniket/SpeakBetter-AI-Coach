import { useState, useEffect, useCallback } from 'react';

/**
 * Database configuration options
 */
interface DBConfig {
  name: string;
  version: number;
  stores: {
    [storeName: string]: {
      keyPath: string;
      indexes?: { name: string; keyPath: string; options?: IDBIndexParameters }[];
    };
  };
}

/**
 * Hook return type
 */
interface UseIndexedDBResult<T> {
  db: IDBDatabase | null;
  isLoading: boolean;
  error: Error | null;
  add: (storeName: string, data: T) => Promise<IDBValidKey>;
  getAll: (storeName: string) => Promise<T[]>;
  getById: (storeName: string, id: IDBValidKey) => Promise<T | undefined>;
  update: (storeName: string, data: T) => Promise<IDBValidKey>;
  remove: (storeName: string, id: IDBValidKey) => Promise<void>;
  clear: (storeName: string) => Promise<void>;
}

/**
 * A hook for interacting with IndexedDB
 * @param config Configuration for the database
 * @returns Methods for interacting with IndexedDB
 */
export const useIndexedDB = <T>(config: DBConfig): UseIndexedDBResult<T> => {
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize the database connection
  useEffect(() => {
    let isMounted = true;
    const request = indexedDB.open(config.name, config.version);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      Object.entries(config.stores).forEach(([storeName, storeConfig]) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: storeConfig.keyPath });
          
          // Create indexes if specified
          if (storeConfig.indexes) {
            storeConfig.indexes.forEach(index => {
              store.createIndex(index.name, index.keyPath, index.options);
            });
          }
        }
      });
    };

    request.onsuccess = (event) => {
      if (!isMounted) return;
      const result = (event.target as IDBOpenDBRequest).result;
      setDb(result);
      setIsLoading(false);
    };

    request.onerror = (event) => {
      if (!isMounted) return;
      setError(new Error('Failed to open IndexedDB'));
      setIsLoading(false);
      console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
    };

    return () => {
      isMounted = false;
      if (db) {
        db.close();
      }
    };
  }, [config]);

  /**
   * Adds an item to the specified store
   */
  const add = useCallback(async (storeName: string, data: T): Promise<IDBValidKey> => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Database not initialized'));
        return;
      }

      try {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }, [db]);

  /**
   * Gets all items from the specified store
   */
  const getAll = useCallback(async (storeName: string): Promise<T[]> => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Database not initialized'));
        return;
      }

      try {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }, [db]);

  /**
   * Gets an item by ID from the specified store
   */
  const getById = useCallback(async (storeName: string, id: IDBValidKey): Promise<T | undefined> => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Database not initialized'));
        return;
      }

      try {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }, [db]);

  /**
   * Updates an item in the specified store
   */
  const update = useCallback(async (storeName: string, data: T): Promise<IDBValidKey> => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Database not initialized'));
        return;
      }

      try {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }, [db]);

  /**
   * Removes an item from the specified store
   */
  const remove = useCallback(async (storeName: string, id: IDBValidKey): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Database not initialized'));
        return;
      }

      try {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }, [db]);

  /**
   * Clears all items from the specified store
   */
  const clear = useCallback(async (storeName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!db) {
        reject(new Error('Database not initialized'));
        return;
      }

      try {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }, [db]);

  return {
    db,
    isLoading,
    error,
    add,
    getAll,
    getById,
    update,
    remove,
    clear
  };
};

export default useIndexedDB;
