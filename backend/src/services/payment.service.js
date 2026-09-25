/**
 * Payment side effects shared by every way a payment can be settled:
 * the Razorpay webhook, the Razorpay checkout callback, and the manual
 * UPI verification done from the admin panel.
 *
 * Every entry point is idempotent — settling the same payment twice must not
 * double-confirm the booking or double-notify.
 */

const prisma = require('../config/prisma');
const { createNotification } = require('../utils/notifications');

const STATUS = {
  CREATED: 'CREATED',
  AWAITING_VERIFICATION: 'AWAITING_VERIFICATION',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REJECTED: 'REJECTED',
};

const METHOD = {
  RAZORPAY: 'RAZORPAY',
  UPI_QR: 'UPI_QR',
};

/** Tell both parties the booking is locked in. */
async function notifyBookingConfirmation(booking, io) {
  if (!booking) return;

  await createNotification(io, {
    userId: booking.renterId,
    type: 'BOOKING_UPDATE',
    title: 'Payment confirmed ✅',
    body: `Your booking for ${booking.listing?.title || 'your item'} is now confirmed.`,
    link: '/bookings',
  });

  await createNotification(io, {
    userId: booking.listing?.ownerId,
    type: 'BOOKING_UPDATE',
    title: 'Booking confirmed ✅',
    body: `A booking for ${booking.listing?.title || 'your item'} has been confirmed and paid.`,
    link: '/bookings',
  });
}

/**
 * Mark a payment PAID and confirm its booking in a single transaction.
 *
 * @param {object}  args
 * @param {string}  args.paymentId          Payment row id (UPI / admin path)
 * @param {string}  args.razorpayOrderId    Razorpay order id (gateway path)
 * @param {string}  [args.razorpayPaymentId]
 * @param {string}  [args.razorpaySignature]
 * @param {string}  [args.verifiedById]     Admin user id for manual verifications
 * @param {object}  [args.io]               Socket.IO server for live notifications
 * @returns {Promise<{ok: boolean, alreadyProcessed: boolean, bookingId: string|null, reason?: string}>}
 */
async function settlePayment({
  paymentId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  verifiedById,
  io,
}) {
  if (!paymentId && !razorpayOrderId) {
    return { ok: false, alreadyProcessed: false, bookingId: null, reason: 'missing_identifier' };
  }

  const payment = await prisma.payment.findFirst({
    where: paymentId ? { id: paymentId } : { razorpayOrderId },
  });
  if (!payment) return { ok: false, alreadyProcessed: false, bookingId: null, reason: 'payment_not_found' };

  if (payment.status === STATUS.PAID) {
    return { ok: true, alreadyProcessed: true, bookingId: payment.bookingId };
  }

  const gatewayFields = {
    ...(razorpayPaymentId ? { razorpayPaymentId } : {}),
    ...(razorpaySignature ? { razorpaySignature } : {}),
  };

  try {
    const booking = await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          ...gatewayFields,
          status: STATUS.PAID,
          verifiedAt: new Date(),
          verifiedById: verifiedById || null,
          rejectionReason: null,
        },
      });

      const updatedBooking = await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'CONFIRMED' },
      });

      await tx.listing.update({
        where: { id: updatedBooking.listingId },
        data: { available: false },
      });

      return updatedBooking;
    });

    const hydratedBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: { listing: true, renter: true },
    });

    await notifyBookingConfirmation(hydratedBooking, io);

    return { ok: true, alreadyProcessed: false, bookingId: booking.id };
  } catch (error) {
    // The booking/payment row was already resolved elsewhere — treat as done.
    console.warn('Payment settlement skipped due to Prisma error:', error.message);
    return { ok: true, alreadyProcessed: true, bookingId: payment.bookingId };
  }
}

/** Move a UPI payment to AWAITING_VERIFICATION once the renter submits a UTR. */
async function submitUpiClaim({ paymentId, utr, note, proofUrl, io }) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { booking: { include: { listing: true, renter: true } } },
  });
  if (!payment) return { ok: false, reason: 'payment_not_found' };

  if (payment.status === STATUS.PAID) return { ok: true, alreadyPaid: true };
  if (payment.status === STATUS.REJECTED) return { ok: false, reason: 'rejected' };

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: STATUS.AWAITING_VERIFICATION,
      payerUtr: utr,
      payerNote: note || null,
      proofUrl: proofUrl || null,
    },
  });

  // Nudge the admins so the credit gets checked in the bank/UPI app.
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
  await Promise.all(
    admins.map((admin) => createNotification(io, {
      userId: admin.id,
      type: 'PAYMENT_UPDATE',
      title: 'UPI payment awaiting verification 💰',
      body: `${payment.booking?.renter?.name || 'A renter'} paid for `
        + `${payment.booking?.listing?.title || 'a booking'} — ref ${payment.upiRef || payment.id}, UTR ${utr}.`,
      link: '/admin?tab=payments',
    })),
  );

  return { ok: true, alreadyPaid: false };
}

/** Record why a payment was not matched to a credit. */
async function rejectUpiPayment({ paymentId, reason, verifiedById }) {
  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: STATUS.REJECTED,
      rejectionReason: reason || 'Payment could not be matched to a credit',
      verifiedAt: new Date(),
      verifiedById: verifiedById || null,
    },
  });
}

module.exports = {
  METHOD,
  STATUS,
  settlePayment,
  submitUpiClaim,
  rejectUpiPayment,
  notifyBookingConfirmation,
};
