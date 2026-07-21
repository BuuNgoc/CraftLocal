import axiosClient from './axiosClient';

const reviewApi = {
  create: (data: any) => axiosClient.post('/reviews', data),
  getByWorkshop: (workshopId: string) => axiosClient.get(`/reviews/workshop/${workshopId}`),
};

export default reviewApi;
