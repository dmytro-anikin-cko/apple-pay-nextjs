import { NextResponse } from "next/server";
import https from "https";

export async function POST(request) {
  const { validationURL } = await request.json();

  if (!validationURL || typeof validationURL !== "string") {
    throw new Error("Invalid or missing validationURL");
  }

  try {
    // console.error("Certificate Exists:", Boolean(process.env.APPLE_PAY_CERTIFICATE));
    // console.error("Key Exists:", Boolean(process.env.APPLE_PAY_KEY));

    const certificateEnv = process.env.APPLE_PAY_CERTIFICATE;
    const keyEnv = process.env.APPLE_PAY_KEY;

    if (!certificateEnv || !keyEnv) {
      throw new Error("Missing Apple Pay certificate or key in environment variables");
    }

    // Decoding Certificates from Base64 to UTF-8
    function decodeBase64(base64String) {
      const binaryData = Buffer.from(base64String, "base64");
      return new TextDecoder("utf-8").decode(binaryData);
    }

    const certificate = decodeBase64(certificateEnv);
    const privateKey = decodeBase64(keyEnv);

    // console.error("Decoded Certificate:", certificate);
    // console.error("Decoded Private Key:", privateKey);

    const agent = new https.Agent({
      cert: certificate,
      key: privateKey,
    });

    const postData = JSON.stringify({
      merchantIdentifier: "merchant.app.vercel.apple-pay-nextjs.sandbox",
      domainName: "apple-pay-nextjs.vercel.app",
      displayName: "merchant id for test environment",
    });

    const options = {
      hostname: new URL(validationURL).hostname,
      path: new URL(validationURL).pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
      agent, // Attach the HTTPS agent with cert and key
    };

    console.error("HTTPS Request Options:", options);

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            console.error("HTTPS Response Data:", data);
            const merchantSession = JSON.parse(data);
            resolve(NextResponse.json(merchantSession, { status: res.statusCode }));
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on("error", (error) => {
        console.error("HTTPS Request Error:", error);
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.write(postData); // Send the POST data
      req.end(); // End the request
    });
  } catch (error) {
    console.error("Merchant validation failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to validate merchant" },
      { status: 500 }
    );
  }
}