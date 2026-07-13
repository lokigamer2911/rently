const jwt = require('jsonwebtoken');
exports.signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, tokenVersion: user.tokenVersion ?? 0 },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }  // Reduced from 30d — stolen tokens expire sooner
  );
