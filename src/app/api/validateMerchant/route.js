import { NextResponse } from "next/server";
import https from "https";

export async function POST(request, response) {
  const { validationURL } = request.body;

  try {
    console.error("Certificate Exists:", Boolean(process.env.APPLE_PAY_CERTIFICATE));
    console.error("Key Exists:", Boolean(process.env.APPLE_PAY_KEY));
    const certificateEnv = process.env.APPLE_PAY_CERTIFICATE;
    const keyEnv = process.env.APPLE_PAY_KEY;

    if (!certificateEnv || !keyEnv) {
      throw new Error(
        "Missing Apple Pay certificate or key in environment variables"
      );
    }

    const certificate = Buffer.from(certificateEnv, "base64").toString("utf8");
    const privateKey = Buffer.from(keyEnv, "base64").toString("utf8");

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
