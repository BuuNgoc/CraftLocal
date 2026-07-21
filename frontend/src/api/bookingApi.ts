import axiosClient from './axiosClient';

const bookingApi = {
  create: (data: any) => axiosClient.post('/bookings', data),
  getMyBookings: () => axiosClient.get('/bookings/my-bookings'),
  getById: (id: string) => axiosClient.get(`/bookings/${id}`),
  getTicket: (id: string) => axiosClient.get(`/bookings/${id}/ticket`),
  cancel: (id: string, reason?: string) => axiosClient.put(`/bookings/${id}/cancel`, { cancelReason: reason }),
};

export default bookingApi;
