const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;

function createSignedResourceAccessToken(resourceId, resourceType, userId) {
  if (!ACCESS_SECRET) return null;
  return jwt.sign({ resourceId, resourceType, userId }, ACCESS_SECRET, { expiresIn: '30d' });
}

function verifySignedResourceAccessToken(token, resourceId, resourceType, userId) {
  if (!token || !ACCESS_SECRET) return false;

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);
    const matchesResource = decoded.resourceId === resourceId && decoded.resourceType === resourceType;
    if (userId) return matchesResource && decoded.userId === userId;
    return matchesResource;
  } catch {
    return false;
  }
}

module.exports = {
  createSignedResourceAccessToken,
  verifySignedResourceAccessToken,
};
