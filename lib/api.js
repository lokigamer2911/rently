import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api';
export const api = axios.create({ baseURL });

api.interceptors.request.use((cfg) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (!err.response && err.request) {
      // This is a network error (no response received)
      const errorMsg = 'Network Error: Cannot reach the backend. Please ensure your backend server is running on port 5050.';
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error(errorMsg);
      }
      return Promise.reject({ ...err, message: errorMsg });
    }
    return Promise.reject(err);
  }
);

export const fetcher = (url) => api.get(url).then(r => r.data);
