import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosHeaders } from 'axios';
import { API_BASE_URL } from '../constants/Config.js';
import { AuthResponse, Location, LocationType, User } from '../types';
import { useNetwork } from '../context/NetworkContext';
import { offlineService } from './offlineService';
import NetInfo from '@react-native-community/netinfo';

// Check if API is configured
const isApiConfigured = API_BASE_URL && typeof API_BASE_URL === 'string' && API_BASE_URL.trim() !== '';

// Create axios instance with base URL only if API is configured
const api = isApiConfigured ? axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
}) : null;

console.log('[API] Configuration check:', {
  API_BASE_URL,
  isApiConfigured,
  apiInstance: api ? 'created' : 'not created'
});

// Add request interceptor to include token in headers
if (api) {
  api.interceptors.request.use(
    async (config) => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          if (!config.headers) {
            config.headers = new AxiosHeaders();
          }
          config.headers.set('Authorization', `Bearer ${token}`);
        }
      } catch (error) {
        console.error('[API] Error adding token to request:', error);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor to handle token expiration
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid, clear it
        try {
          await AsyncStorage.removeItem('token');
          console.log('[API] Token cleared due to 401 error');
        } catch (clearError) {
          console.error('[API] Error clearing token:', clearError);
        }
      }
      return Promise.reject(error);
    }
  );
}

