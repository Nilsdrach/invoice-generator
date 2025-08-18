exports.handler = async function(event, context) {
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

    console.log('Test: Cancelling subscription:', subscriptionId);

    // Simuliere erfolgreiche Kündigung für Test-Zwecke
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        subscription: {
          id: subscriptionId,
          status: 'active',
          cancelAtPeriodEnd: true,
          currentPeriodEnd: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 Tage von jetzt
          cancelAt: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
        }
      })
    };

  } catch (error) {
    console.error('Test Error cancelling subscription:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Test: Failed to cancel subscription',
        details: error.message
      })
    };
  }
};


