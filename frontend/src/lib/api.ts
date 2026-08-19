import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('crm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint =
      error.config?.url?.includes('/auth/login') ||
      error.config?.url?.includes('/auth/register');

    if (error.response?.status === 401 && !isAuthEndpoint && typeof window !== 'undefined') {
      localStorage.removeItem('crm_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: { name: string; email: string; password: string }) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// Leads
export const leadsAPI = {
  getAll: (params?: Record<string, string | number>) => api.get('/leads', { params }),
  getById: (id: string) => api.get(`/leads/${id}`),
  create: (data: any) => api.post('/leads', data),
  update: (id: string, data: any) => api.put(`/leads/${id}`, data),
  updateField: (id: string, data: any) => api.patch(`/leads/${id}/field`, data),
  delete: (id: string) => api.delete(`/leads/${id}`),
  bulkUpload: (data: any[]) => api.post('/leads/bulk', { leads: data }),
  getStats: () => api.get('/leads/stats'),
};

// Email
export const emailAPI = {
  send: (data: any) => api.post('/email/send', data),
  getLogs: (params?: Record<string, string | number>) => api.get('/email/logs', { params }),
  getTemplates: () => api.get('/email/templates'),
  createTemplate: (data: any) => api.post('/email/templates', data),
  updateTemplate: (id: string, data: any) => api.put(`/email/templates/${id}`, data),
  deleteTemplate: (id: string) => api.delete(`/email/templates/${id}`),
  getTodaySequence: () => api.get('/email/today-sequence'),
};

// Sequences
export const sequencesAPI = {
  getAll: (params?: Record<string, string | number>) => api.get('/sequences', { params }),
  getByLead: (leadId: string) => api.get(`/sequences/lead/${leadId}`),
  create: (data: any) => api.post('/sequences', data),
  updateStep: (id: string, data: any) => api.patch(`/sequences/${id}/step`, data),
  pause: (id: string) => api.patch(`/sequences/${id}/pause`),
  resume: (id: string) => api.patch(`/sequences/${id}/resume`),
  cancel: (id: string) => api.patch(`/sequences/${id}/cancel`),
  getDue: () => api.get('/sequences/due'),
};

// Dashboard
export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview'),
  getFunnel: () => api.get('/dashboard/funnel'),
  getConversions: () => api.get('/dashboard/conversions'),
  getDailyLogs: (params?: Record<string, string | number>) => api.get('/dashboard/daily-logs', { params }),
  createDailyLog: (data: any) => api.post('/dashboard/daily-logs', data),
};

export default api;
