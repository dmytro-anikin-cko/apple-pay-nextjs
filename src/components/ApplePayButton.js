"use client";
import { useEffect, useState } from "react";
import Script from 'next/script';

const ApplePayButton = () => {
  const [isApplePayAvailable, setIsApplePayAvailable] = useState(false);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  useEffect(() => {
    // Check if we're in the browser and if Apple Pay is supported
    if (typeof window !== 'undefined') {
      const applePayAvailable = window.ApplePaySession && ApplePaySession.canMakePayments();
      setIsApplePayAvailable(applePayAvailable);
    }
  }, []);

  // Handler for when the Apple Pay SDK script loads
  const handleSDKLoad = () => {
    setIsSDKLoaded(true);
    console.log("Apple Pay SDK loaded successfully");
  };

  const handleApplePay = async () => {
    if (typeof window === 'undefined' || !window.ApplePaySession) {
      alert('Apple Pay is not supported on this device or browser.');
      return;
    }

    // Define the payment request
    const paymentRequest = {
      countryCode: 'ES',
      currencyCode: 'EUR',
      supportedNetworks: ['visa', 'masterCard', 'amex'],
      merchantCapabilities: ['supports3DS'],
      total: {
        label: 'Test Merchant',
        amount: '1.00',
      },
    };

    // Check if Apple Pay is available
    if (!ApplePaySession.canMakePayments()) {
      alert('Apple Pay is not available on this device.');
      return;
    }

    // Create an Apple Pay session
    const session = new ApplePaySession(3, paymentRequest);

    // Handle merchant validation
    session.onvalidatemerchant = async (event) => {
      const validationURL = event.validationURL;

      try {
        const response = await fetch('/api/validateMerchant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ validationURL }),
        });
        const merchantSession = await response.json();
        session.completeMerchantValidation(merchantSession);
      } catch (error) {
        console.error('Merchant validation failed:', error);
        session.abort();
      }
    };

    // Handle payment authorization
    session.onpaymentauthorized = async (event) => {
      const applePayToken = event.payment.token.paymentData;
      console.log("ApplePayToken:", applePayToken);
      
      try {
        const response = await fetch('/api/processPayment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ applePayToken }),
        });

        const result = await response.json();

        if (result.success) {
          session.completePayment(ApplePaySession.STATUS_SUCCESS);
          alert('Payment successful!');
        } else {
          session.completePayment(ApplePaySession.STATUS_FAILURE);
          alert('Payment failed.');
        }
      } catch (error) {
        console.error('Payment processing failed:', error);
        session.completePayment(ApplePaySession.STATUS_FAILURE);
      }
    };

    // Start the Apple Pay session
    session.begin();
  };

  if (!isApplePayAvailable) {
    return <div>Apple Pay is not supported on this device or browser.</div>;
  }

  return (
    <>
      {/* Load the Apple Pay SDK directly in the component */}
      <Script
        id="apple-pay-sdk"
        src="https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js"
        onLoad={handleSDKLoad}
        strategy="afterInteractive"
      />
      
      {/* Custom element approach */}
      <div style={{ minHeight: '40px', minWidth: '140px' }}>
        {isSDKLoaded && (
          // @ts-ignore - TypeScript might not recognize this custom element
          <apple-pay-button 
            buttonstyle="black" 
            type="buy" 
            locale="en"
            onClick={handleApplePay}
          ></apple-pay-button>
        )}
      </div>
      
      {/* Fallback if element doesn't render properly */}
      <style jsx global>{`
        apple-pay-button {
          display: inline-block;
          -webkit-appearance: -apple-pay-button;
          -apple-pay-button-type: buy;
          -apple-pay-button-style: black;
          height: 40px;
          min-width: 140px;
          cursor: pointer;
        }
      `}</style>
    </>
  );
};

export default ApplePayButton;