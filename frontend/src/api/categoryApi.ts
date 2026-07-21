import axiosClient from './axiosClient';

const categoryApi = {
  getAll: (params?: { type?: string }) => axiosClient.get('/categories', { params }),
};

export default categoryApi;
