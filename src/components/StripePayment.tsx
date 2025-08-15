import React, { useState, useEffect } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { SubscriptionPlan, PricingPlan, getPlanById } from '../types/subscription';
import { CreditCard, Lock, Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

// Stripe-Konfiguration
const stripePromise = loadStripe('pk_test_51RwQ40BdLY4NC8JCYorm7BH1FbjaKA9CnDVx37qrp9U30VtCBRuczUR4njdqoJ3XE4FZb7vNFYnIVQryz8cISQK900gQoW9Ocs');

interface StripePaymentProps {
  selectedPlan: SubscriptionPlan;
  onPaymentSuccess: () => void;
  onCancel: () => void;
  isLoading?: boolean;
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
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
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
      // Echte Stripe-Integration mit Backend-API
      let clientSecret;
      
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
            planId: 'single'
          }),
        });
        
        if (!response.ok) {
          throw new Error('Payment Intent konnte nicht erstellt werden');
        }
        
        const data = await response.json();
        clientSecret = data.clientSecret;
        
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
            planId: selectedPlan
          }),
        });
        
        if (!response.ok) {
          throw new Error('Abonnement konnte nicht erstellt werden');
        }
        
        const data = await response.json();
        clientSecret = data.clientSecret;
      }

      // Stripe Payment bestätigen
      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name,
            email,
          },
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('Zahlung erfolgreich!');
      
      // Erfolgreiche Zahlung
      onPaymentSuccess();
      
    } catch (error) {
      console.error('Zahlungsfehler:', error);
      setErrors({ payment: `Zahlung fehlgeschlagen: ${error.message}` });
    } finally {
      setProcessing(false);
    }
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
        </div>

        {/* Stripe Card Element */}
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
                {plan.interval === 'once' ? 'Jetzt kaufen' : 'Abonnement starten'}
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
