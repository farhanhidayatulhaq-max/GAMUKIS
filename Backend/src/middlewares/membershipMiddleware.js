const MembershipModel = require('../models/membershipModel');

/**
 * Batasi endpoint berdasarkan fitur paket membership.
 * Contoh: router.get('/report', requireFeature('studentAnalytics'), handler)
 * Wajib dipasang setelah authenticateAny. Administrator selalu lolos.
 */
const requireFeature = (feature) => async (req, res, next) => {
  if (!req.account) return res.status(401).json({ message: 'Token login diperlukan.' });
  try {
    if (await MembershipModel.hasFeature(req.account, feature)) return next();
    return res.status(402).json({
      message: 'Fitur ini memerlukan paket membership yang lebih tinggi.',
      feature
    });
  } catch (error) {
    console.error('Membership feature check error:', error);
    return res.status(500).json({ message: 'Gagal memeriksa membership.' });
  }
};

module.exports = { requireFeature };
