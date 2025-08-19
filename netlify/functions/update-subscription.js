const { createClient } = require('@supabase/supabase-js');

// Supabase Client initialisieren
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

exports.handler = async (event, context) => {
  // CORS Headers
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { subscriptionId, cancelAtPeriodEnd, status } = JSON.parse(event.body);

    if (!subscriptionId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Subscription ID ist erforderlich' })
      };
    }

    // Subscription in der Datenbank aktualisieren
    const { data, error } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: cancelAtPeriodEnd,
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      console.error('Fehler beim Aktualisieren der Subscription:', error);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Fehler beim Aktualisieren der Subscription' })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        subscription: data
      })
    };

  } catch (error) {
    console.error('Fehler in update-subscription:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Interner Server-Fehler' })
    };
  }
};
