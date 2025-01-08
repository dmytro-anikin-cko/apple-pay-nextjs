import { NextResponse } from "next/server";

export async function POST(request, response) {
  const { applePayToken } = await request.json();
  const { version, data, signature, header } = applePayToken;

  try {
    // console.error("PUBLIC_KEY Exists:", Boolean(process.env.PUBLIC_KEY));

    // Construct the token_data payload
    const tokenDataPayload = {
      type: "applepay",
      token_data: {
        version,
        data,
        signature,
        header: {
          ephemeralPublicKey: header.ephemeralPublicKey,
          publicKeyHash: header.publicKeyHash,
          transactionId: header.transactionId,
        },
      },
    };

    // Log the payload
    // console.error("Constructed Token Data Payload:", JSON.stringify(tokenDataPayload, null, 2));

    // Step 1: Generate the CKO token from the Apple Pay token
    const tokenResponse = await fetch(
      "https://api.sandbox.checkout.com/tokens",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.PUBLIC_KEY}`, // Replace with your Checkout.com secret key
        },
        body: JSON.stringify(tokenDataPayload),
      }
    );

    // Log the raw response
    const tokenResponseText = await tokenResponse.text();
    // console.error("Raw Token Response:", tokenResponseText);

    // Attempt to parse JSON
    let tokenData;
    try {
      tokenData = JSON.parse(tokenResponseText);
    } catch (error) {
      console.error("Error parsing token response:", error.message);
      return NextResponse.json({ error: "Invalid token response format" }, { status: 500 });
    }

    if (!tokenResponse.ok) {
      console.error("Token Request Failed:", tokenData);
      return NextResponse.json({ success: false, error: tokenData }, { status: 400 });
    }

    const ckoToken = tokenData.token;
    console.error("CKO Token:", ckoToken);

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
