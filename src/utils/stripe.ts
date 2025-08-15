import { loadStripe } from '@stripe/stripe-js';

// Stripe Publishable Key (Test-Modus)
export const stripePromise = loadStripe('pk_test_51RwQ40BdLY4NC8JCYorm7BH1FbjaKA9CnDVx37qrp9U30VtCBRuczUR4njdqoJ3XE4FZb7vNFYnIVQryz8cISQK900gQoW9Ocs');

// Stripe-Konfiguration
export const STRIPE_CONFIG = {
  currency: 'eur',
  paymentMethods: ['card', 'sepa_debit', 'sofort'],
  supportedCountries: ['DE', 'AT', 'CH'],
};
