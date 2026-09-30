import { setStoredAdminKey, clearStoredAdminKey, getStoredAdminKey } from './adminKeyStorage';
import { api } from './api';

/**
 * Axios config carrying the stored admin key as the X-Admin-Key header.
 * Spread it into any admin API call:
 *   api.post(url, body, adminKeyHeaders())
 *   useSWR('/admin/stats', adminFetcher)
 */
export function adminKeyHeaders(extra = {}) {
  const key = getStoredAdminKey();
  const headers = key ? { 'X-Admin-Key': key } : {};
  return { ...extra, headers: { ...extra.headers, ...headers } };
}

/** SWR fetcher that sends the admin key. */
export const adminFetcher = (url) => api.get(url, adminKeyHeaders()).then((r) => r.data);

/** True when the API error looks like an admin-key problem. */
export function isAdminKeyError(error) {
  const code = error?.response?.data?.code;
  return ['ADMIN_KEY_REQUIRED', 'ADMIN_KEY_INVALID', 'ADMIN_KEY_RATE_LIMITED'].includes(code);
}

export { setStoredAdminKey, clearStoredAdminKey, getStoredAdminKey };
