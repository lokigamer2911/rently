const { sendEmail } = require('./messaging');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

/**
 * Send email verification link
 */
async function sendVerificationEmail(email, token, name) {
  const verifyUrl = `${CLIENT_URL}/auth/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Verify your Rently account',
    text: `Hi ${name || 'there'}, click the link to verify your email: ${verifyUrl}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px;">
        <h2 style="color: #243c2d;">Verify your email</h2>
        <p>Hi ${escapeHtml(name || 'there')},</p>
        <p>Thanks for signing up for Rently. Please verify your email address to activate your account.</p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #243c2d; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Verify Email</a>
        <p style="margin-top: 20px; font-size: 12px; color: #888;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `,
  });
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, token, name) {
  const resetUrl = `${CLIENT_URL}/auth/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Reset your Rently password',
    text: `Hi ${name || 'there'}, click the link to reset your password: ${resetUrl}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px;">
        <h2 style="color: #243c2d;">Reset your password</h2>
        <p>Hi ${escapeHtml(name || 'there')},</p>
        <p>We received a request to reset your password. Click the button below to choose a new one.</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #dc3545; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
        <p style="margin-top: 20px; font-size: 12px; color: #888;">This link expires in 1 hour. If you didn't request this, your account is still safe — just ignore this email.</p>
      </div>
    `,
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
