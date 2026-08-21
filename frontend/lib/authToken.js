// The JWT fallback is intentionally stored in memory only.
// This avoids localStorage persistence and keeps the token available
// only for the current page session when cookie auth needs a retry.
let inMemoryAuthToken = null;

export function getStoredAuthToken() {
  return inMemoryAuthToken;
}

export function setStoredAuthToken(token) {
  inMemoryAuthToken = token || null;
}

