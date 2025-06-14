export interface User {
  id: string;
  name: string;
  username: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export type LocationType = 'WETLAND' | 'STORAGE';

export interface Location {
  id: string;
  title: string;
  description: string;
  type: LocationType;
  latitude: number;
  longitude: number;
  city: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
