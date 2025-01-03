import { NextResponse } from "next/server";

export async function POST(request, response) {
  const { applePayToken } = await request.json();

  console.error("ApplePayToken Received:", applePayToken)

  const {
    version,
    data,
    signature,
    header
  } = applePayToken;

  try {
    // Step 1: Generate the CKO token from the Apple Pay token
    const tokenResponse = await fetch(
      "https://api.sandbox.checkout.com/tokens",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SECRET_KEY}`, // Replace with your Checkout.com secret key
        },
        body: JSON.stringify({
          type: "applepay",
          token_data: {
            version: version,
            data: data,
            signature: signature,
            header: {
              ephemeralPublicKey: header.ephemeralPublicKey,
              publicKeyHash: header.publicKeyHash,
              transactionId: header.transactionId
            }
          }
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
        return NextResponse.json({ success: false, error: tokenData }, { status: 400 });
    }

    const ckoToken = tokenData.token;

    console.error("ckoToken", ckoToken)

    // Step 2: Use the CKO token to create a payment
    const paymentResponse = await fetch(
      "https://api.sandbox.checkout.com/payments",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SECRET_KEY}`, // Replace with your Checkout.com secret key
        },
        body: JSON.stringify({
          source: {
            type: "token",
            token: ckoToken,
          },
          amount: 100, // Amount in the smallest currency unit (e.g., cents for USD)
          currency: "EUR", // Adjust currency as needed
          reference: "test-transaction",
          processing_channel_id: process.env.PROCESSING_CHANNEL_ID
        }),
      }
    );

    const paymentData = await paymentResponse.json();

    if (paymentResponse.ok) {
        return NextResponse.json({ success: true, paymentData }, { status: 200 });
      } else {
        return NextResponse.json({ success: false, error: paymentData }, { status: 400 });
      }
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
