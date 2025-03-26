"use client";

const ApplePayButton = () => {
  const handleApplePay = async () => {
    console.log('Apple Pay button clicked');
    
    if (!window.ApplePaySession) {
      console.error('Apple Pay is not supported on this device or browser.');
      alert('Apple Pay is not supported on this device or browser.');
      return;
    }

    // Define the payment request
    const paymentRequest = {
      countryCode: 'ES',
      currencyCode: 'EUR',
      supportedNetworks: ['visa', 'masterCard', 'amex'],
      merchantCapabilities: ['supports3DS', 'supportsCredit', 'supportsDebit'],
      total: {
        label: 'Test Merchant',
        amount: '1.00',
      },
    };

    try {
      // Create an Apple Pay session
      const session = new ApplePaySession(3, paymentRequest);
      console.log('Apple Pay session created');

      // Handle merchant validation
      session.onvalidatemerchant = async (event) => {
        console.log('Validating merchant...');
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
          console.log('Merchant validation successful');
          session.completeMerchantValidation(merchantSession);
        } catch (error) {
          console.error('Merchant validation failed:', error);
          session.abort();
        }
      };

      // Handle payment authorization
      session.onpaymentauthorized = async (event) => {
        console.log('Payment authorized');
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

      // Handle errors
      session.oncancel = (event) => {
        console.log('Apple Pay session cancelled');
      };

      // Start the Apple Pay session with QR code support
      console.log('Starting Apple Pay session...');
      session.begin();
    } catch (error) {
      console.error('Error creating Apple Pay session:', error);
      alert('Error initializing Apple Pay. Please try again.');
    }
  };

  return (
    <button
      onClick={handleApplePay}
      className="apple-pay-button"
      style={{
        backgroundColor: '#000',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        padding: '10px 20px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.41-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.41C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.05 2.31-.75 3.57-.84 1.51-.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="currentColor"/>
      </svg>
      Pay with Apple Pay
    </button>
  );
};

export default ApplePayButton;
