const Razorpay = require('razorpay');

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

let razorpayInstance = null;

if (key_id && key_secret) {
  try {
    razorpayInstance = new Razorpay({ key_id, key_secret });
  } catch (error) {
    console.error('Failed to initialize Razorpay:', error);
  }
}

if (!razorpayInstance) {
  // Fail loudly when keys are missing: fabricating orders would write fake
  // payment rows that look real. Callers must check keys first (see the
  // 503 guard in POST /payments/order and the try/catch in POST /verify).
  console.warn('Razorpay credentials missing. Payment endpoints will answer 503 until RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set.');
}

module.exports = razorpayInstance;
