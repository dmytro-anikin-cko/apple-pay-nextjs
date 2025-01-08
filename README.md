# Apple Pay Integration with Next.js

This repository demonstrates how to integrate Apple Pay with a Next.js application. It includes serverless API routes for:

- **Merchant Validation** (`/api/validateMerchant`) – for creating Apple Pay payment sessions.
- **Processing Payments** (`/api/processPayment`) – for handling Apple Pay payments via Checkout.com.

The project ensures secure communication with Apple Pay and Checkout.com using certificates and mutual TLS (mTLS).

---

## Features

- Apple Pay button integration with native Web Payments API.
- Serverless API routes for:
  - Validating merchant domains with Apple.
  - Generating Checkout.com tokens from Apple Pay payment tokens.
  - Processing payments using Checkout.com's Payments API.
- Secure handling of Apple Pay certificates and private keys.

---

## Setup and Configuration

### Prerequisites

- **Apple Developer Account**:
  - Create a Merchant ID.
  - Generate an Apple Pay Payment Certificate.
- **Checkout.com Account**:
  - Obtain your API keys and configure your processing channel.
- **Environment Variables**:
  - `SECRET_KEY`: Your Checkout.com secret key.
  - `PROCESSING_CHANNEL_ID`: Your Checkout.com processing channel ID.
  - `APPLE_PAY_CERTIFICATE`: Base64-encoded `.pem` certificate.
  - `APPLE_PAY_KEY`: Base64-encoded `.key` private key.

---

### Steps to Set Up

1. **Merchant ID Creation**:
   - Create a Merchant ID in your Apple Developer Account.
   - This is used to identify your business in Apple Pay transactions.

2. **Generate a Certificate Signing Request (CSR)**:
   - Request a CSR from Checkout.com to link your Merchant ID with Checkout.com.

3. **Generate the Apple Pay Payment Certificate**:
   - Use the CSR to create an Apple Pay Payment Certificate in your Apple Developer Account.

4. **Upload the Certificate to Checkout.com**:
   - Log in to Checkout.com and upload the `.pem` certificate.

5. **Prepare the Certificate and Key**:
   - Encode your `.pem` and `.key` files as Base64:
     ```bash
     base64 certificate.pem > certificate.pem.base64
     base64 private.key > private.key.base64
     ```
   - Save the Base64 strings in your `.env` file.

6. **Deploy the Project**:
   - Use Vercel, Heroku, or another hosting service to deploy the Next.js app.

---

## API Routes

### `/api/validateMerchant`

#### Purpose:
Handles the creation of Apple Pay payment sessions by validating your merchant domain with Apple.

#### How It Works:
1. **Merchant Validation**:
   - Sends a request to Apple's Payment Session API using mutual TLS (mTLS).
   - Requires the `.pem` and `.key` files to authenticate the request.
2. **Response**:
   - Returns a `merchantSession` object, which is required for Apple Pay transactions on the frontend.

#### Key Code:
```javascript
const agent = new https.Agent({
  cert: certificate, // Decoded from APPLE_PAY_CERTIFICATE
  key: privateKey,   // Decoded from APPLE_PAY_KEY
});

const response = await fetch(validationURL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    merchantIdentifier: "your-merchant-id",
    domainName: "your-domain",
    displayName: "Your Business Name",
  }),
  agent, // Secure connection using mTLS
});
```

## Certificate Validation

- Ensure the `.pem` and `.key` files are properly Base64-encoded.
- Decode and validate them before creating the HTTPS Agent.

---

## `/api/processPayment`

### Purpose

Processes Apple Pay payments by:

- Generating a Checkout.com token from the Apple Pay token.
- Using the Checkout.com token to complete the payment.

---

### How It Works

#### Generate Checkout.com Token

- Sends the Apple Pay token to Checkout.com's `/tokens` API.
- Returns a Checkout.com token (`ckoToken`).

#### Create Payment

- Sends the `ckoToken` to Checkout.com's `/payments` API to process the payment.

---

### Key Code

```javascript
// Generate Checkout.com Token
const tokenResponse = await fetch("https://api.sandbox.checkout.com/tokens", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.SECRET_KEY}`,
  },
  body: JSON.stringify(tokenDataPayload),
});

// Process Payment
const paymentResponse = await fetch("https://api.sandbox.checkout.com/payments", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.SECRET_KEY}`,
  },
  body: JSON.stringify({
    source: {
      type: "token",
      token: ckoToken,
    },
    amount: 100, // Amount in cents
    currency: "EUR",
  }),
});
```

## Frontend Integration

### Use the Web Payments API to display the Apple Pay button and handle interactions:

```javascript
const session = new ApplePaySession(3, paymentRequest);
session.begin();
```

## Style the Button

```css
-webkit-appearance: -apple-pay-button;
appearance: none;
width: 200px;
height: 44px;
background-color: black; /* Fallback for non-WebKit browsers */
```

## Certificate Validation and Debugging

### Certificate and Key

- Ensure your `.pem` and `.key` files match.
- Use tools like `openssl` to confirm the certificate's validity:

```bash
openssl x509 -in certificate.pem -text -noout
```

## Debugging in Vercel

- Log Base64-decoded certificates and private keys to confirm their content.
- Test HTTPS agent creation and Apple Pay session requests in isolation.

---

## Acknowledgments

- **Apple Developer Documentation**:
  - [Apple Pay Integration Guide](https://developer.apple.com/apple-pay/)
- **Checkout.com Documentation**:
  - [Apple Pay Tokenization](https://www.checkout.com/docs/payments/add-payment-methods/apple-pay)

