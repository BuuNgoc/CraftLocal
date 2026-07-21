import axiosClient from './axiosClient';

export interface HostApplicationPayload {
  workshopName: string;
  ownerName: string;
  ownerPhone: string;
  businessAddress: {
    addressLine: string;
    ward?: string;
    district?: string;
    city: string;
    province: string;
    country: string;
    fullAddress: string;
  };
  description: string;
  specialization?: string;
  experience?: string;
  certificateFile: {
    url: string;
    secureUrl: string;
    publicId: string;
    originalName?: string;
    format?: string;
    size?: number;
  };
}

export const hostApplicationApi = {
  getMyApplication: () => axiosClient.get('/host-applications/me'),
  
  apply: (data: HostApplicationPayload) => axiosClient.post('/host-applications/apply', data),
  
  getAllForAdmin: (params?: { status?: string }) => 
    axiosClient.get('/host-applications/admin/host-applications', { params }),
    
  approve: (id: string) => axiosClient.put(`/host-applications/admin/host-applications/${id}/approve`),
  
  reject: (id: string, rejectReason: string) => 
    axiosClient.put(`/host-applications/admin/host-applications/${id}/reject`, { rejectReason }),

  viewCertificate: (id: string) => 
    axiosClient.get(`/host-applications/admin/host-applications/${id}/certificate/view`, {
      responseType: 'blob',
    }),
    
  downloadCertificate: (id: string) => 
    axiosClient.get(`/host-applications/admin/host-applications/${id}/certificate/download`, {
      responseType: 'blob',
    }),
};

export default hostApplicationApi;
