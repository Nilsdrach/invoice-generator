import React from 'react';

interface PricingSectionProps {
  onSelectPlan: (priceId: string) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan }) => {
  const plans = [
    {
      id: 'monthly',
      priceId: 'price_1RyCOYBdLY4NC8JCurzQBMrU',
      name: 'Pro Monthly',
      price: '9,99€',
      interval: '/Monat',
      features: [
        'Unbegrenzte Rechnungen',
        'Keine Wasserzeichen',
        'PDF Export',
        'E-Mail Support'
      ]
    },
    {
      id: 'yearly',
      priceId: 'price_1RyCOYBdLY4NC8JCt6kjhty8',
      name: 'Pro Yearly',
      price: '99,99€',
      interval: '/Jahr',
      popular: true,
             features: [
         'Unbegrenzte Rechnungen',
         'Keine Wasserzeichen',
         'PDF Export',
         'Prioritäts-Support'
       ]
    }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
        Pro Features freischalten
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative p-6 border rounded-lg ${
              plan.popular
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Beliebt
                </span>
              </div>
            )}
            
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {plan.name}
              </h3>
              <div className="flex items-baseline justify-center">
                <span className="text-3xl font-bold text-gray-900">
                  {plan.price}
                </span>
                <span className="text-gray-500 ml-1">
                  {plan.interval}
                </span>
              </div>
            </div>
            
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
            
            <button
              onClick={() => onSelectPlan(plan.priceId)}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                plan.popular
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              Plan wählen
            </button>
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Sichere Zahlung über Stripe • Jederzeit kündbar
        </p>
      </div>
    </div>
  );
};
