import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosHeaders } from 'axios';
import { API_BASE_URL } from '../constants/config';
import { AuthResponse, Location, LocationType, User } from '../types';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token in headers
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
      await AsyncStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

// Auth service
export const authService = {
  getToken: async () => {
    return await AsyncStorage.getItem('token');
  },

  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', {
      username,
      password,
    });
    const { token, user } = response.data;
    await AsyncStorage.setItem('token', token);
    return { token, user };
  },

  logout: async () => {
    await AsyncStorage.removeItem('token');
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Location service
export const locationService = {
  getLocations: async (type?: LocationType, city?: string): Promise<Location[]> => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (city) params.append('city', city);
    const response = await api.get(`/locations/${params.toString() ? `?${params.toString()}` : ''}`);
    return response.data;
  },

  createLocation: async (location: Omit<Location, 'id'>): Promise<Location> => {
    const response = await api.post('/locations/', location);
    return response.data;
  },

  updateLocation: async (id: string, location: Partial<Location>): Promise<Location> => {
    const response = await api.put(`/locations/${id}`, location);
    return response.data;
  },

  deleteLocation: async (id: string): Promise<void> => {
    await api.delete(`/locations/${id}`);
  },
};

// User service
export const userService = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/users/');
    return response.data.users;
  },

  createUser: async (userData: { name: string; username: string; password: string; role: string }): Promise<User> => {
    const response = await api.post('/users/', userData);
    return response.data.user;
  },

  updateUser: async (userId: string, userData: Partial<{ name: string; username: string; password: string; role: string }>): Promise<User> => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data.user;
  },

  deleteUser: async (userId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  getUser: async (userId: string): Promise<User> => {
    const response = await api.get(`/users/${userId}`);
    return response.data.user;
  },
};
