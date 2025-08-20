const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_...');

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
    console.log('Function started with event:', {
      httpMethod: event.httpMethod,
      path: event.path,
      body: event.body,
      headers: event.headers
    });

    // Check if Stripe key is available
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.error('STRIPE_SECRET_KEY not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Stripe configuration missing',
          details: 'STRIPE_SECRET_KEY environment variable not set'
        })
      };
    }

    console.log('Stripe key found, length:', stripeKey.length);
    console.log('Stripe key starts with:', stripeKey.substring(0, 7));

    // Parse request body safely
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
      console.log('Request body parsed successfully:', requestBody);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError.message 
        })
      };
    }

    const { priceId, successUrl, cancelUrl } = requestBody;

    if (!priceId) {
      console.error('Price ID missing from request');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Price ID is required' })
      };
    }

    console.log('Creating checkout session with:', { priceId, successUrl, cancelUrl });

    // Validate price ID format
    if (!priceId.startsWith('price_')) {
      console.error('Invalid price ID format:', priceId);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid price ID format',
          details: 'Price ID must start with "price_"'
        })
      };
    }

    // Test Stripe connection first
    try {
      console.log('Testing Stripe connection...');
      const testAccount = await stripe.accounts.retrieve();
      console.log('Stripe connection successful, account:', testAccount.id);
    } catch (stripeError) {
      console.error('Stripe connection test failed:', stripeError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Stripe connection failed',
          details: stripeError.message,
          type: stripeError.type || 'unknown'
        })
      };
    }

    // Create Stripe Checkout Session
    console.log('Creating Stripe checkout session...');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'paypal', 'giropay', 'link'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${process.env.URL || 'http://localhost:8888'}?success=true`,
      cancel_url: cancelUrl || `${process.env.URL || 'http://localhost:8888'}?canceled=true`,
      allow_promotion_codes: true,
      payment_method_collection: 'always',
    });

    console.log('Checkout session created successfully:', session.id);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        sessionId: session.id,
        url: session.url
      })
    };

  } catch (error) {
    console.error('Error creating checkout session:', error);
    console.error('Error stack:', error.stack);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create checkout session';
    let errorDetails = error.message;
    
    if (error.type === 'StripeCardError') {
      errorMessage = 'Kreditkartenfehler';
    } else if (error.type === 'StripeInvalidRequestError') {
      errorMessage = 'Ungültige Anfrage';
    } else if (error.type === 'StripeAPIError') {
      errorMessage = 'Stripe API Fehler';
    } else if (error.type === 'StripeAuthenticationError') {
      errorMessage = 'Stripe Authentifizierungsfehler';
    } else if (error.type === 'StripePermissionError') {
      errorMessage = 'Stripe Berechtigungsfehler';
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
        type: error.type || 'unknown',
        stack: error.stack
      })
    };
  }
};
