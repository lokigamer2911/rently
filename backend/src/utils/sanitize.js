/**
 * Escape HTML special characters to prevent XSS/injection in email templates.
 * Shared utility used by email.js and notifications.js.
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Validate and sanitize a URL to prevent javascript: and data: URI attacks.
 * Only allows paths starting with / to prevent open redirect.
 */
function safeUrl(base, path) {
  if (!path || typeof path !== 'string') return null;
  if (!path.startsWith('/')) return null;
  return `${base}${path}`;
}

module.exports = { escapeHtml, safeUrl };
