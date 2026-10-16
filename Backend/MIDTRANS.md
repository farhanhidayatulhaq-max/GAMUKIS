# Midtrans membership payments

Paid membership plans use Midtrans Snap. The backend creates a Snap transaction after inserting a pending membership and stores the generated order ID in `memberships.payment_ref`. The frontend redirects to the returned `paymentUrl`; membership is activated only after a valid Midtrans notification reaches the backend.

## Configuration

Set these values in the backend environment (do not commit a real key):

```env
MIDTRANS_SERVER_KEY=your-sandbox-server-key
MIDTRANS_IS_PRODUCTION=false
FRONTEND_URL=http://localhost:3000
```

For production, set `MIDTRANS_IS_PRODUCTION=true` and use the production Server Key. The default is sandbox mode. Restart the backend after changing environment values.

Configure the Midtrans payment notification URL to:

```text
https://<public-backend-host>/api/memberships/notifications/midtrans
```

The endpoint validates Midtrans' signature, checks the amount against the stored plan price, and handles duplicate notifications idempotently. The browser return URL is only for navigation; it does not confirm payment.

## Local verification

The automated backend tests use mocked HTTP responses and notification signatures:

```sh
cd Backend
npm test
```

A real sandbox checkout requires a Midtrans sandbox account, its Server Key in the backend environment, and a publicly reachable notification URL (for example through a developer tunnel). Never expose the Server Key to the frontend.
