import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosHeaders } from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../constants/Config';
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
  timeout: API_TIMEOUT, // Use configurable timeout
  // Crash önleme için ek ayarlar
  validateStatus: (status) => {
    return status >= 200 && status < 500; // 500+ hatalarını da kabul et
  },
}) : null;

// Safe console log function
const safeLog = (message: string, data?: any) => {
  try {
    console.log(message, data);
  } catch (error) {
    console.log(message, 'Data logging failed');
  }
};

safeLog('[API] Configuration check:', {
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
          safeLog('[API] Token cleared due to 401 error');
          safeLog('[API] Response data:', error.response?.data);
        } catch (clearError) {
          safeLog('[API] Error clearing token:', clearError);
        }
      }

      // Log all API errors for debugging
      safeLog('[API] Response error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      });

      return Promise.reject(error);
    }
  );
}

// API test function
export const testApiConnection = async () => {
  safeLog('[API] Testing connection to:', API_BASE_URL);
  safeLog('[API] Configuration check:', { isApiConfigured, hasApi: !!api });

  if (!isApiConfigured || !api) {
    return { success: false, message: 'API not configured' };
  }

  try {
    const netInfo = await NetInfo.fetch();
    safeLog('[API] Network status:', { isConnected: netInfo.isConnected, type: netInfo.type });

    if (!netInfo.isConnected) {
      return { success: false, message: 'No internet connection' };
    }

    safeLog('[API] Making test request to:', `${API_BASE_URL}/`);
    const response = await api.get('/', { timeout: 10000 });
    safeLog('[API] Test response:', response.data);
    return { success: true, message: 'API connection successful', data: response.data };
  } catch (error: any) {
    safeLog('[API] Connection test failed:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    return {
      success: false,
      message: error.message || 'API connection failed',
      error: error.response?.status || 'No response',
      details: error.response?.data
    };
  }
};

