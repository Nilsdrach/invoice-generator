import React, { useState } from 'react';
import { SubscriptionPlan, PricingPlan, getPlanById } from '../types/subscription';
import { CreditCard, Lock, Shield, CheckCircle, AlertCircle } from 'lucide-react';

interface PaymentProps {
  selectedPlan: SubscriptionPlan;
  onPaymentSuccess: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const Payment: React.FC<PaymentProps> = ({
  selectedPlan,
  onPaymentSuccess,
  onCancel,
  isLoading = false
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'sepa' | 'paypal'>('card');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const plan = getPlanById(selectedPlan);
  if (!plan) return null;

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!email.trim()) newErrors.email = 'E-Mail ist erforderlich';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Ungültige E-Mail-Adresse';
    
    if (!name.trim()) newErrors.name = 'Name ist erforderlich';
    else if (name.trim().length < 2) newErrors.name = 'Name muss mindestens 2 Zeichen lang sein';
    
    if (paymentMethod === 'card') {
      if (!cardNumber.trim()) newErrors.cardNumber = 'Kartennummer ist erforderlich';
      else if (cardNumber.replace(/\s/g, '').length < 13) newErrors.cardNumber = 'Kartennummer ist zu kurz';
      else if (cardNumber.replace(/\s/g, '').length > 19) newErrors.cardNumber = 'Kartennummer ist zu lang';
      else if (!isValidCardNumber(cardNumber.replace(/\s/g, ''))) newErrors.cardNumber = 'Ungültige Kartennummer';
      
      if (!expiryDate.trim()) newErrors.expiryDate = 'Ablaufdatum ist erforderlich';
      else if (!/^\d{2}\/\d{2}$/.test(expiryDate)) newErrors.expiryDate = 'Format: MM/YY';
      else {
        const [month, year] = expiryDate.split('/');
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100;
        const currentMonth = currentDate.getMonth() + 1;
        
        if (parseInt(month) < 1 || parseInt(month) > 12) newErrors.expiryDate = 'Ungültiger Monat';
        else if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
          newErrors.expiryDate = 'Karte ist abgelaufen';
        }
      }
      
      if (!cvv.trim()) newErrors.cvv = 'CVV ist erforderlich';
      else if (cvv.length < 3 || cvv.length > 4) newErrors.cvv = 'CVV muss 3-4 Ziffern haben';
    }
    
    if (!acceptTerms) newErrors.terms = 'Sie müssen die AGB akzeptieren';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Luhn-Algorithmus für Kartennummer-Validierung
  const isValidCardNumber = (cardNumber: string): boolean => {
    let sum = 0;
    let isEven = false;
    
    // Von rechts nach links durchgehen
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i));
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Hier würde die Stripe-Integration erfolgen
    // Für den Moment simulieren wir eine erfolgreiche Zahlung
    try {
      // Simuliere verschiedene Zahlungsverarbeitungs-Schritte
      console.log('Zahlung wird verarbeitet...');
      
      // Schritt 1: Kartendaten validieren (0.5s)
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Kartendaten validiert');
      
      // Schritt 2: Zahlung autorisieren (1s)
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Zahlung autorisiert');
      
      // Schritt 3: Transaktion abschließen (0.5s)
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Transaktion abgeschlossen');
      
      onPaymentSuccess();
    } catch (error) {
      console.error('Zahlungsfehler:', error);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
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
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'card', label: 'Karte', icon: CreditCard },
              { id: 'sepa', label: 'SEPA', icon: CreditCard },
              { id: 'paypal', label: 'PayPal', icon: CreditCard }
            ].map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    paymentMethod === method.id
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Icon className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs font-medium">{method.label}</span>
                </button>
              );
            })}
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
        </div>

        {/* Credit Card Fields */}
        {paymentMethod === 'card' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kartennummer <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
                  errors.cardNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="1234 5678 9012 3456"
              />
              {errors.cardNumber && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.cardNumber}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ablaufdatum <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                  maxLength={5}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
                    errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="MM/YY"
                />
                {errors.expiryDate && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.expiryDate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVV <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                  maxLength={4}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
                    errors.cvv ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="123"
                />
                {errors.cvv && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.cvv}
                  </p>
                )}
              </div>
            </div>
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
            Ihre Zahlungsdaten werden sicher verschlüsselt übertragen
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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


