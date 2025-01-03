import { NextResponse } from "next/server";
import https from "https";
import { Base64 } from "js-base64";

export async function POST(request, response) {
  const { validationURL } = await request.json();

  if (!validationURL || typeof validationURL !== "string") {
    throw new Error("Invalid or missing validationURL");
  }

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
    // const certificate = Base64.decode(certificateEnv).replace(/\n/g, "");
    // const privateKey = Base64.decode(keyEnv).replace(/\n/g, "");

    function decodeBase64(base64String) {
      const binaryData = Buffer.from(base64String, "base64"); // For Node.js
      return new TextDecoder("utf-8").decode(binaryData);
    }
    
    const certificate = decodeBase64(certificateEnv);
    const privateKey = decodeBase64(keyEnv);

    // Log a snippet of the decoded strings for debugging
    console.error(
      "Decoded Certificate (First 100 Chars):",
      certificate.slice(0, 100)
    );
    console.error(
      "Decoded Private Key (First 100 Chars):",
      privateKey.slice(0, 100)
    );

    let agent;
    try {
      agent = new https.Agent({
        cert: certificate,
        key: privateKey,
      });
      console.error("HTTPS Agent created successfully", agent);
    } catch (error) {
      console.error("Error creating HTTPS Agent:", error.message);
      throw error;
    }

    console.error("Validation URL:", validationURL);


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
      { error: error.message || "Failed to validate merchant" },
      { status: 500 }
    );
  }
}
