const crypto = require('node:crypto');

const makeNotificationSignature = ({ order_id: orderId, status_code: statusCode, gross_amount: grossAmount }, serverKey) =>
  crypto.createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest('hex');

const verifyNotificationSignature = (notification, serverKey) => {
  if (!serverKey || !notification?.signature_key || !notification?.order_id
    || !notification?.status_code || notification?.gross_amount === undefined) return false;
  const expected = Buffer.from(makeNotificationSignature(notification, serverKey), 'hex');
  let actual;
  try {
    actual = Buffer.from(String(notification.signature_key), 'hex');
  } catch (error) {
    return false;
  }
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
};

const notificationOutcome = (notification = {}) => {
  const status = String(notification.transaction_status || '').toLowerCase();
  if (status === 'settlement') return 'paid';
  if (status === 'capture') {
    return String(notification.fraud_status || '').toLowerCase() === 'accept' ? 'paid' : 'pending';
  }
  if (['deny', 'cancel', 'expire', 'failure'].includes(status)) return 'failed';
  return 'pending';
};

module.exports = { makeNotificationSignature, notificationOutcome, verifyNotificationSignature };
