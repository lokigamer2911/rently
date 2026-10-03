/**
 * Request ID Middleware Utility
 * 
 * Generates a unique request ID for each incoming request to enable
 * distributed tracing and debugging across services.
 * 
 * Format: req-{timestamp}-{randomHex}
 * Example: req-1728039204000-a3f7b2
 */

function generateRequestId() {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2).padStart(6, '0')}`;
}

module.exports = function requestIdMiddleware(req, _res, next) {
  req.id = req.headers['x-request-id'] || generateRequestId();
  next();
};

module.exports.generateRequestId = generateRequestId;
module.exports.default = requestIdMiddleware;