/**
 * UPI payment configuration.
 *
 * While the Razorpay integration is pending we collect rent on a plain UPI QR.
 * A UPI QR is only a *payment request* — nothing calls our server when money
 * lands, so credit is confirmed by a human in the admin panel
 * (/admin → Payments) after checking the bank/UPI app.
 *
 * Configure one or more payees (yourself + co-founders) as JSON:
 *
 *   UPI_PAYEES=[{"vpa":"you@okhdfcbank","name":"Rently","label":"Founder"},{"vpa":"co@ybl","name":"Rently Co","label":"Co-founder"}]
 *
 * A single payee can also be set with the older UPI_VPA / UPI_PAYEE_NAME pair.
 * Payees are handed out round-robin so rent doesn't pile up in one account.
 */

const crypto = require('crypto');

const RAZORPAY_ENABLED = process.env.PAYMENTS_RAZORPAY_ENABLED === 'true';

/** The notice shown to renters while the gateway is being wired up. */
const RAZORPAY_PENDING_NOTICE =
  'Razorpay integration is in progress. You can pay securely to our UPI QR code right now — '
  + 'your booking is confirmed as soon as we see the payment land.';

const UPI_ID_RE = /^[a-zA-Z0-9.\-_]{2,64}@[a-zA-Z]{2,32}$/;

function parsePayees() {
  const raw = process.env.UPI_PAYEES;

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      const valid = list
        .map((entry) => ({
          vpa: String(entry?.vpa || '').trim(),
          name: String(entry?.name || 'Rently').trim(),
          label: String(entry?.label || '').trim(),
        }))
        .filter((entry) => UPI_ID_RE.test(entry.vpa));

      if (valid.length) return valid;
      console.warn('UPI_PAYEES is set but contains no valid VPA — ignoring it.');
    } catch (error) {
      console.warn(`UPI_PAYEES is not valid JSON (${error.message}) — ignoring it.`);
    }
  }

  const vpa = String(process.env.UPI_VPA || '').trim();
  if (UPI_ID_RE.test(vpa)) {
    return [{ vpa, name: String(process.env.UPI_PAYEE_NAME || 'Rently').trim(), label: '' }];
  }

  return [];
}

let cachedPayees = null;
let roundRobinCursor = 0;

function getPayees() {
  if (!cachedPayees) cachedPayees = parsePayees();
  return cachedPayees;
}

/** True when at least one payee VPA is configured, i.e. the QR flow is usable. */
function isUpiQrEnabled() {
  return getPayees().length > 0;
}

/** True when the real gateway should be used instead of the QR fallback. */
function isRazorpayEnabled() {
  return RAZORPAY_ENABLED && Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/**
 * Return the payee for a booking. Passing the payment reference seeds the choice
 * so re-opening the same QR always shows the same UPI ID, while different
 * bookings still spread across the founders' accounts.
 */
function pickPayee(seed) {
  const payees = getPayees();
  if (!payees.length) return null;

  if (seed) {
    const digest = crypto.createHash('sha256').update(String(seed)).digest();
    return payees[digest[0] % payees.length];
  }

  const payee = payees[roundRobinCursor % payees.length];
  roundRobinCursor = (roundRobinCursor + 1) % payees.length;
  return payee;
}

/**
 * Short, unambiguous reference. Goes into the UPI note ("tn") and the remitter
 * sees it in their app, so a credit in the bank statement can be matched back
 * to a booking. Ambiguous characters (0/O, 1/I) are left out.
 */
function generateRef() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(6);
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) out += alphabet[bytes[i] % alphabet.length];
  return `RTX${out}`;
}

/** Rupees, 2 decimals — UPI rejects a malformed or negative amount. */
function toRupees(amountPaise) {
  return (Math.max(0, Number(amountPaise) || 0) / 100).toFixed(2);
}

/**
 * Build the UPI deep link. `am` pre-fills the amount so the renter cannot
 * fat-finger it, and `tr`/`tn` carry our reference through to the statement.
 *
 * The query is encoded with encodeURIComponent rather than URLSearchParams:
 * the latter writes spaces as "+", which several UPI apps do not decode back
 * to a space, mangling the payee name.
 */
function buildUpiLink({ payee, amountPaise, ref, note }) {
  if (!payee?.vpa) return null;

  const params = [
    ['pa', payee.vpa],
    ['pn', payee.name || 'Rently'],
    ['am', toRupees(amountPaise)],
    ['cu', 'INR'],
  ];
  if (ref) params.push(['tr', ref]);
  params.push(['tn', note || `Rently rent ${ref || ''}`.trim()]);

  const query = params
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

  return `upi://pay?${query}`;
}

/**
 * Optional: a screenshot/photo of a founder's UPI QR (`UPI_STATIC_QR_IMAGE_URL`)
 * shown under the generated QR. Useful when the payee UPI ID is a business VPA
 * that some apps won't accept from a deep link.
 */
function getStaticQrUrl() {
  const url = String(process.env.UPI_STATIC_QR_IMAGE_URL || '').trim();
  return url || null;
}

/** Where renters should reach out when a payment needs to be matched by hand. */
function getSupportContact() {
  return String(process.env.PAYMENTS_SUPPORT_CONTACT || '').trim() || null;
}

module.exports = {
  RAZORPAY_PENDING_NOTICE,
  buildUpiLink,
  generateRef,
  getPayees,
  getStaticQrUrl,
  getSupportContact,
  isRazorpayEnabled,
  isUpiQrEnabled,
  pickPayee,
  toRupees,
};
