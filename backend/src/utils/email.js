const { sendEmail } = require('./messaging');
const { escapeHtml } = require('./sanitize');

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

/**
 * Send booking confirmation email to renter
 */
async function sendBookingConfirmationEmail(email, name, booking) {
  const bookingUrl = `${CLIENT_URL}/bookings`;
  const startDate = new Date(booking.startDate).toLocaleDateString('en-IN');
  const endDate = new Date(booking.endDate).toLocaleDateString('en-IN');
  const amount = (booking.totalAmount / 100).toLocaleString('en-IN');

  await sendEmail({
    to: email,
    subject: `Booking Confirmed: ${booking.listing?.title || 'Your rental'}`,
    text: `Hi ${name || 'there'}, your booking for ${booking.listing?.title} is confirmed. ${startDate} to ${endDate}. Total: ₹${amount}.`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px;">
        <h2 style="color: #243c2d;">Booking Confirmed ✅</h2>
        <p>Hi ${escapeHtml(name || 'there')},</p>
        <p>Your rental has been confirmed. Here are the details:</p>
        <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Item:</strong> ${escapeHtml(booking.listing?.title)}</p>
          <p><strong>Dates:</strong> ${startDate} — ${endDate}</p>
          <p><strong>Total:</strong> ₹${amount}</p>
        </div>
        <a href="${bookingUrl}" style="display: inline-block; padding: 12px 24px; background: #243c2d; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">View Booking</a>
      </div>
    `,
  });
}

/**
 * Send booking request email to listing owner
 */
async function sendBookingRequestEmail(email, name, booking) {
  const bookingUrl = `${CLIENT_URL}/bookings`;
  const startDate = new Date(booking.startDate).toLocaleDateString('en-IN');
  const endDate = new Date(booking.endDate).toLocaleDateString('en-IN');

  await sendEmail({
    to: email,
    subject: `New Booking Request: ${booking.listing?.title || 'Your listing'}`,
    text: `Hi ${name || 'there'}, someone wants to rent your ${booking.listing?.title}. ${startDate} to ${endDate}. Please review and confirm.`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px;">
        <h2 style="color: #243c2d;">New Booking Request 📦</h2>
        <p>Hi ${escapeHtml(name || 'there')},</p>
        <p>Someone wants to rent your item. Here are the details:</p>
        <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Item:</strong> ${escapeHtml(booking.listing?.title)}</p>
          <p><strong>Dates:</strong> ${startDate} — ${endDate}</p>
          <p><strong>Status:</strong> Awaiting your confirmation</p>
        </div>
        <a href="${bookingUrl}" style="display: inline-block; padding: 12px 24px; background: #243c2d; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Review Request</a>
      </div>
    `,
  });
}

/**
 * Send dispute notification email to admin
 */
async function sendDisputeNotificationEmail(email, name, dispute) {
  const adminUrl = `${CLIENT_URL}/admin`;

  await sendEmail({
    to: email,
    subject: `New Dispute Filed: ${dispute.bookingId}`,
    text: `Hi ${name || 'Admin'}, a new dispute has been filed. Reason: ${dispute.reason}. Please review.`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px;">
        <h2 style="color: #dc3545;">Dispute Filed ⚠️</h2>
        <p>Hi ${escapeHtml(name || 'Admin')},</p>
        <p>A new dispute has been filed and requires your attention.</p>
        <div style="background: #fff3cd; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #ffc107;">
          <p><strong>Booking ID:</strong> ${escapeHtml(dispute.bookingId)}</p>
          <p><strong>Reason:</strong> ${escapeHtml(dispute.reason)}</p>
        </div>
        <a href="${adminUrl}" style="display: inline-block; padding: 12px 24px; background: #dc3545; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Review Dispute</a>
      </div>
    `,
  });
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail,
  sendBookingRequestEmail,
  sendDisputeNotificationEmail,
};
