const test = require('node:test');
const assert = require('node:assert/strict');
const { createMidtransTransaction, getMidtransConfig } = require('../src/services/midtransService');
const {
  makeNotificationSignature,
  notificationOutcome,
  verifyNotificationSignature
} = require('../src/services/midtransNotification');

test('Midtrans uses sandbox by default and never accepts a missing server key', () => {
  assert.equal(getMidtransConfig({ MIDTRANS_SERVER_KEY: 'test-key' }).snapUrl,
    'https://app.sandbox.midtrans.com/snap/v1/transactions');
  assert.equal(getMidtransConfig({ MIDTRANS_SERVER_KEY: 'prod-key', MIDTRANS_IS_PRODUCTION: 'true' }).snapUrl,
    'https://app.midtrans.com/snap/v1/transactions');
  assert.throws(() => getMidtransConfig({}), /MIDTRANS_SERVER_KEY/);
});

test('Midtrans creates a server-side Snap transaction and returns only the checkout details', async () => {
  let request;
  const result = await createMidtransTransaction({ membershipId: 7, amount: 99000, email: 'guru@example.test' }, {
    env: { MIDTRANS_SERVER_KEY: 'sandbox-secret' },
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, status: 201, json: async () => ({ token: 'snap-token', redirect_url: 'https://pay.example.test/snap' }) };
    }
  });

  assert.equal(request.url, 'https://app.sandbox.midtrans.com/snap/v1/transactions');
  assert.equal(request.options.headers.Authorization, `Basic ${Buffer.from('sandbox-secret:').toString('base64')}`);
  assert.deepEqual(JSON.parse(request.options.body), {
    transaction_details: { order_id: 'gamukis-membership-7', gross_amount: 99000 },
    callbacks: { finish: 'http://localhost:3000/membership/dashboard?payment=returned' },
    customer_details: { email: 'guru@example.test' }
  });
  assert.deepEqual(result, {
    orderId: 'gamukis-membership-7', token: 'snap-token', paymentUrl: 'https://pay.example.test/snap'
  });
});

test('Midtrans refuses invalid amounts and safely reports API errors', async () => {
  await assert.rejects(() => createMidtransTransaction({ membershipId: 1, amount: 0 }, {
    env: { MIDTRANS_SERVER_KEY: 'key' }, fetchImpl: async () => { throw new Error('must not be called'); }
  }), /Nilai transaksi/);
  await assert.rejects(() => createMidtransTransaction({ membershipId: 1, amount: 1000 }, {
    env: { MIDTRANS_SERVER_KEY: 'key' },
    fetchImpl: async () => ({ ok: false, status: 401, json: async () => ({ message: 'secret detail omitted' }) })
  }), (error) => error.message === 'Midtrans gagal membuat halaman pembayaran.' && error.status === 401);
});

test('Midtrans notification signatures are checked and payment outcomes are classified safely', () => {
  const notification = {
    order_id: 'gamukis-membership-7', status_code: '200', gross_amount: '99000.00',
    transaction_status: 'settlement'
  };
  notification.signature_key = makeNotificationSignature(notification, 'sandbox-secret');
  assert.equal(verifyNotificationSignature(notification, 'sandbox-secret'), true);
  assert.equal(verifyNotificationSignature(notification, 'wrong-key'), false);
  assert.equal(verifyNotificationSignature({ ...notification, gross_amount: '1.00' }, 'sandbox-secret'), false);
  assert.equal(notificationOutcome(notification), 'paid');
  assert.equal(notificationOutcome({ transaction_status: 'capture', fraud_status: 'challenge' }), 'pending');
  assert.equal(notificationOutcome({ transaction_status: 'capture', fraud_status: 'accept' }), 'paid');
  assert.equal(notificationOutcome({ transaction_status: 'expire' }), 'failed');
});
