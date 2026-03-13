import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authApi = {
    login: (credentials) => api.post('/auth/login', credentials, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }),
    signup: (userData) => api.post('/auth/signup', userData),
};

export const patientApi = {
    analyze: (imageData) => api.post('/patient/analyze', { image: imageData }),
    getReports: () => api.get('/patient/reports'),
    deleteReport: (reportId) => api.delete(`/patient/reports/${reportId}`),
};

export const doctorApi = {
    getPatients: () => api.get('/doctor/patients'),
    addReview: (reportId, content) => api.post(`/doctor/review/${reportId}`, { content }),
};

export default api;
