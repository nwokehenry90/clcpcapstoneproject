import axios from 'axios';
import authService from './authService';

const API_BASE_URL = process.env.REACT_APP_API_ENDPOINT || 'https://your-api-gateway-url.com/prod';

// Create axios instance with interceptors for auth
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(
  async (config) => {
    const token = await authService.getIdToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Profile API
export const profileApi = {
  getProfile: () => apiClient.get('/api/profile'),
  updateProfile: (data: { phoneNumber?: string; address?: string; dateOfBirth?: string }) =>
    apiClient.put('/api/profile', data),
};

// Certification API
export const certificationApi = {
  getUserCertifications: () => apiClient.get('/api/certifications'),
  uploadCertification: (data: {
    skillCategory: string;
    certificateType: string;
    certificateTitle: string;
    issuingOrganization: string;
    issueDate: string;
    fileName: string;
    fileSize: number;
  }) => apiClient.post('/api/certifications', data),
  deleteCertification: (id: string) => apiClient.delete(`/api/certifications/${id}`),
};

// Admin API
export const adminApi = {
  getPendingCertifications: () => apiClient.get('/api/admin/certifications'),
  approveCertification: (id: string) => apiClient.post(`/api/admin/certifications/${id}/approve`),
  rejectCertification: (id: string, rejectionReason: string) =>
    apiClient.post(`/api/admin/certifications/${id}/reject`, { rejectionReason }),
};

export default apiClient;
