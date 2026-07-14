const request = require('supertest');
const { app } = require('../src/app'); // Import the Express app for Supertest

describe('Booking state transitions', () => {
  it('should create a booking and transition to confirmed', async () => {
    // Mock request data; adjust IDs as needed for your DB fixtures or use a test DB
    const createRes = await request(app)
      .post('/api/bookings')
      .send({ listingId: 1, userId: 1 })
      .expect(201);
    const bookingId = createRes.body.id;

    const confirmRes = await request(app)
      .post(`/api/bookings/${bookingId}/confirm`)
      .expect(200);
    expect(confirmRes.body.status).toBe('confirmed');
  });
});
