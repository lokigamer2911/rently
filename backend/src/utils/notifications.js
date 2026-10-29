const prisma = require('../config/prisma');
const { sendEmail, sendSMS } = require('./messaging');
const { escapeHtml, safeUrl } = require('./sanitize');

const createNotification = async (io, { userId, type, title, body, link }) => {
  try {
    const notification = await prisma.notification.create({
      data: { userId, type, title, body, link }
    });

    // Broadcast real-time if io is provided
    if (io) {
      io.to(`user:${userId}`).emit('notification:recv', notification);
    }

    // Background: Send Email/SMS
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true, name: true }
    });

    if (user) {
      if (user.email) {
        const safeLink = safeUrl(process.env.CLIENT_URL || '', link);
        sendEmail({
          to: user.email,
          subject: title,
          text: body,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #243c2d;">${escapeHtml(title)}</h2>
              <p>${escapeHtml(body)}</p>
              ${safeLink ? `<a href="${escapeHtml(safeLink)}" style="display: inline-block; padding: 10px 20px; background: #243c2d; color: #fff; text-decoration: none; border-radius: 5px;">View on Rentrex</a>` : ''}
            </div>
          `
        });
      }

      if (user.phone) {
        sendSMS({
          to: user.phone,
          body: `${title}: ${body}`
        });
      }
    }

    return notification;
  } catch (err) {
    console.error('Notification creation failed:', err);
  }
};

const notifyWaitlist = async (io, listingId) => {
  try {
    const alerts = await prisma.alert.findMany({
      where: { listingId },
      include: { listing: { select: { title: true } } }
    });

    for (const alert of alerts) {
      await createNotification(io, {
        userId: alert.userId,
        type: 'AVAILABILITY_ALERT',
        title: 'Item Available! 🎁',
        body: `Good news! The ${alert.listing.title} you were watching is now available for rent.`,
        link: `/listings/${listingId}`
      });
      
      // Delete alert once notified
      await prisma.alert.delete({ where: { id: alert.id } });
    }
  } catch (err) {
    console.error('Waitlist notification failed:', err);
  }
};

module.exports = { createNotification, notifyWaitlist };
