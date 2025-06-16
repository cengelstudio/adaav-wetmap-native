export type UserRole = 'FEDERATION_OFFICER' | 'STATE_OFFICER' | 'AUTHORIZED_PERSON';

export type User = {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  isAdmin: boolean;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type LocationType = 'WETLAND' | 'DEPOT' | 'OTHER';

export type Location = {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  type: LocationType;
  city: string;
};
