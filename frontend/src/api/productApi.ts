import axiosClient from './axiosClient';

const productApi = {
  // Public
  getAll: (params?: Record<string, any>) => axiosClient.get('/products', { params }),
  getById: (id: string) => axiosClient.get(`/products/${id}`),
  // Host
  getByHost: () => axiosClient.get('/host/products'),
  create: (data: any) => axiosClient.post('/host/products', data),
  update: (id: string, data: any) => axiosClient.put(`/host/products/${id}`, data),
  delete: (id: string) => axiosClient.delete(`/host/products/${id}`),
};

export default productApi;
