import axiosClient from './axiosClient';

const tourGuideApi = {
  // Host manages guides
  getByHost: () => axiosClient.get('/host/tour-guides'),
  create: (data: { fullName: string; email: string; phone: string; password: string }) =>
    axiosClient.post('/host/tour-guides', data),
  assignToTimeslot: (timeslotId: string, tourGuideId: string) =>
    axiosClient.put(`/host/timeslots/${timeslotId}/assign-guide`, { tourGuideId }),
  // Tour Guide own routes
  getProfile: () => axiosClient.get('/tour-guide/profile'),
  getDashboard: () => axiosClient.get('/tour-guide/dashboard'),
  getSchedules: () => axiosClient.get('/tour-guide/schedules'),
  getCustomers: (timeslotId: string) => axiosClient.get(`/tour-guide/timeslots/${timeslotId}/customers`),
  // Unified check-in: gửi field `code` (nhận cả qrToken và checkInCode)
  checkInByCode: (code: string) => axiosClient.post('/tour-guide/check-in', { code }),
  // Backward compat alias
  checkIn: (code: string) => axiosClient.post('/tour-guide/check-in', { code }),
  startTimeslot: (timeslotId: string) => axiosClient.put(`/tour-guide/timeslots/${timeslotId}/start`),
  finishTimeslot: (timeslotId: string) => axiosClient.put(`/tour-guide/timeslots/${timeslotId}/finish`),
  // Host timeslots
  getHostTimeslots: () => axiosClient.get('/host/timeslots'),
  createTimeslot: (data: any) => axiosClient.post('/host/timeslots', data),
  updateTimeslot: (id: string, data: any) => axiosClient.put(`/host/timeslots/${id}`, data),
  deleteTimeslot: (id: string) => axiosClient.delete(`/host/timeslots/${id}`),
};

export default tourGuideApi;
