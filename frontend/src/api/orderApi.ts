import axiosClient from './axiosClient';

const orderApi = {
  checkout: (data: any) => axiosClient.post('/orders/checkout', data),
  getMyOrders: () => axiosClient.get('/orders/my-orders'),
  getById: (id: string) => axiosClient.get(`/orders/${id}`),
  // Host
  getHostOrders: () => axiosClient.get('/host/orders'),
  updateStatus: (id: string, status: string) => axiosClient.put(`/host/orders/${id}/status`, { orderStatus: status }),
};

export default orderApi;
