import axios from 'axios';
import { getStoredAuthToken } from './authToken';

const getBaseURL = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;

  if (typeof window === 'undefined') return '/api';

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5050/api';
  }

  return `${window.location.origin}/api`;
};

const baseURL = getBaseURL();
export const api = axios.create({ 
  baseURL,
  withCredentials: true // Automatically send cookies with every request
});

api.interceptors.request.use((cfg) => {
  const token = cfg?.__useAuthFallback ? getStoredAuthToken() : null;
  if (token) {
    cfg.headers = cfg.headers || {};
    if (!cfg.headers.Authorization) {
      cfg.headers.Authorization = `Bearer ${token}`;
    }
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
