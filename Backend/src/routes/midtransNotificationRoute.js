const express = require('express');
const MembershipModel = require('../models/membershipModel');
const { verifyNotificationSignature, notificationOutcome } = require('../services/midtransNotification');

const router = express.Router();

router.post('/', async (req, res) => {
  const serverKey = String(process.env.MIDTRANS_SERVER_KEY || '').trim();
  const notification = req.body || {};
  if (!serverKey) return res.status(503).json({ message: 'Notifikasi pembayaran belum dikonfigurasi.' });
  if (!verifyNotificationSignature(notification, serverKey)) {
    return res.status(401).json({ message: 'Signature notifikasi tidak valid.' });
  }

  const amount = Number(notification.gross_amount);
  if (!Number.isFinite(amount) || amount <= 0 || !/^gamukis-membership-\d+$/.test(String(notification.order_id || ''))) {
    return res.status(400).json({ message: 'Notifikasi transaksi tidak valid.' });
  }

  try {
    const membership = await MembershipModel.getMembershipByPaymentRef(notification.order_id);
    if (!membership) return res.json({ received: true, ignored: true });
    if (amount !== Number(membership.price)) {
      return res.status(400).json({ message: 'Nominal notifikasi tidak sesuai dengan pesanan.' });
    }
    if (membership.status !== 'pending') return res.json({ received: true, duplicate: true });

    const outcome = notificationOutcome(notification);
    if (outcome === 'paid') {
      const activated = await MembershipModel.activate(membership.membershipId, {
        paymentRef: String(notification.transaction_id || notification.order_id).slice(0, 100)
      });
      if (!activated) return res.json({ received: true, duplicate: true });
    } else if (outcome === 'failed') {
      await MembershipModel.cancelPendingByPaymentRef(notification.order_id);
    }
    return res.json({ received: true });
  } catch (error) {
    console.error('Midtrans notification processing error:', error.message);
    return res.status(500).json({ message: 'Notifikasi pembayaran belum dapat diproses.' });
  }
});

module.exports = router;
