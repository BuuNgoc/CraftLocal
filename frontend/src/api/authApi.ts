import axiosClient from './axiosClient';
import type { LoginPayload, RegisterPayload } from '../types/user.type';

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
  avatar?: string;
  defaultAddress?: {
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
  };
}

const authApi = {
  login: (data: LoginPayload) => axiosClient.post('/auth/login', data),
  register: (data: RegisterPayload) => axiosClient.post('/auth/register', data),
  googleLogin: (credential: string) => axiosClient.post('/auth/google', { credential }),
  getProfile: () => axiosClient.get('/auth/profile'),
  updateProfile: (data: UpdateProfilePayload) =>
    axiosClient.put('/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    axiosClient.put('/auth/change-password', data),
};

export default authApi;
