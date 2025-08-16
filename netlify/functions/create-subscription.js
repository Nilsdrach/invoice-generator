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
    console.log('Function gestartet mit Event:', JSON.stringify(event, null, 2));
    console.log('Environment Variables:', {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'SET' : 'MISSING',
      STRIPE_MONTHLY_PRICE_ID: process.env.STRIPE_MONTHLY_PRICE_ID || 'MISSING',
      STRIPE_YEARLY_PRICE_ID: process.env.STRIPE_YEARLY_PRICE_ID || 'MISSING'
    });

    const { email, name, planId, paymentMethod = 'card' } = JSON.parse(event.body);
    console.log('Request Body:', { email, name, planId, paymentMethod });
    
    // Kunde erstellen oder finden
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1
    });
    
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log('Existierender Kunde gefunden:', customer.id);
    } else {
      customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          planId,
          paymentMethod
        }
      });
      console.log('Neuer Kunde erstellt:', customer.id);
    }

    // Preis-ID basierend auf Plan
    let priceId;
    if (planId === 'monthly') {
      priceId = process.env.STRIPE_MONTHLY_PRICE_ID || 'price_monthly_placeholder';
    } else if (planId === 'yearly') {
      priceId = process.env.STRIPE_YEARLY_PRICE_ID || 'price_yearly_placeholder';
    }
    console.log('Verwendete Price ID:', priceId);

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
    console.log('Payment Method Types:', paymentMethodTypes);

    // Abonnement erstellen
    console.log('Erstelle Abonnement...');
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      payment_method_types: paymentMethodTypes,
      expand: ['latest_invoice'],
    });
    console.log('Abonnement erstellt:', subscription.id);

    // Payment Intent für die erste Zahlung erstellen
    console.log('Erstelle Payment Intent...');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: subscription.latest_invoice.amount_due,
      currency: subscription.latest_invoice.currency,
      customer: customer.id,
      payment_method_types: paymentMethodTypes,
      metadata: {
        subscriptionId: subscription.id,
        planId: planId
      }
    });
    console.log('Payment Intent erstellt:', paymentIntent.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
        customerId: customer.id
      })
    };
    
  } catch (error) {
    console.error('Subscription Fehler Details:', {
      message: error.message,
      stack: error.stack,
      type: error.type,
      code: error.code
    });
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        details: error.type || 'Unknown error',
        code: error.code || 'NO_CODE'
      })
    };
  }
};
