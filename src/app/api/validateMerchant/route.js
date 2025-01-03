import { NextResponse } from "next/server";
import https from "https";
import { Base64 } from "js-base64";

export async function POST(request, response) {
  const { validationURL } = request.body;

  try {
    console.error(
      "Certificate Exists:",
      Boolean(process.env.APPLE_PAY_CERTIFICATE)
    );
    console.error("Key Exists:", Boolean(process.env.APPLE_PAY_KEY));
 
    const certificateEnv = process.env.APPLE_PAY_CERTIFICATE;
    const keyEnv = process.env.APPLE_PAY_KEY;


    if (!certificateEnv || !keyEnv) {
      throw new Error(
        "Missing Apple Pay certificate or key in environment variables"
      );
    }

    // Decode Base64 strings using js-base64
    const certificate = Base64.decode(certificateEnv);
    const privateKey = Base64.decode(keyEnv);

    // Log a snippet of the decoded strings for debugging
    console.error("Decoded Certificate (First 100 Chars):", certificate.slice(0, 100));
    console.error("Decoded Private Key (First 100 Chars):", privateKey.slice(0, 100));

    const agent = new https.Agent({
      cert: certificate,
      key: privateKey,
    });

    const response = await fetch(validationURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        merchantIdentifier: "merchant.app.vercel.apple-pay-nextjs.sandbox",
        domainName: "apple-pay-nextjs.vercel.app",
        displayName: "merchant id for test environment",
      }),
      agent,
    });

    const merchantSession = await response.json();
    return NextResponse.json(merchantSession, { status: 200 });
  } catch (error) {
    console.error("Merchant validation failed:", error);
    return NextResponse.json(
      { error: "Failed to validate merchant" },
      { status: 500 }
    );
  }
}
