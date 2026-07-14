const request = require('supertest');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.test') });
const app = require('../src/index'); // Ensure this points to the exported Express app

describe('Payment webhook idempotency', () => {
  const payload = { order_id: 'ord_123', payment_id: 'pay_456', status: 'captured' };
  const crypto = require('crypto');
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');

  it('should handle the same webhook twice without duplicate side‑effects', async () => {
    const first = await request(app)
      .post('/api/payments/webhook')
      .set('x-razorpay-signature', signature)
      .send(payload)
      .expect(200);
    const second = await request(app)
      .post('/api/payments/webhook')
      .set('x-razorpay-signature', signature)
      .send(payload)
      .expect(200);
    expect(second.body.message).toMatch(/already processed/i);
  });
});
