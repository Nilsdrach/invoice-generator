const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_...');

// Supabase Client initialisieren (nur wenn die Variablen gesetzt sind)
let supabase = null;
try {
  const { createClient } = require('@supabase/supabase-js');
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('Supabase Client initialisiert');
  } else {
    console.log('Supabase Environment-Variablen nicht gesetzt');
  }
} catch (error) {
  console.error('Fehler beim Initialisieren von Supabase:', error);
}

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
    const { subscriptionId, userId } = JSON.parse(event.body);

    if (!subscriptionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Subscription ID is required' })
      };
    }

    console.log('Cancelling subscription:', subscriptionId);

    // Prüfe ob es eine Test-ID ist
    if (subscriptionId.startsWith('sub_test_') || subscriptionId.startsWith('stripe_sub_')) {
      console.log('Test subscription detected, simulating cancellation');
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          subscription: {
            id: subscriptionId,
            status: 'active', // Status bleibt "active" - läuft weiter bis zum Ablaufdatum
            cancelAtPeriodEnd: true, // Wird am Ende der Periode gekündigt
            currentPeriodEnd: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 Tage
            cancelAt: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
          }
        })
      };
    }

    // Echte Stripe-API für echte Subscription IDs
    const cancelledSubscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });

    console.log('Subscription cancelled successfully:', cancelledSubscription.id);

    // Wichtig: Subscription auch in der lokalen Datenbank aktualisieren (nur wenn Supabase verfügbar ist)
    if (userId && supabase) {
      try {
        console.log('Versuche Datenbank-Update...');
        const { data: updatedSubscription, error: dbError } = await supabase
          .from('subscriptions')
          .update({
            cancel_at_period_end: true,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('stripe_subscription_id', subscriptionId)
          .select()
          .single();

        if (dbError) {
          console.error('Fehler beim Aktualisieren der Datenbank:', dbError);
        } else {
          console.log('Subscription in Datenbank aktualisiert:', updatedSubscription);
        }
      } catch (dbError) {
        console.error('Fehler beim Aktualisieren der Datenbank:', dbError);
      }
    } else if (!supabase) {
      console.log('Supabase nicht verfügbar, überspringe Datenbank-Update');
    }

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
