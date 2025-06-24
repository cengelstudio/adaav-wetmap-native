import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import { offlineService } from '../services/offlineService';
import { locationService } from '../services/api';

const BACKGROUND_SYNC_TASK = 'BACKGROUND_SYNC_TASK';

interface NetworkContextType {
  isConnected: boolean;
  syncOfflineData: () => Promise<void>;
  isSyncing: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

// Define the background task
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    const queue = await offlineService.getQueue();
    if (queue.length > 0) {
      for (const action of queue) {
        try {
          switch (action.type) {
            case 'CREATE_LOCATION':
              await locationService.createLocation(action.data);
              break;
            case 'UPDATE_LOCATION':
              await locationService.updateLocation(action.data.id, action.data);
              break;
            case 'DELETE_LOCATION':
              await locationService.deleteLocation(action.data.id);
              break;
          }
        } catch (error) {
          console.error(`Background task error processing action ${action.type}:`, error);
        }
      }
      await offlineService.clearQueue();
    }
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error('Background sync error:', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? true);
      if (state.isConnected) {
        syncOfflineData();
      }
    });

    // Register background task with error handling
    registerBackgroundTask();

    // Setup notification handler
    setupNotifications();

    return () => {
      unsubscribe();
      // Unregister background task with error handling
      unregisterBackgroundTask();
    };
  }, []);

  const registerBackgroundTask = async () => {
    try {
      await BackgroundTask.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: 15 * 60, // 15 minutes
      });
      console.log('[Network] Background task registered successfully');
    } catch (error) {
      console.warn('[Network] Background task registration failed (this is normal in Expo Go):', error);
    }
  };

  const unregisterBackgroundTask = async () => {
    try {
      await TaskManager.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
      console.log('[Network] Background task unregistered successfully');
    } catch (error) {
      console.warn('[Network] Background task unregistration failed:', error);
    }
  };

  const setupNotifications = async () => {
    try {
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      console.log('[Network] Notification handler setup successfully');
    } catch (error) {
      console.warn('[Network] Notification setup failed (this is normal in Expo Go):', error);
    }
  };

  const syncOfflineData = async () => {
    if (isSyncing) return; // Prevent multiple simultaneous syncs

    // Check internet connection first
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.log('[Network] No internet connection, cannot sync');
      return;
    }

    try {
      setIsSyncing(true);
      const queue = await offlineService.getQueue();
      const localLocations = await offlineService.getLocalLocations();

      if (queue.length > 0 || localLocations.length > 0) {
        // Show notification that sync is in progress
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Veri Senkronizasyonu',
              body: 'Çevrimdışı veriler senkronize ediliyor...',
            },
            trigger: null,
          });
        } catch (notificationError) {
          console.warn('[Network] Notification failed:', notificationError);
        }

        const successfulActions: string[] = [];

        // Process offline queue
        for (const action of queue) {
          try {
            switch (action.type) {
              case 'CREATE_LOCATION':
                await locationService.createLocation(action.data);
                successfulActions.push(action.data.id);
                break;
              case 'UPDATE_LOCATION':
                await locationService.updateLocation(action.data.id, action.data);
                break;
              case 'DELETE_LOCATION':
                await locationService.deleteLocation(action.data.id);
                break;
            }
          } catch (error) {
            console.error(`Error processing action ${action.type}:`, error);
          }
        }

        // Process local locations (create them on server)
        for (const location of localLocations) {
          try {
            await locationService.createLocation(location);
            successfulActions.push(location.id);
          } catch (error) {
            console.error(`Error syncing local location ${location.id}:`, error);
          }
        }

        // Clean up successful actions
        await offlineService.processQueueAndCleanup(successfulActions);
        await offlineService.clearQueue();

        // Show notification that sync is complete
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Veri Senkronizasyonu',
              body: 'Çevrimdışı veriler başarıyla senkronize edildi.',
            },
            trigger: null,
          });
        } catch (notificationError) {
          console.warn('[Network] Success notification failed:', notificationError);
        }
      }
    } catch (error) {
      console.error('Error syncing offline data:', error);
      // Show error notification
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Veri Senkronizasyonu Hatası',
            body: 'Veriler senkronize edilirken bir hata oluştu.',
          },
          trigger: null,
        });
      } catch (notificationError) {
        console.warn('[Network] Error notification failed:', notificationError);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <NetworkContext.Provider
      value={{
        isConnected,
        syncOfflineData,
        isSyncing,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};
