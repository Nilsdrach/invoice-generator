const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { subscriptionId } = JSON.parse(event.body);

    if (!subscriptionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Subscription ID is required' })
      };
    }

    console.log('Cancelling subscription:', subscriptionId);

    // Kündige das Abo zum Ende der aktuellen Periode
    const cancelledSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });

    console.log('Subscription cancelled successfully:', cancelledSubscription.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        subscription: {
          id: cancelledSubscription.id,
          status: cancelledSubscription.status,
          cancelAtPeriodEnd: cancelledSubscription.cancel_at_period_end,
          currentPeriodEnd: cancelledSubscription.current_period_end,
          cancelAt: cancelledSubscription.cancel_at
        }
      })
    };

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to cancel subscription',
        details: error.message,
        type: error.type,
        code: error.code
      })
    };
  }
};

