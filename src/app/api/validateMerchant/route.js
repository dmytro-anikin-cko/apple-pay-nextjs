import { NextResponse } from "next/server";
import https from "https";
import fs from "fs";
import path from "path";

export async function POST(request, response) {
  const { validationURL } = request.body;

  try {
    const certPath = path.resolve(process.cwd(), "certs/certificate_sandbox.pem");
    const keyPath = path.resolve(process.cwd(), "certs/certificate_sandbox.key");
    
    const certificate = fs.readFileSync(certPath, "utf8");
    const privateKey = fs.readFileSync(keyPath, "utf8");
    

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
