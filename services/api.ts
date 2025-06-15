import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Location, LocationType } from '../types';

const isDevelopment = process.env.NODE_ENV === 'development';
const API_URL = isDevelopment ? 'http://localhost:3000' : 'YOUR_PRODUCTION_API_URL';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const LOCATIONS_STORAGE_KEY = '@locations';
const AUTH_TOKEN_KEY = '@auth_token';

// Initial mock data for development
const initialLocations: Location[] = [
  {
    id: '1',
    title: 'Sulak Alan 1',
    description: 'Test sulak alan açıklaması',
    latitude: 35.1856,
    longitude: 33.3823,
    type: 'WETLAND',
    city: 'Lefkoşa',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'test-user',
  },
  {
    id: '2',
    title: 'Depo 1',
    description: 'Test depo açıklaması',
    latitude: 35.3364,
    longitude: 33.3350,
    type: 'STORAGE',
    city: 'Girne',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'test-user',
  },
];

class LocationService {
  private locations: Location[] = [];
  private lastId: string = '0';

  constructor() {
    this.loadFromStorage();
  }

  private async loadFromStorage() {
    try {
      const storedLocations = await AsyncStorage.getItem(LOCATIONS_STORAGE_KEY);
      if (storedLocations) {
        this.locations = JSON.parse(storedLocations);
        const maxId = Math.max(...this.locations.map(loc => parseInt(loc.id, 10)));
        this.lastId = isFinite(maxId) ? maxId.toString() : '0';
      } else {
        this.locations = initialLocations;
        this.lastId = '2';
      }
    } catch (error) {
      console.error('Error loading locations from storage:', error);
      this.locations = initialLocations;
      this.lastId = '2';
    }
  }

  private async saveToStorage() {
    try {
      await AsyncStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(this.locations));
    } catch (error) {
      console.error('Error saving locations to storage:', error);
    }
  }

  async getLocations(): Promise<Location[]> {
    return this.locations;
  }

  async getLocationsByType(type: LocationType): Promise<Location[]> {
    return this.locations.filter(location => location.type === type);
  }

  async getLocationsByCity(city: string): Promise<Location[]> {
    return this.locations.filter(location => location.city.toLowerCase() === city.toLowerCase());
  }

  async createLocation(data: Omit<Location, 'id'>): Promise<Location> {
    const newId = (parseInt(this.lastId) + 1).toString();
    const newLocation: Location = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.locations.push(newLocation);
    this.lastId = newId;
    await this.saveToStorage();
    return newLocation;
  }

  async updateLocation(id: string, data: Partial<Omit<Location, 'id'>>): Promise<Location> {
    const index = this.locations.findIndex(loc => loc.id === id);
    if (index === -1) {
      throw new Error('Location not found');
    }

    this.locations[index] = {
      ...this.locations[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await this.saveToStorage();
    return this.locations[index];
  }

  async deleteLocation(id: string): Promise<void> {
    const index = this.locations.findIndex(loc => loc.id === id);
    if (index === -1) {
      throw new Error('Location not found');
    }

    this.locations.splice(index, 1);
    await this.saveToStorage();
  }
}

class AuthService {
  private async saveToken(token: string) {
    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving auth token:', error);
    }
  }

  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async removeToken() {
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error removing auth token:', error);
    }
  }

  async login(username: string, password: string): Promise<string> {
    if (username === 'testuser' && password === 'test123') {
      const token = 'test-token-' + Date.now();
      await this.saveToken(token);
      return token;
    }
    throw new Error('Invalid credentials');
  }

  async logout(): Promise<void> {
    await this.removeToken();
  }
}

export const locationService = new LocationService();
export const authService = new AuthService();
