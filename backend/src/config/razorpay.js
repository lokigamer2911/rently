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
  console.warn('Razorpay credentials missing. Payments will run in mock mode.');
  razorpayInstance = new Proxy({}, {
    get: (target, prop) => {
      // Mock orders or payments methods if called
      if (prop === 'orders') {
        return {
          create: async (params) => {
            console.log('Mocking Razorpay order creation with params:', params);
            return { id: 'order_mock_' + Math.random().toString(36).substring(7), amount: params.amount, status: 'created' };
          }
        };
      }
      return () => {
        console.warn(`Razorpay method "${String(prop)}" called, but Razorpay is not configured.`);
        return {};
      };
    }
  });
}

module.exports = razorpayInstance;
