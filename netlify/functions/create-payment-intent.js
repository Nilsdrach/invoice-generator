const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { amount, currency = 'eur', planId, paymentMethod = 'card' } = JSON.parse(event.body);
    
    // Payment method types basierend auf Auswahl
    let paymentMethodTypes = ['card'];
    
    switch (paymentMethod) {
      case 'paypal':
        paymentMethodTypes = ['paypal'];
        break;
      case 'applepay':
        paymentMethodTypes = ['card', 'apple_pay'];
        break;
      case 'googlepay':
        paymentMethodTypes = ['card', 'google_pay'];
        break;
      case 'sepa':
        paymentMethodTypes = ['sepa_debit'];
        break;
      default:
        paymentMethodTypes = ['card'];
    }
    
    // Payment Intent erstellen
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe erwartet Cents
      currency,
      payment_method_types: paymentMethodTypes,
      metadata: {
        planId,
        planType: planId === 'single' ? 'one-time' : 'subscription',
        paymentMethod
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      })
    };
    
  } catch (error) {
    console.error('Payment Intent Fehler:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
