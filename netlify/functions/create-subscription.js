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
    const { email, name, planId, paymentMethod = 'card' } = JSON.parse(event.body);
    
    // Kunde erstellen oder finden
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1
    });
    
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          planId,
          paymentMethod
        }
      });
    }

    // Preis-ID basierend auf Plan
    let priceId;
    if (planId === 'monthly') {
      priceId = process.env.STRIPE_MONTHLY_PRICE_ID || 'price_monthly_placeholder';
    } else if (planId === 'yearly') {
      priceId = process.env.STRIPE_YEARLY_PRICE_ID || 'price_yearly_placeholder';
    }

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

    // Abonnement erstellen
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      payment_method_types: paymentMethodTypes,
      expand: ['latest_invoice.payment_intent'],
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        customerId: customer.id
      })
    };
    
  } catch (error) {
    console.error('Subscription Fehler:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
