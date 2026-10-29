/**
 * Storage for the admin access key.
 *
 * sessionStorage is intentional: the key lives only in the browser tab that
 * unlocked the admin area, disappears when the tab closes, and never touches
 * localStorage or any cookie — so a stolen device or an unrelated XSS on the
 * site does not yield a long-lived admin credential.
 *
 * It still lives in the memory of that one tab, which is the accepted
 * trade-off for this project stage. Hardening path if needed later: a
 * short-lived server-issued admin session token minted by POST /api/admin/key-check.
 */

const STORAGE_KEY = 'rently.adminKey';

export function setStoredAdminKey(key) {
  try {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(STORAGE_KEY, key);
  } catch {
    // Private mode / storage disabled — key just won't persist across navigations.
  }
}

export function getStoredAdminKey() {
  try {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearStoredAdminKey() {
  try {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
