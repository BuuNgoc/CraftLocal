export type UserRole = 'ADMIN' | 'HOST' | 'TOUR_GUIDE' | 'TOURIST';
export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'PENDING';

export interface UserAddress {
  fullName?: string;
  phone?: string;
  addressLine?: string;
  ward?: string;
  district?: string;
  city?: string;
  province?: string;
  country?: string;
  fullAddress?: string;
  note?: string;
}

export interface User {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  authProvider?: 'LOCAL' | 'GOOGLE';
  googleId?: string;
  hostId?: string;
  createdBy?: string;
  defaultAddress?: UserAddress;
  hostProfile?: {
    workshopName?: string;
    ownerName?: string;
    ownerPhone?: string;
    description?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountHolder?: string;
    approvedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword?: string;
  role: 'TOURIST' | 'HOST';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}
