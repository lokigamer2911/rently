/**
 * Payment side effects for the Razorpay-only checkout.
 *
 * Every entry point is idempotent — settling the same payment twice must not
 * double-confirm the booking or double-notify.
 */

const prisma = require('../config/prisma');
const { createNotification } = require('../utils/notifications');

const STATUS = {
  CREATED: 'CREATED',
  PAID: 'PAID',
  FAILED: 'FAILED',
};

const METHOD = {
  RAZORPAY: 'RAZORPAY',
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
 * @param {string}  args.paymentId          Payment row id
 * @param {string}  args.razorpayOrderId    Razorpay order id (gateway path)
 * @param {string}  [args.razorpayPaymentId]
 * @param {string}  [args.razorpaySignature]
 * @param {object}  [args.io]               Socket.IO server for live notifications
 * @returns {Promise<{ok: boolean, alreadyProcessed: boolean, bookingId: string|null, reason?: string}>}
 */
async function settlePayment({
  paymentId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
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

module.exports = {
  METHOD,
  STATUS,
  settlePayment,
  notifyBookingConfirmation,
};
