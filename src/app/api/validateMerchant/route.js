import { NextResponse } from "next/server";
import https from "https";

export async function POST(request, response) {
  const { validationURL } = request.body;

  try {
    const certificate = Buffer.from(process.env.APPLE_PAY_CERTIFICATE, "base64").toString("utf8");
    const privateKey = Buffer.from(process.env.APPLE_PAY_KEY, "base64").toString("utf8");
    

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
    return NextResponse.json({ error: "Failed to validate merchant" }, { status: 500 });
  }
}
