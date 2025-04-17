import { useState, useEffect } from 'react';
import { syncService, SyncStatus, OperationType } from '../services/sync/syncService';
import { useNetwork } from './useNetwork';

export const useSync = () => {
  const { isConnected } = useNetwork();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.COMPLETED);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  
  useEffect(() => {
    // Initialize the sync service if needed
    syncService.initialize();
    
    // Get initial sync status
    updateSyncStatus();
    
    // Add listener for sync status changes
    const unsubscribe = syncService.addListener(handleSyncStatusChange);
    
    // Set up interval to check pending operations count
    const interval = setInterval(updatePendingCount, 10000);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);
  
  // When connection status changes, try to sync if we're back online
  useEffect(() => {
    if (isConnected) {
      syncService.sync();
    }
  }, [isConnected]);
  
  const handleSyncStatusChange = (status: SyncStatus) => {
    setSyncStatus(status);
    updatePendingCount();
    
    // If sync completed, update the last sync time
    if (status === SyncStatus.COMPLETED) {
      updateLastSyncTime();
    }
  };
  
  const updateSyncStatus = async () => {
    try {
      const status = await syncService.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Error getting sync status:', error);
    }
  };
  
  const updatePendingCount = async () => {
    try {
      const count = await syncService.getPendingOperationsCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Error getting pending operations count:', error);
    }
  };
  
  const updateLastSyncTime = async () => {
    try {
      const timestamp = await syncService.getLastSyncTimestamp();
      setLastSyncTime(timestamp);
    } catch (error) {
      console.error('Error getting last sync time:', error);
    }
  };
  
  const queueCreateOperation = async (resource: string, data: any, priority: number = 1) => {
    try {
      return await syncService.addPendingOperation(
        OperationType.CREATE,
        resource,
        data,
        priority
      );
    } catch (error) {
      console.error('Error queueing create operation:', error);
      throw error;
    }
  };
  
  const queueUpdateOperation = async (resource: string, data: any, priority: number = 1) => {
    try {
      return await syncService.addPendingOperation(
        OperationType.UPDATE,
        resource,
        data,
        priority
      );
    } catch (error) {
      console.error('Error queueing update operation:', error);
      throw error;
    }
  };
  
  const queueDeleteOperation = async (resource: string, data: any, priority: number = 1) => {
    try {
      return await syncService.addPendingOperation(
        OperationType.DELETE,
        resource,
        data,
        priority
      );
    } catch (error) {
      console.error('Error queueing delete operation:', error);
      throw error;
    }
  };
  
  const forceSync = async () => {
    try {
      return await syncService.forceSync();
    } catch (error) {
      console.error('Error forcing sync:', error);
      return false;
    }
  };
  
  return {
    syncStatus,
    pendingCount,
    lastSyncTime,
    isOnline: isConnected,
    isSyncing: syncStatus === SyncStatus.SYNCING,
    hasPendingOperations: pendingCount > 0,
    queueCreateOperation,
    queueUpdateOperation,
    queueDeleteOperation,
    forceSync,
    updateSyncStatus,
  };
};
