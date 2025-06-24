import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNetwork } from '../context/NetworkContext';
import { offlineService } from '../services/offlineService';
import { Colors } from '../constants/Colors';

export const NetworkStatusIndicator: React.FC = () => {
  const { isConnected, isSyncing } = useNetwork();
  const [offlineCount, setOfflineCount] = useState(0);
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchOfflineCount = async () => {
      try {
        const localLocations = await offlineService.getLocalLocations();
        const queue = await offlineService.getQueue();
        setOfflineCount(localLocations.length + queue.length);
      } catch (error) {
        console.error('Error fetching offline count:', error);
      }
    };

    fetchOfflineCount();

    // Refresh count when network status changes
    const interval = setInterval(fetchOfflineCount, 5000);
    return () => clearInterval(interval);
  }, [isConnected]);

  useEffect(() => {
    if (isSyncing) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [isSyncing, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (isConnected && offlineCount === 0) return null;

  return (
    <View style={styles.container}>
      {!isConnected ? (
        <>
          <MaterialIcons name="wifi-off" size={20} color={Colors.error} />
          <Text style={styles.text}>Çevrimdışı</Text>
        </>
      ) : (
        <>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <MaterialIcons
              name={isSyncing ? "sync" : "wifi"}
              size={20}
              color={isSyncing ? Colors.warning : Colors.success}
            />
          </Animated.View>
          <Text style={styles.text}>
            {isSyncing ? 'Senkronize ediliyor...' : `${offlineCount} bekleyen veri`}
          </Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
});