// Auth service
export const authService = {
  getToken: async () => {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('[Auth] Error getting token:', error);
      return null;
    }
  },

  login: async (username: string, password: string): Promise<AuthResponse> => {
    if (!isApiConfigured || !api) {
      // Offline mode - create mock user
      const mockUser: User = {
        id: 'offline_user',
        name: username,
        username: username,
        role: 'FEDERATION_OFFICER',
        isAdmin: true,
      };
      const mockToken = `offline_token_${Date.now()}`;
      await AsyncStorage.setItem('token', mockToken);
      console.log('[Auth] Offline login successful');
      return { token: mockToken, user: mockUser };
    }

    try {
      console.log('[Auth] Attempting login with API:', API_BASE_URL);
      const response = await api.post('/auth/login', {
        username,
        password,
      });
      const { token, user } = response.data;
      await AsyncStorage.setItem('token', token);
      console.log('[Auth] Login successful with real API');
      return { token, user };
    } catch (error) {
      console.error('[Auth] Login error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('token');
      console.log('[Auth] Logout successful');
    } catch (error) {
      console.error('[Auth] Error during logout:', error);
    }
  },

  getMe: async (): Promise<User> => {
    if (!isApiConfigured || !api) {
      // Offline mode - return mock user
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const mockUser: User = {
        id: 'offline_user',
        name: 'Offline User',
        username: 'offline',
        role: 'FEDERATION_OFFICER',
        isAdmin: true,
      };
      return mockUser;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      console.log('[Auth] Getting user data from API');
      const response = await api.get('/auth/me');
      if (!response.data) {
        throw new Error('Invalid user data');
      }
      console.log('[Auth] User data retrieved successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('[Auth] Error getting user data:', error);
      throw error;
    }
  },
};

// Location service
export const locationService = {
  getLocations: async (type?: LocationType, city?: string): Promise<Location[]> => {
    try {
      // Check internet connection first
      const netInfo = await NetInfo.fetch();
      console.log('[Location] Network status:', { isConnected: netInfo.isConnected, isApiConfigured, hasApi: !!api });

      if (!netInfo.isConnected || !isApiConfigured || !api) {
        // Offline mode - return local locations
        console.log('[Location] Offline mode - returning local locations');
        const localLocations = await offlineService.getLocalLocations();
        console.log('[Location] Local locations found:', localLocations.length);
        console.log('[Location] Local locations:', localLocations);
        return localLocations;
      }

      console.log('[Location] Fetching locations from API');
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (city) params.append('city', city);
      const response = await api.get(`/locations/${params.toString() ? `?${params.toString()}` : ''}`);
      console.log('[Location] Locations fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('[Location] Error fetching locations:', error);
      // Return local locations as fallback
      console.log('[Location] Falling back to local locations due to error');
      try {
        const localLocations = await offlineService.getLocalLocations();
        console.log('[Location] Local locations as fallback:', localLocations.length);
        return localLocations;
      } catch (localError) {
        console.error('[Location] Error getting local locations:', localError);
        return [];
      }
    }
  },

  createLocation: async (location: Omit<Location, 'id'>) => {
    try {
      const netInfo = await NetInfo.fetch();

      if (!netInfo.isConnected || !isApiConfigured || !api) {
        console.log('[Location] Offline mode - saving locally');
        const newLocation = { ...location, id: `local_${Date.now()}` };
        await offlineService.addToQueue({
          type: 'CREATE_LOCATION',
          data: location,
        });
        await offlineService.saveLocalLocation(newLocation);
        return newLocation;
      }

      console.log('[Location] Creating location via API');
      const response = await api.post('/locations/', location);
      console.log('[Location] Location created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('[Location] Error creating location:', error);

      // If online creation fails, save locally
      try {
        const newLocation = { ...location, id: `local_${Date.now()}` };
        await offlineService.addToQueue({
          type: 'CREATE_LOCATION',
          data: location,
        });
        await offlineService.saveLocalLocation(newLocation);
        console.log('[Location] Saved locally due to API error');
        return newLocation;
      } catch (localError) {
        console.error('[Location] Error saving locally:', localError);
        throw error;
      }
    }
  },

  updateLocation: async (id: string, location: Partial<Location>) => {
    try {
      const netInfo = await NetInfo.fetch();

      if (!netInfo.isConnected || !isApiConfigured || !api) {
        console.log('[Location] Offline mode - queuing update');
        await offlineService.addToQueue({
          type: 'UPDATE_LOCATION',
          data: { id, ...location },
        });
        await offlineService.updateLocalLocation(id, location);
        return { id, ...location };
      }

      console.log('[Location] Updating location via API');
      const response = await api.put(`/locations/${id}`, location);
      console.log('[Location] Location updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('[Location] Error updating location:', error);
      throw error;
    }
  },

  deleteLocation: async (id: string) => {
    try {
      const netInfo = await NetInfo.fetch();

      if (!netInfo.isConnected || !isApiConfigured || !api) {
        console.log('[Location] Offline mode - queuing delete');
        await offlineService.addToQueue({
          type: 'DELETE_LOCATION',
          data: { id },
        });
        await offlineService.deleteLocalLocation(id);
        return { id };
      }

      console.log('[Location] Deleting location via API');
      await api.delete(`/locations/${id}`);
      console.log('[Location] Location deleted successfully');
      return { id };
    } catch (error) {
      console.error('[Location] Error deleting location:', error);
      throw error;
    }
  },
};

// User service
export const userService = {
  getUsers: async (): Promise<User[]> => {
    if (!isApiConfigured || !api) {
      // Offline mode - return empty array
      return [];
    }

    try {
      const response = await api.get('/users/');
      return response.data.users;
    } catch (error) {
      console.error('[User] Error fetching users:', error);
      return [];
    }
  },

  createUser: async (userData: { name: string; username: string; password: string; role: string }): Promise<User> => {
    if (!isApiConfigured || !api) {
      throw new Error('User creation not supported in offline mode');
    }

    try {
      const response = await api.post('/users/', userData);
      return response.data.user;
    } catch (error) {
      console.error('[User] Error creating user:', error);
      throw error;
    }
  },

  updateUser: async (userId: string, userData: Partial<{ name: string; username: string; password: string; role: string }>): Promise<User> => {
    if (!isApiConfigured || !api) {
      throw new Error('User update not supported in offline mode');
    }

    try {
      const response = await api.put(`/users/${userId}`, userData);
      return response.data.user;
    } catch (error) {
      console.error('[User] Error updating user:', error);
      throw error;
    }
  },

  deleteUser: async (userId: string): Promise<{ success: boolean; message: string }> => {
    if (!isApiConfigured || !api) {
      throw new Error('User deletion not supported in offline mode');
    }

    try {
      const response = await api.delete(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('[User] Error deleting user:', error);
      throw error;
    }
  },

  getUser: async (userId: string): Promise<User> => {
    if (!isApiConfigured || !api) {
      throw new Error('User fetching not supported in offline mode');
    }

    try {
      const response = await api.get(`/users/${userId}`);
      return response.data.user;
    } catch (error) {
      console.error('[User] Error fetching user:', error);
      throw error;
    }
  },
};