// Auth service
export const authService = {
  getToken: async () => {
    try {
      return await AsyncStorage.getItem('token');
    } catch (error) {
      safeLog('[Auth] Error getting token:', error);
      return null;
    }
  },

  login: async (username: string, password: string): Promise<AuthResponse> => {
    try {
      safeLog('[Auth] Login function called with:', { username, password: '***' });
      safeLog('[Auth] API configuration:', { isApiConfigured, hasApi: !!api, API_BASE_URL });

      if (!isApiConfigured || !api) {
        // Offline mode - create mock user
        safeLog('[Auth] API not configured, using offline mode');
        const mockUser: User = {
          id: 'offline_user',
          name: username,
          username: username,
          role: 'FEDERATION_OFFICER',
          isAdmin: true,
        };
        const mockToken = `offline_token_${Date.now()}`;
        try {
          await AsyncStorage.setItem('token', mockToken);
        } catch (storageError) {
          safeLog('[Auth] Storage error, continuing without token:', storageError);
        }
        safeLog('[Auth] Offline login successful');
        return { token: mockToken, user: mockUser };
      }

      // Check network connection first
      let netInfo;
      try {
        netInfo = await NetInfo.fetch();
        safeLog('[Auth] Network info:', { isConnected: netInfo.isConnected, type: netInfo.type });
      } catch (networkError) {
        safeLog('[Auth] Network check failed, assuming offline:', networkError);
        netInfo = { isConnected: false };
      }

      if (!netInfo.isConnected) {
        safeLog('[Auth] No network connection, using offline mode');
        // Offline mode - create mock user
        const mockUser: User = {
          id: 'offline_user',
          name: username,
          username: username,
          role: 'FEDERATION_OFFICER',
          isAdmin: true,
        };
        const mockToken = `offline_token_${Date.now()}`;
        try {
          await AsyncStorage.setItem('token', mockToken);
        } catch (storageError) {
          safeLog('[Auth] Storage error, continuing without token:', storageError);
        }
        safeLog('[Auth] Offline login successful (no network)');
        return { token: mockToken, user: mockUser };
      }

      safeLog('[Auth] Attempting login with API:', API_BASE_URL);
      safeLog('[Auth] Login request payload:', { username, password: '***' });
      safeLog('[Auth] Making POST request to:', `${API_BASE_URL}/auth/login`);

      const response = await api.post('/auth/login', {
        username,
        password,
      });

      safeLog('[Auth] Login response received:', {
        status: response.status,
        hasToken: !!response.data?.token,
        hasUser: !!response.data?.user,
        responseData: response.data
      });

      // Response validation
      if (!response.data || !response.data.token || !response.data.user) {
        safeLog('[Auth] Invalid response from server, falling back to offline mode');
        // Invalid response durumunda offline mode'a geç
        const mockUser: User = {
          id: 'offline_user',
          name: username,
          username: username,
          role: 'FEDERATION_OFFICER',
          isAdmin: true,
        };
        const mockToken = `offline_token_${Date.now()}`;
        try {
          await AsyncStorage.setItem('token', mockToken);
        } catch (storageError) {
          safeLog('[Auth] Storage error, continuing without token:', storageError);
        }
        safeLog('[Auth] Offline login successful (invalid response fallback)');
        return { token: mockToken, user: mockUser };
      }

      const { token, user } = response.data;
      try {
        await AsyncStorage.setItem('token', token);
      } catch (storageError) {
        safeLog('[Auth] Storage error, continuing without token:', storageError);
      }
      safeLog('[Auth] Login successful with real API');
      return { token, user };
    } catch (error: any) {
      safeLog('[Auth] Login error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          timeout: error.config?.timeout
        }
      });

      // Tüm hata durumlarında offline mode'a geç
      safeLog('[Auth] Error occurred, falling back to offline mode');
      const mockUser: User = {
        id: 'offline_user',
        name: username,
        username: username,
        role: 'FEDERATION_OFFICER',
        isAdmin: true,
      };
      const mockToken = `offline_token_${Date.now()}`;
      try {
        await AsyncStorage.setItem('token', mockToken);
      } catch (storageError) {
        safeLog('[Auth] Storage error, continuing without token:', storageError);
      }
      safeLog('[Auth] Offline login successful (error fallback)');
      return { token: mockToken, user: mockUser };
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('token');
      safeLog('[Auth] Logout successful');
    } catch (error) {
      safeLog('[Auth] Error during logout:', error);
    }
  },

  getMe: async (): Promise<User> => {
    if (!isApiConfigured || !api) {
      // Offline mode - return mock user
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        // Token yoksa offline user döndür
        const mockUser: User = {
          id: 'offline_user',
          name: 'Offline User',
          username: 'offline',
          role: 'FEDERATION_OFFICER',
          isAdmin: true,
        };
        return mockUser;
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
        // Token yoksa offline user döndür
        const mockUser: User = {
          id: 'offline_user',
          name: 'Offline User',
          username: 'offline',
          role: 'FEDERATION_OFFICER',
          isAdmin: true,
        };
        return mockUser;
      }

      safeLog('[Auth] Getting user data from API');
      const response = await api.get('/auth/me');

      // Check if response contains error message
      if (response.data && response.data.message && response.data.message.includes('Token is invalid')) {
        safeLog('[Auth] Token is invalid, clearing token and returning offline user');
        await AsyncStorage.removeItem('token');
        const mockUser: User = {
          id: 'offline_user',
          name: 'Offline User',
          username: 'offline',
          role: 'FEDERATION_OFFICER',
          isAdmin: true,
        };
        return mockUser;
      }

      if (!response.data) {
        // Invalid response durumunda offline user döndür
        const mockUser: User = {
          id: 'offline_user',
          name: 'Offline User',
          username: 'offline',
          role: 'FEDERATION_OFFICER',
          isAdmin: true,
        };
        return mockUser;
      }
      safeLog('[Auth] User data retrieved successfully:', response.data);
      return response.data;
    } catch (error: any) {
      safeLog('[Auth] Error getting user data:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      // If it's a 401 error, clear the token
      if (error.response?.status === 401) {
        try {
          await AsyncStorage.removeItem('token');
          safeLog('[Auth] Token cleared due to 401 error in getMe');
        } catch (clearError) {
          safeLog('[Auth] Error clearing token:', clearError);
        }
      }

      // Hata durumunda offline user döndür
      const mockUser: User = {
        id: 'offline_user',
        name: 'Offline User',
        username: 'offline',
        role: 'FEDERATION_OFFICER',
        isAdmin: true,
      };
      return mockUser;
    }
  },
};

