import AsyncStorage from '@react-native-async-storage/async-storage';
import { Location } from '../types';

const OFFLINE_QUEUE_KEY = '@offline_queue';
const LOCAL_LOCATIONS_KEY = '@local_locations';

export const offlineService = {
  addToQueue: async (action: { type: string; data: any }) => {
    try {
      const queue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      const actions = queue ? JSON.parse(queue) : [];
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify([...actions, action]));
    } catch (error) {
      console.error('Error adding to offline queue:', error);
    }
  },

  getQueue: async () => {
    try {
      const queue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error getting offline queue:', error);
      return [];
    }
  },

  clearQueue: async () => {
    try {
      await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
    } catch (error) {
      console.error('Error clearing offline queue:', error);
    }
  },

  saveLocalLocation: async (location: Location) => {
    try {
      const localLocations = await AsyncStorage.getItem(LOCAL_LOCATIONS_KEY);
      const locations = localLocations ? JSON.parse(localLocations) : [];
      await AsyncStorage.setItem(LOCAL_LOCATIONS_KEY, JSON.stringify([...locations, location]));
    } catch (error) {
      console.error('Error saving local location:', error);
    }
  },

  updateLocalLocation: async (id: string, location: Partial<Location>) => {
    try {
      const localLocations = await AsyncStorage.getItem(LOCAL_LOCATIONS_KEY);
      if (localLocations) {
        const locations = JSON.parse(localLocations);
        const updatedLocations = locations.map((loc: Location) =>
          loc.id === id ? { ...loc, ...location } : loc
        );
        await AsyncStorage.setItem(LOCAL_LOCATIONS_KEY, JSON.stringify(updatedLocations));
      }
    } catch (error) {
      console.error('Error updating local location:', error);
    }
  },

  deleteLocalLocation: async (id: string) => {
    try {
      const localLocations = await AsyncStorage.getItem(LOCAL_LOCATIONS_KEY);
      if (localLocations) {
        const locations = JSON.parse(localLocations);
        const updatedLocations = locations.filter((loc: Location) => loc.id !== id);
        await AsyncStorage.setItem(LOCAL_LOCATIONS_KEY, JSON.stringify(updatedLocations));
      }
    } catch (error) {
      console.error('Error deleting local location:', error);
    }
  },

  getLocalLocations: async (): Promise<Location[]> => {
    try {
      const localLocations = await AsyncStorage.getItem(LOCAL_LOCATIONS_KEY);
      return localLocations ? JSON.parse(localLocations) : [];
    } catch (error) {
      console.error('Error getting local locations:', error);
      return [];
    }
  },

  clearLocalLocations: async () => {
    try {
      await AsyncStorage.removeItem(LOCAL_LOCATIONS_KEY);
    } catch (error) {
      console.error('Error clearing local locations:', error);
    }
  },

  removeLocalLocation: async (id: string) => {
    try {
      const localLocations = await AsyncStorage.getItem(LOCAL_LOCATIONS_KEY);
      if (localLocations) {
        const locations = JSON.parse(localLocations);
        const updatedLocations = locations.filter((loc: Location) => loc.id !== id);
        await AsyncStorage.setItem(LOCAL_LOCATIONS_KEY, JSON.stringify(updatedLocations));
      }
    } catch (error) {
      console.error('Error removing local location:', error);
    }
  },

  processQueueAndCleanup: async (successfulActions: string[]) => {
    try {
      for (const actionId of successfulActions) {
        await offlineService.removeLocalLocation(actionId);
      }
    } catch (error) {
      console.error('Error processing queue cleanup:', error);
    }
  },

  // Test verileri ekleme fonksiyonu
  addTestLocations: async () => {
    try {
      const testLocations: Location[] = [
        {
          id: 'local_test_1',
          title: 'Test Sulak Alan 1',
          description: 'Bu bir test sulak alanıdır',
          latitude: 35.1856,
          longitude: 33.3823,
          type: 'WETLAND',
          city: 'KKTC'
        },
        {
          id: 'local_test_2',
          title: 'Test Depo 1',
          description: 'Bu bir test deposudur',
          latitude: 35.1956,
          longitude: 33.3923,
          type: 'DEPOT',
          city: 'KKTC'
        },
        {
          id: 'local_test_3',
          title: 'Test Sulak Alan 2',
          description: 'İkinci test sulak alanı',
          latitude: 35.1756,
          longitude: 33.3723,
          type: 'WETLAND',
          city: 'KKTC'
        }
      ];

      await AsyncStorage.setItem(LOCAL_LOCATIONS_KEY, JSON.stringify(testLocations));
      console.log('[OfflineService] Test locations added successfully');
      return testLocations;
    } catch (error) {
      console.error('[OfflineService] Error adding test locations:', error);
      return [];
    }
  },

  // Local storage durumunu kontrol etme
  checkStorageStatus: async () => {
    try {
      const localLocations = await AsyncStorage.getItem(LOCAL_LOCATIONS_KEY);
      const queue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);

      console.log('[OfflineService] Storage status:', {
        localLocations: localLocations ? JSON.parse(localLocations).length : 0,
        queue: queue ? JSON.parse(queue).length : 0,
        hasLocalData: !!localLocations,
        hasQueueData: !!queue
      });

      return {
        localCount: localLocations ? JSON.parse(localLocations).length : 0,
        queueCount: queue ? JSON.parse(queue).length : 0
      };
    } catch (error) {
      console.error('[OfflineService] Error checking storage status:', error);
      return { localCount: 0, queueCount: 0 };
    }
  },
};
