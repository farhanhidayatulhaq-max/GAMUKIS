const getMidtransConfig = (env = process.env) => {
  const serverKey = String(env.MIDTRANS_SERVER_KEY || '').trim();
  if (!serverKey) throw new Error('Midtrans belum dikonfigurasi (MIDTRANS_SERVER_KEY).');
  const isProduction = String(env.MIDTRANS_IS_PRODUCTION || '').toLowerCase() === 'true';
  return {
    serverKey,
    snapUrl: isProduction
      ? 'https://app.midtrans.com/snap/v1/transactions'
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions'
  };
};

const createMidtransTransaction = async ({ membershipId, amount, email }, {
  env = process.env,
  fetchImpl = global.fetch
} = {}) => {
  if (!Number.isInteger(Number(membershipId)) || Number(membershipId) < 1) {
    throw new Error('ID membership untuk transaksi tidak valid.');
  }
  if (!Number.isInteger(Number(amount)) || Number(amount) < 1) {
    throw new Error('Nilai transaksi membership tidak valid.');
  }
  if (typeof fetchImpl !== 'function') throw new Error('HTTP client Midtrans tidak tersedia.');

  const { serverKey, snapUrl } = getMidtransConfig(env);
  const orderId = `gamukis-membership-${membershipId}`;
  const response = await fetchImpl(snapUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`
    },
    body: JSON.stringify({
      transaction_details: { order_id: orderId, gross_amount: Number(amount) },
      callbacks: {
        finish: `${String(env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '')}/membership/dashboard?payment=returned`
      },
      ...(email ? { customer_details: { email: String(email).slice(0, 255) } } : {})
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.token || !data.redirect_url) {
    const error = new Error('Midtrans gagal membuat halaman pembayaran.');
    error.status = response.status;
    throw error;
  }
  return { orderId, token: data.token, paymentUrl: data.redirect_url };
};

module.exports = { createMidtransTransaction, getMidtransConfig };
