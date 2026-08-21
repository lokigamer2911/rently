import axios from 'axios';
import { getStoredAuthToken, setStoredAuthToken } from './authToken';

const getBaseURL = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;

  if (typeof window === 'undefined') {
    return 'http://localhost:5050/api';
  }

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5050/api';
  }

  console.error('⚠️ NEXT_PUBLIC_API_URL is not set. API calls will fail in production.');
  return '/api';
};

const baseURL = getBaseURL();

export const api = axios.create({ 
  baseURL,
  withCredentials: true // Automatically send cookies with every request
});

// Track if we're currently refreshing to prevent multiple parallel refreshes
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  failedQueue = [];
};

// Request interceptor: add CSRF header and fallback auth token
api.interceptors.request.use((cfg) => {
  // Add CSRF header if cookie exists (browser sets cookie, we read it)
  if (typeof document !== 'undefined') {
    const csrfCookie = document.cookie.split('; ').find(c => c.startsWith('csrf-token='));
    if (csrfCookie) {
      const csrfToken = csrfCookie.split('=')[1];
      if (csrfToken) {
        cfg.headers['X-CSRF-Token'] = csrfToken;
      }
    }
  }

  // Bearer fallback for initial load (development only, removed in production by middleware)
  const token = cfg?.__useAuthFallback ? getStoredAuthToken() : null;
  if (token) {
    cfg.headers = cfg.headers || {};
    if (!cfg.headers.Authorization) {
      cfg.headers.Authorization = `Bearer ${token}`;
    }
  }
  return cfg;
});

// Response interceptor: handle 401 with automatic refresh
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    // Network error (no response)
    if (!err.response && err.request) {
      const errorMsg = 'Network Error: Cannot reach the backend.';
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.error(errorMsg);
      }
      return Promise.reject({ ...err, message: errorMsg });
    }

    // Handle 401 TOKEN_EXPIRED — try refresh
    if (
      err.response?.status === 401 && 
      err.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint (sends httpOnly refresh token cookie automatically)
        const { data } = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
        
        setStoredAuthToken(data.token);
        processQueue(null);
        
        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        
        // Refresh failed — redirect to login
        setStoredAuthToken(null);
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login?message=Session expired. Please log in again.';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export const fetcher = (url) => api.get(url).then(r => r.data);
