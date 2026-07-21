import axiosClient from './axiosClient';

const workshopApi = {
  // Public
  getAll: (params?: Record<string, any>) => axiosClient.get('/workshops', { params }),
  getById: (id: string) => axiosClient.get(`/workshops/${id}`),
  getTimeslots: (id: string) => axiosClient.get(`/workshops/${id}/timeslots`),
  // Host
  getByHost: () => axiosClient.get('/host/workshops'),
  create: (data: any) => axiosClient.post('/host/workshops', data),
  update: (id: string, data: any) => axiosClient.put(`/host/workshops/${id}`, data),
  delete: (id: string) => axiosClient.delete(`/host/workshops/${id}`),
};

export default workshopApi;