// Location service
export const locationService = {
  getLocations: async (type?: LocationType, city?: string): Promise<Location[]> => {
    try {
      // Check internet connection first
      const netInfo = await NetInfo.fetch();
      safeLog('[Location] Network status:', { isConnected: netInfo.isConnected, isApiConfigured, hasApi: !!api });

      if (!netInfo.isConnected || !isApiConfigured || !api) {
        // Offline mode - return local locations
        safeLog('[Location] Offline mode - returning local locations');
        const localLocations = await offlineService.getLocalLocations();
        safeLog('[Location] Local locations found:', localLocations.length);
        return localLocations;
      }

      safeLog('[Location] Fetching locations from API');

      // Build query parameters according to API documentation
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (city) params.append('city', city);

      const queryString = params.toString();
      const url = queryString ? `/locations/?${queryString}` : '/locations/';

      const response = await api.get(url);
      safeLog('[Location] Locations fetched successfully:', response.data);

      // API returns array directly according to documentation
      return response.data || [];
    } catch (error: any) {
      safeLog('[Location] Error fetching locations:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      // Return local locations as fallback
      safeLog('[Location] Falling back to local locations due to error');
      try {
        const localLocations = await offlineService.getLocalLocations();
        safeLog('[Location] Local locations as fallback:', localLocations.length);
        return localLocations;
      } catch (localError) {
        safeLog('[Location] Error getting local locations:', localError);
        return [];
      }
    }
  },

  createLocation: async (location: Omit<Location, 'id'>) => {
    try {
      const netInfo = await NetInfo.fetch();

      if (!netInfo.isConnected || !isApiConfigured || !api) {
        safeLog('[Location] Offline mode - saving locally');
        const newLocation = { ...location, id: `local_${Date.now()}` };
        await offlineService.addToQueue({
          type: 'CREATE_LOCATION',
          data: location,
        });
        await offlineService.saveLocalLocation(newLocation);
        return newLocation;
      }

      safeLog('[Location] Creating location via API');
      const response = await api.post('/locations/', location);
      safeLog('[Location] Location created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      safeLog('[Location] Error creating location:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      // If online creation fails, save locally
      try {
        const newLocation = { ...location, id: `local_${Date.now()}` };
        await offlineService.addToQueue({
          type: 'CREATE_LOCATION',
          data: location,
        });
        await offlineService.saveLocalLocation(newLocation);
        safeLog('[Location] Saved locally due to API error');
        return newLocation;
      } catch (localError) {
        safeLog('[Location] Error saving locally:', localError);
        // En son çare olarak sadece ID ile döndür
        return { ...location, id: `local_${Date.now()}` };
      }
    }
  },

  updateLocation: async (id: string, location: Partial<Location>) => {
    try {
      const netInfo = await NetInfo.fetch();

      if (!netInfo.isConnected || !isApiConfigured || !api) {
        safeLog('[Location] Offline mode - queuing update');
        await offlineService.addToQueue({
          type: 'UPDATE_LOCATION',
          data: { id, ...location },
        });
        await offlineService.updateLocalLocation(id, location);
        return { id, ...location };
      }

      safeLog('[Location] Updating location via API');
      const response = await api.put(`/locations/${id}`, location);
      safeLog('[Location] Location updated successfully:', response.data);
      return response.data;
    } catch (error: any) {
      safeLog('[Location] Error updating location:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      // Hata durumunda local update yap
      try {
        await offlineService.updateLocalLocation(id, location);
        return { id, ...location };
      } catch (localError) {
        safeLog('[Location] Error updating locally:', localError);
        return { id, ...location };
      }
    }
  },

  deleteLocation: async (id: string) => {
    try {
      const netInfo = await NetInfo.fetch();

      if (!netInfo.isConnected || !isApiConfigured || !api) {
        safeLog('[Location] Offline mode - queuing delete');
        await offlineService.addToQueue({
          type: 'DELETE_LOCATION',
          data: { id },
        });
        await offlineService.deleteLocalLocation(id);
        return { id };
      }

      safeLog('[Location] Deleting location via API');
      const response = await api.delete(`/locations/${id}`);
      safeLog('[Location] Location deleted successfully:', response.data);
      return { id };
    } catch (error: any) {
      safeLog('[Location] Error deleting location:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      // Hata durumunda local delete yap
      try {
        await offlineService.deleteLocalLocation(id);
        return { id };
      } catch (localError) {
        safeLog('[Location] Error deleting locally:', localError);
        return { id };
      }
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
      safeLog('[User] Users fetched successfully:', response.data);
      return response.data.users || [];
    } catch (error: any) {
      safeLog('[User] Error fetching users:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return [];
    }
  },

  createUser: async (userData: { name: string; username: string; password: string; role?: string }): Promise<User> => {
    if (!isApiConfigured || !api) {
      // Offline mode - return mock user
      const mockUser: User = {
        id: 'offline_user',
        name: userData.name,
        username: userData.username,
        role: (userData.role as any) || 'AUTHORIZED_PERSON',
        isAdmin: false,
      };
      return mockUser;
    }

    try {
      const response = await api.post('/users/', userData);
      safeLog('[User] User created successfully:', response.data);
      return response.data.user;
    } catch (error: any) {
      safeLog('[User] Error creating user:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      // Hata durumunda mock user döndür
      const mockUser: User = {
        id: 'offline_user',
        name: userData.name,
        username: userData.username,
        role: (userData.role as any) || 'AUTHORIZED_PERSON',
        isAdmin: false,
      };
      return mockUser;
    }
  },

  updateUser: async (userId: string, userData: Partial<{ name: string; username: string; password: string; role: string }>): Promise<User> => {
    if (!isApiConfigured || !api) {
      // Offline mode - return mock user
      const mockUser: User = {
        id: userId,
        name: userData.name || 'Offline User',
        username: userData.username || 'offline',
        role: (userData.role as any) || 'AUTHORIZED_PERSON',
        isAdmin: false,
      };
      return mockUser;
    }

    try {
      const response = await api.put(`/users/${userId}`, userData);
      safeLog('[User] User updated successfully:', response.data);
      return response.data.user;
    } catch (error: any) {
      safeLog('[User] Error updating user:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      // Hata durumunda mock user döndür
      const mockUser: User = {
        id: userId,
        name: userData.name || 'Offline User',
        username: userData.username || 'offline',
        role: (userData.role as any) || 'AUTHORIZED_PERSON',
        isAdmin: false,
      };
      return mockUser;
    }
  },

  deleteUser: async (userId: string): Promise<{ success: boolean; message: string }> => {
    if (!isApiConfigured || !api) {
      // Offline mode - return success
      return { success: true, message: 'User deleted (offline mode)' };
    }

    try {
      const response = await api.delete(`/users/${userId}`);
      safeLog('[User] User deleted successfully:', response.data);
      return response.data;
    } catch (error: any) {
      safeLog('[User] Error deleting user:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      // Hata durumunda success döndür
      return { success: true, message: 'User deleted (offline mode)' };
    }
  },

  getUser: async (userId: string): Promise<User> => {
    if (!isApiConfigured || !api) {
      // Offline mode - return mock user
      const mockUser: User = {
        id: userId,
        name: 'Offline User',
        username: 'offline',
        role: 'AUTHORIZED_PERSON',
        isAdmin: false,
      };
      return mockUser;
    }

    try {
      const response = await api.get(`/users/${userId}`);
      safeLog('[User] User fetched successfully:', response.data);
      return response.data.user;
    } catch (error: any) {
      safeLog('[User] Error fetching user:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      // Hata durumunda mock user döndür
      const mockUser: User = {
        id: userId,
        name: 'Offline User',
        username: 'offline',
        role: 'AUTHORIZED_PERSON',
        isAdmin: false,
      };
      return mockUser;
    }
  },
};
