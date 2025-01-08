"use client";

const ApplePayButton = () => {
  const handleApplePay = async () => {
    if (!window.ApplePaySession) {
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
    // NOTE: The ApplePaySession object is part of the Web Payments API
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

  return (
    <button
      onClick={handleApplePay}
      className="apple-pay-button"
    >
    </button>
  );
};

export default ApplePayButton;
