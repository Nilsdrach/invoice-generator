import React, { useState } from 'react';
import { PricingPlan, PRICING_PLANS, SubscriptionPlan } from '../types/subscription';
import { Check, Star, CreditCard, Lock } from 'lucide-react';

interface PricingProps {
  subscription: Subscription | null;
  isLoading: boolean;
  onSelectPlan: (planId: string) => void;
  onSubscriptionUpdate?: (updatedSubscription: Subscription) => void;
}

export const Pricing: React.FC<PricingProps> = ({ subscription, isLoading, onSelectPlan, onSubscriptionUpdate }) => {
  const isCurrentPlan = (planId: string): boolean => {
    if (!subscription) return planId === 'free';
    return subscription.plan === planId && subscription.status === 'active';
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    onSelectPlan(plan.id);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          Wählen Sie Ihren Plan
        </h2>
        <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
          Erstellen Sie professionelle Rechnungen ohne Wasserzeichen. 
          Wählen Sie zwischen monatlichem oder jährlichem Abonnement.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {PRICING_PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-lg border-2 p-4 sm:p-6 transition-all duration-200 hover:shadow-lg ${
              plan.popular
                ? 'border-brand-500 bg-brand-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${
              isCurrentPlan(plan.id) && plan.id !== 'free'
                ? 'ring-2 ring-brand-500 ring-offset-2'
                : ''
            }`}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-brand-500 text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Beliebt
                </span>
              </div>
            )}

            {/* Plan Header */}
            <div className="text-center mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                {plan.name}
              </h3>
              <div className="mb-2">
                <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                  {plan.price === 0 ? 'Kostenlos' : `€${plan.price}`}
                </span>
                {plan.interval && plan.price > 0 && (
                  <span className="text-gray-500 text-sm sm:text-base">
                    /{plan.interval === 'month' ? 'Monat' : plan.interval === 'year' ? 'Jahr' : 'Rechnung'}
                  </span>
                )}
              </div>
              {plan.id === 'yearly' ? (
                <p className="text-sm text-green-600 font-medium">
                  Sparen Sie €19,89 pro Jahr
                </p>
              ) : (
                <div className="h-5"></div> // Platzhalter für gleiche Höhe
              )}
            </div>

            {/* Features */}
            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Action Button */}
            <button
              onClick={() => handleSelectPlan(plan)}
              disabled={isLoading || isCurrentPlan(plan.id)}
              className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm sm:text-base transition-colors ${
                isCurrentPlan(plan.id)
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : plan.id === 'free'
                  ? 'bg-gray-100 text-gray-700 cursor-not-allowed'
                  : plan.popular
                  ? 'bg-brand-500 text-white hover:bg-brand-600'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {isCurrentPlan(plan.id) ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />
                    Aktueller Plan
                  </div>
                  {subscription && (
                    <button
                      onClick={async () => {
                        if (confirm(`Möchten Sie Ihr ${plan.id === 'monthly' ? 'monatliches' : 'jährliches'} Abonnement wirklich kündigen? Es läuft bis zum ${new Date(subscription.currentPeriodEnd).toLocaleDateString('de-DE')} weiter.`)) {
                          try {
                            // Echte Stripe-API über Netlify Function
                            const response = await fetch('/.netlify/functions/cancel-subscription', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                subscriptionId: subscription.stripeSubscriptionId
                              })
                            });

                            if (!response.ok) {
                              const errorData = await response.json();
                              throw new Error(errorData.error || 'Fehler beim Kündigen');
                            }

                            const result = await response.json();
                            
                            if (result.success) {
                              // Update local subscription state
                              const updatedSubscription = {
                                ...subscription,
                                cancelAtPeriodEnd: true,
                                status: 'cancelled' as const
                              };
                              
                              // Update local state
                              if (onSubscriptionUpdate) {
                                onSubscriptionUpdate(updatedSubscription);
                              }
                              
                              // Update localStorage
                              localStorage.setItem('subscription', JSON.stringify(updatedSubscription));
                              
                              alert(`Ihr Abonnement wurde erfolgreich gekündigt und läuft bis zum ${new Date(subscription.currentPeriodEnd).toLocaleDateString('de-DE')} weiter.`);
                            } else {
                              throw new Error('Kündigung fehlgeschlagen');
                            }
                          } catch (error) {
                            console.error('Fehler beim Kündigen:', error);
                            alert(`Fehler beim Kündigen des Abonnements: ${error.message}. Bitte versuchen Sie es erneut.`);
                          }
                        }
                      }}
                      className="w-full px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                    >
                      Abonnement kündigen
                    </button>
                  )}
                </div>
              ) : plan.id === 'free' && !isCurrentPlan('monthly') && !isCurrentPlan('yearly') ? (
                'Aktuell aktiv'
              ) : isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Wird geladen...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4" />
                  Abonnement starten
                </div>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Additional Info */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
          <Lock className="w-4 h-4" />
          Alle Zahlungen sind sicher und verschlüsselt
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Abonnements können jederzeit gekündigt werden.
        </p>
      </div>
    </div>
  );
};

