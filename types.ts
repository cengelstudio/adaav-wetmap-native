export type UserRole = 'FEDERATION_OFFICER' | 'STATE_OFFICER' | 'AUTHORIZED_PERSON';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type LocationType = 'WETLAND' | 'STORAGE';

export type Location = {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  type: LocationType;
  city: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};
