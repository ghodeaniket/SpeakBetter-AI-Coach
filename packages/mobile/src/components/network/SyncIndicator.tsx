import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useSync } from '../../hooks/useSync';
import { SyncStatus } from '../../services/sync/syncService';
import { MaterialIcons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

interface SyncIndicatorProps {
  showDetailsButton?: boolean;
  onDetailsPress?: () => void;
}

const SyncIndicator: React.FC<SyncIndicatorProps> = ({ 
  showDetailsButton = false,
  onDetailsPress
}) => {
  const { colors } = useTheme();
  const { syncStatus, pendingCount, lastSyncTime, forceSync, isOnline } = useSync();
  
  // Don't show anything if all synced and no button
  if (syncStatus === SyncStatus.COMPLETED && !showDetailsButton) {
    return null;
  }
  
  const getStatusIcon = () => {
    switch (syncStatus) {
      case SyncStatus.SYNCING:
        return <ActivityIndicator size="small" color={colors.primary} />;
      case SyncStatus.PENDING:
        return <MaterialIcons name="sync-problem" size={18} color={colors.warning} />;
      case SyncStatus.FAILED:
        return <MaterialIcons name="error-outline" size={18} color={colors.error} />;
      case SyncStatus.COMPLETED:
      default:
        return <MaterialIcons name="sync" size={18} color={colors.success} />;
    }
  };
  
  const getStatusText = () => {
    switch (syncStatus) {
      case SyncStatus.SYNCING:
        return 'Syncing...';
      case SyncStatus.PENDING:
        return `${pendingCount} pending change${pendingCount !== 1 ? 's' : ''}`;
      case SyncStatus.FAILED:
        return 'Sync failed';
      case SyncStatus.COMPLETED:
      default:
        return lastSyncTime 
          ? `Last sync: ${formatDistanceToNow(lastSyncTime, { addSuffix: true })}`
          : 'All synced';
    }
  };
  
  const getStatusColor = () => {
    switch (syncStatus) {
      case SyncStatus.SYNCING:
        return colors.textSecondary;
      case SyncStatus.PENDING:
        return colors.warning;
      case SyncStatus.FAILED:
        return colors.error;
      case SyncStatus.COMPLETED:
      default:
        return colors.success;
    }
  };
  
  const handleForceSync = () => {
    if (isOnline && syncStatus !== SyncStatus.SYNCING) {
      forceSync();
    }
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.statusContainer}
        onPress={handleForceSync}
        disabled={!isOnline || syncStatus === SyncStatus.SYNCING}
      >
        {getStatusIcon()}
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </TouchableOpacity>
      
      {showDetailsButton && (
        <TouchableOpacity
          style={[styles.detailsButton, { borderColor: colors.border }]}
          onPress={onDetailsPress}
        >
          <Text style={[styles.detailsText, { color: colors.primary }]}>
            Details
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 12,
  },
  detailsButton: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  detailsText: {
    fontSize: 12,
  },
});

export default SyncIndicator;
