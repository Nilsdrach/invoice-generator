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
    const sig = event.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let stripeEvent;

    try {
      stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Webhook signature verification failed' })
      };
    }

    // Handle the event
    switch (stripeEvent.type) {
      case 'customer.subscription.created':
        const subscriptionCreated = stripeEvent.data.object;
        console.log('Subscription created:', subscriptionCreated.id);
        // Hier könntest du die Subscription in deiner Datenbank aktualisieren
        break;

      case 'customer.subscription.updated':
        const subscriptionUpdated = stripeEvent.data.object;
        console.log('Subscription updated:', subscriptionUpdated.id);
        // Hier könntest du die Subscription in deiner Datenbank aktualisieren
        break;

      case 'customer.subscription.deleted':
        const subscriptionDeleted = stripeEvent.data.object;
        console.log('Subscription deleted:', subscriptionDeleted.id);
        // Hier könntest du die Subscription in deiner Datenbank als gelöscht markieren
        break;

      case 'invoice.payment_succeeded':
        const invoicePaymentSucceeded = stripeEvent.data.object;
        console.log('Invoice payment succeeded:', invoicePaymentSucceeded.id);
        // Hier könntest du die Zahlung bestätigen
        break;

      case 'invoice.payment_failed':
        const invoicePaymentFailed = stripeEvent.data.object;
        console.log('Invoice payment failed:', invoicePaymentFailed.id);
        // Hier könntest du die Zahlung als fehlgeschlagen markieren
        break;

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };

  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Webhook processing failed' })
    };
  }
};

