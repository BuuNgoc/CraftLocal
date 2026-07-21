import axiosClient from './axiosClient';

const notificationApi = {
  getNotifications: (params?: any) =>
    axiosClient.get('/notifications', { params }),

  getUnreadCount: () =>
    axiosClient.get('/notifications/unread-count'),

  markAsRead: (id: string) =>
    axiosClient.put(`/notifications/${id}/read`),

  markAllAsRead: () =>
    axiosClient.put('/notifications/read-all'),

  deleteNotification: (id: string) =>
    axiosClient.delete(`/notifications/${id}`),

  clearRead: () =>
    axiosClient.delete('/notifications/clear-read'),
};

export default notificationApi;
