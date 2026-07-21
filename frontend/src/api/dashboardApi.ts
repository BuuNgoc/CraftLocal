import axiosClient from './axiosClient';

const dashboardApi = {
  // Dashboard APIs
  getAdminStats: () => axiosClient.get('/admin/dashboard'),
  getHostStats: () => axiosClient.get('/host/dashboard'),
  getTourGuideStats: () => axiosClient.get('/tour-guide/dashboard'),
  getTouristStats: () => axiosClient.get('/bookings/dashboard'),

  // Admin management
  getAdminUsers: () => axiosClient.get('/admin/users'),
  getPendingHosts: () => axiosClient.get('/admin/hosts/pending'),
  approveHost: (id: string) => axiosClient.put(`/admin/hosts/${id}/approve`),
  blockUser: (id: string) => axiosClient.put(`/admin/users/${id}/block`),
  unblockUser: (id: string) => axiosClient.put(`/admin/users/${id}/unblock`),
};

export default dashboardApi;
