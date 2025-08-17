import React, { useState, useEffect } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { SubscriptionPlan, PricingPlan, getPlanById } from '../types/subscription';
import { CreditCard, Lock, Shield, CheckCircle, AlertCircle, Loader2, CreditCard as PayPalIcon, Smartphone, Building2 } from 'lucide-react';

// Stripe-Konfiguration
const stripePromise = loadStripe('pk_test_51RwQ40BdLY4NC8JCYorm7BH1FbjaKA9CnDVx37qrp9U30VtCBRuczUR4njdqoJ3XE4FZb7vNFYnIVQryz8cISQK900gQoW9Ocs');

interface StripePaymentProps {
  selectedPlan: SubscriptionPlan;
  onPaymentSuccess: (paymentData?: { email: string; name: string; stripeSubscriptionId?: string }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

// Stripe Card Element Styling
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      ':-webkit-autofill': {
        color: '#fce883',
      },
    },
    invalid: {
      iconColor: '#9e2146',
      color: '#9e2146',
    },
  },
};

// Payment Form Component
const PaymentForm: React.FC<StripePaymentProps> = ({
  selectedPlan,
  onPaymentSuccess,
  onCancel,
  isLoading = false
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'applepay' | 'googlepay' | 'sepa'>('card');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [iban, setIban] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [processing, setProcessing] = useState(false);

  const plan = getPlanById(selectedPlan);
  if (!plan) return null;

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!email.trim()) newErrors.email = 'E-Mail ist erforderlich';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Ungültige E-Mail-Adresse';
    
    if (!name.trim()) newErrors.name = 'Name ist erforderlich';
    else if (name.trim().length < 2) newErrors.name = 'Name muss mindestens 2 Zeichen lang sein';
    
    if (paymentMethod === 'sepa' && !iban.trim()) {
      newErrors.iban = 'IBAN ist erforderlich';
    } else if (paymentMethod === 'sepa' && iban.trim()) {
      // Einfache IBAN-Validierung (DE + 20 Ziffern)
      const ibanRegex = /^DE[0-9]{20}$/;
      if (!ibanRegex.test(iban.replace(/\s/g, '').toUpperCase())) {
        newErrors.iban = 'Ungültige IBAN (DE + 20 Ziffern)';
      }
    }
    
    if (!acceptTerms) newErrors.terms = 'Sie müssen die AGB akzeptieren';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!stripe || !elements) return;

    setProcessing(true);

    try {
      // Stripe-Integration über Netlify Functions
      
      if (selectedPlan === 'single') {
        // Einmalzahlung: Payment Intent erstellen
        const response = await fetch('/.netlify/functions/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: 1.99,
            currency: 'eur',
            planId: 'single',
            paymentMethod: paymentMethod
          }),
        });
        
        if (!response.ok) {
          throw new Error('Payment Intent konnte nicht erstellt werden');
        }
        
        const data = await response.json();
        const clientSecret = data.clientSecret;
        
        // Stripe Payment bestätigen - nur für Kreditkarten
        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: {
              name,
              email,
            },
          }
        });

        if (result?.error) {
          throw new Error(result.error.message);
        }
        
        if (result.paymentIntent) {
          // Einmalzahlung erfolgreich
          onPaymentSuccess({
            email: email,
            name: name
          });
        }
        
      } else {
        // Abonnement: Subscription erstellen
        const response = await fetch('/.netlify/functions/create-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            name,
            planId: selectedPlan,
            paymentMethod: paymentMethod
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Netlify Function Fehler:', errorData);
          throw new Error(`Abonnement konnte nicht erstellt werden: ${errorData.error || errorData.details || 'Unbekannter Fehler'}`);
        }
        
        const data = await response.json();
        const clientSecret = data.clientSecret;
        
        // Stripe Payment bestätigen - nur für Kreditkarten
        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: {
              name,
              email,
            },
          }
        });

        if (result?.error) {
          throw new Error(result.error.message);
        }

        if (result.paymentIntent) {
          // Abonnement erfolgreich - Payment Intent bestätigt
          console.log('Payment Intent erfolgreich, Netlify Function Response:', data);
          const stripeId = data.subscription?.stripeSubscriptionId || data.subscription?.id;
          console.log('Extrahierte Stripe Subscription ID:', stripeId);
          onPaymentSuccess({
            email: email,
            name: name,
            stripeSubscriptionId: stripeId
          });
        }
      }

      console.log('Zahlung erfolgreich!');
      
      // Erfolgreiche Zahlung
      // onPaymentSuccess({ email, name }); // This line is now handled inside the if/else blocks
      
    } catch (error) {
      console.error('Zahlungsfehler:', error);
      setErrors({ payment: `Zahlung fehlgeschlagen: ${error.message}` });
    } finally {
      setProcessing(false);
    }
  };

  const formatIBAN = (value: string) => {
    // IBAN formatieren: DE89 3704 0044 0532 0130 00
    const v = value.replace(/\s/g, '').toUpperCase();
    if (v.startsWith('DE') && v.length > 2) {
      const country = v.substring(0, 2);
      const rest = v.substring(2);
      const formatted = rest.match(/.{1,4}/g)?.join(' ') || rest;
      return `${country} ${formatted}`;
    }
    return v;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          Zahlung abschließen
        </h2>
        <p className="text-gray-600 text-sm">
          {plan.name} - {plan.price > 0 ? `€${plan.price}` : 'Kostenlos'}
          {plan.interval && plan.interval !== 'once' && (
            <span> / {plan.interval === 'month' ? 'Monat' : 'Jahr'}</span>
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Payment Method Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zahlungsmethode
          </label>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`p-3 border rounded-lg text-center transition-colors ${
                paymentMethod === 'card'
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <CreditCard className="w-4 h-4 mx-auto mb-1" />
              <span className="text-xs font-medium">Kreditkarte</span>
            </button>
            <div className="text-xs text-gray-500 text-center">
              Andere Zahlungsmethoden werden bald verfügbar sein
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-Mail-Adresse <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="ihre@email.de"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vollständiger Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Max Mustermann"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* SEPA IBAN */}
          {paymentMethod === 'sepa' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IBAN <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={iban}
                onChange={(e) => setIban(formatIBAN(e.target.value))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
                  errors.iban ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="DE89 3704 0044 0532 0130 00"
                maxLength={29}
              />
              {errors.iban && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.iban}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Nur deutsche IBANs werden unterstützt
              </p>
            </div>
          )}
        </div>

        {/* Stripe Card Element */}
        {paymentMethod === 'card' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kreditkarteninformationen <span className="text-red-500">*</span>
            </label>
            <div className="border border-gray-300 rounded-md p-3 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent">
              <CardElement options={cardElementOptions} />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Ihre Kartendaten werden sicher von Stripe verarbeitet
            </p>
          </div>
        )}

        {/* Payment Method Info */}
        {paymentMethod === 'paypal' && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-800">
              <PayPalIcon className="w-4 h-4" />
              <span className="text-sm font-medium">PayPal-Zahlung</span>
            </div>
            <p className="mt-1 text-xs text-blue-700">
              Nach dem Klick auf "Zahlen" werden Sie zu PayPal weitergeleitet
            </p>
          </div>
        )}

        {paymentMethod === 'applepay' && (
          <div className="bg-black p-3 rounded-lg border border-gray-300">
            <div className="flex items-center gap-2 text-white">
              <Smartphone className="w-4 h-4" />
              <span className="text-sm font-medium">Apple Pay</span>
            </div>
            <p className="mt-1 text-xs text-gray-300">
              Sichere Zahlung über Apple Pay
            </p>
          </div>
        )}

        {paymentMethod === 'googlepay' && (
          <div className="bg-blue-600 p-3 rounded-lg border border-blue-500">
            <div className="flex items-center gap-2 text-white">
              <Smartphone className="w-4 h-4" />
              <span className="text-sm font-medium">Google Pay</span>
            </div>
            <p className="mt-1 text-xs text-blue-200">
              Sichere Zahlung über Google Pay
            </p>
          </div>
        )}

        {paymentMethod === 'sepa' && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-800">
              <Building2 className="w-4 h-4" />
              <span className="text-sm font-medium">SEPA Banküberweisung</span>
            </div>
            <p className="mt-1 text-xs text-green-700">
              Direkte Banküberweisung über SEPA
            </p>
          </div>
        )}

        {/* Payment Error */}
        {errors.payment && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.payment}
            </p>
          </div>
        )}

        {/* Terms and Conditions */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="acceptTerms"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 mt-1"
          />
          <label htmlFor="acceptTerms" className="text-sm text-gray-700">
            Ich akzeptiere die{' '}
            <a href="#" className="text-brand-500 hover:underline">
              AGB
            </a>{' '}
            und{' '}
            <a href="#" className="text-brand-500 hover:underline">
              Datenschutzerklärung
            </a>
            <span className="text-red-500">*</span>
          </label>
        </div>
        {errors.terms && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.terms}
          </p>
        )}

        {/* Security Info */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="w-4 h-4 text-green-500" />
            Ihre Zahlungsdaten werden sicher von Stripe verschlüsselt übertragen
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={processing || isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={processing || isLoading || !stripe}
            className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Wird verarbeitet...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                {paymentMethod === 'paypal' ? 'Mit PayPal zahlen' : 
                 paymentMethod === 'applepay' ? 'Mit Apple Pay zahlen' :
                 paymentMethod === 'googlepay' ? 'Mit Google Pay zahlen' :
                 paymentMethod === 'sepa' ? 'SEPA-Zahlung starten' :
                 (plan.interval === 'once' ? 'Jetzt kaufen' : 'Abonnement starten')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Main Stripe Payment Component
export const StripePayment: React.FC<StripePaymentProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
};
