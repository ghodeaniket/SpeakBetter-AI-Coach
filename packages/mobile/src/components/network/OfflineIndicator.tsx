import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useNetwork } from '../../hooks/useNetwork';
import { MaterialIcons } from '@expo/vector-icons';

interface OfflineIndicatorProps {
  showReconnectButton?: boolean;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ 
  showReconnectButton = true 
}) => {
  const { colors } = useTheme();
  const { isConnected, checkConnectivity } = useNetwork();
  
  const [isChecking, setIsChecking] = useState(false);
  const [animation] = useState(new Animated.Value(isConnected ? -50 : 0));
  
  useEffect(() => {
    Animated.timing(animation, {
      toValue: isConnected ? -50 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isConnected]);
  
  const handleReconnect = async () => {
    setIsChecking(true);
    await checkConnectivity();
    setIsChecking(false);
  };
  
  if (isConnected) {
    return null;
  }
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.error,
          transform: [{ translateY: animation }],
        },
      ]}
    >
      <View style={styles.content}>
        <MaterialIcons name="wifi-off" size={20} color="#fff" />
        <Text style={styles.text}>You're offline</Text>
        
        {showReconnectButton && (
          <TouchableOpacity 
            style={styles.reconnectButton} 
            onPress={handleReconnect}
            disabled={isChecking}
          >
            {isChecking ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.reconnectText}>Reconnect</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    zIndex: 999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  text: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 8,
  },
  reconnectButton: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  reconnectText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default OfflineIndicator;
