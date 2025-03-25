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

    // Check if Apple Pay is available
    const canMakePayments = ApplePaySession.canMakePayments();
    console.log('Can make payments:', canMakePayments);
    
    if (!canMakePayments) {
      console.error('Apple Pay is not available on this device.');
      alert('Apple Pay is not available on this device.');
      return;
    }

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

      // Start the Apple Pay session
      console.log('Starting Apple Pay session...');
      session.begin();
    } catch (error) {
      console.error('Error creating Apple Pay session:', error);
      alert('Error initializing Apple Pay. Please try again.');
    }
  };

  return (
    <apple-pay-button
      buttonstyle="black"
      type="plain"
      locale="en"
      onClick={handleApplePay}
    />
  );
};

export default ApplePayButton;
