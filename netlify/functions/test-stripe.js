const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_...');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    console.log('Testing Stripe connection...');
    
    // Check if Stripe key is available
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'STRIPE_SECRET_KEY not set',
          message: 'Stripe environment variable is missing'
        })
      };
    }

    // Test Stripe connection
    const account = await stripe.accounts.retrieve();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Stripe connection successful!',
        accountId: account.id,
        stripeKeyLength: stripeKey.length,
        stripeKeyPrefix: stripeKey.substring(0, 7),
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Stripe test failed:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Stripe connection failed',
        details: error.message,
        type: error.type || 'unknown',
        timestamp: new Date().toISOString()
      })
    };
  }
};
