import React, { useState } from 'react';
import { PricingPlan, PRICING_PLANS, SubscriptionPlan, Subscription } from '../types/subscription';
import { Check, Star, CreditCard, Lock } from 'lucide-react';

interface PricingProps {
  subscription: Subscription | null;
  isLoading: boolean;
  onSelectPlan: (planId: SubscriptionPlan) => void;
  onSubscriptionUpdate?: (updatedSubscription: Subscription) => void;
}

export const Pricing: React.FC<PricingProps> = ({ subscription, isLoading, onSelectPlan, onSubscriptionUpdate }) => {
  const isCurrentPlan = (planId: SubscriptionPlan): boolean => {
    if (planId === 'free') return !subscription || subscription.plan === 'free';
    if (!subscription) return false;
    
    // Ein Plan ist aktuell wenn:
    // 1. Es ist der richtige Plan UND
    // 2. Das Abo läuft noch (status active/trialing ODER gekündigt aber noch laufend)
    return subscription.plan === planId && 
           (subscription.status === 'active' || subscription.status === 'trialing' || subscription.cancelAtPeriodEnd);
  };

  const handleSelectPlan = (plan: PricingPlan) => {
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

      <div className="flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl">
        {PRICING_PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-lg border-2 p-4 sm:p-6 transition-all duration-200 hover:shadow-lg ${
              plan.popular
                ? 'border-brand-500 bg-brand-50'
                : 'border-gray-200 hover:border-gray-300'
            }             `}
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
            {isCurrentPlan(plan.id) ? (
              // Aktueller Plan - Zeige Status und Kündigungsbutton (nur für bezahlte Pläne)
              <div className="space-y-3">
                <button className={`w-full py-3 px-4 rounded-lg font-medium text-sm sm:text-base flex items-center justify-center gap-2 ${
                  plan.id === 'free' 
                    ? 'bg-green-100 text-green-700 border border-green-300 cursor-not-allowed'
                    : subscription.cancelAtPeriodEnd 
                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-300 cursor-not-allowed' 
                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                }`}>
                  <Check className="w-4 h-4" />
                  {plan.id === 'free' 
                    ? 'Aktuell aktiv' 
                    : subscription.cancelAtPeriodEnd && subscription.plan !== 'free'
                    ? `Läuft aus am ${subscription.currentPeriodEnd && !isNaN(new Date(subscription.currentPeriodEnd).getTime()) ? new Date(subscription.currentPeriodEnd).toLocaleDateString('de-DE') : 'Unbekanntes Datum'}` 
                    : 'Aktueller Plan'}
                </button>
                {/* Kündigungsbutton nur für bezahlte Pläne anzeigen, die noch nicht gekündigt sind */}
                {subscription && !subscription.cancelAtPeriodEnd && plan.id !== 'free' ? (
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Kündigungsbutton geklickt');
                      console.log('Subscription:', subscription);
                      console.log('Stripe Subscription ID:', subscription.stripeSubscriptionId);
                      
                      if (!subscription.stripeSubscriptionId) {
                        alert('Fehler: Stripe Subscription ID nicht gefunden. Bitte kontaktieren Sie den Support.');
                        return;
                      }

                        if (confirm(`Möchten Sie Ihr ${plan.id === 'monthly' ? 'monatliches' : 'jährliches'} Abonnement wirklich kündigen? Es läuft bis zum ${(() => {
                          // Einheitliche Datumsberechnung: Verwende immer das ursprüngliche Ablaufdatum
                          if (subscription.currentPeriodEnd && !isNaN(new Date(subscription.currentPeriodEnd).getTime())) {
                            return new Date(subscription.currentPeriodEnd).toLocaleDateString('de-DE');
                          } else {
                            // Fallback: Datum basierend auf Plan berechnen
                            const now = new Date();
                            if (subscription.plan === 'yearly') {
                              const oneYearLater = new Date(now);
                              oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
                              return oneYearLater.toLocaleDateString('de-DE');
                            } else if (subscription.plan === 'monthly') {
                              const oneMonthLater = new Date(now);
                              oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
                              return oneMonthLater.toLocaleDateString('de-DE');
                            }
                            return 'Unbekanntes Datum';
                          }
                        })()} weiter.`)) {
                          try {
                            console.log('Sende Kündigungsanfrage an:', subscription.stripeSubscriptionId);
                            
                            // Echte Netlify Function für Stripe-Kündigung
                            const response = await fetch('/.netlify/functions/cancel-subscription', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                subscriptionId: subscription.stripeSubscriptionId
                              })
                            });

                            console.log('Response Status:', response.status);

                            if (!response.ok) {
                              const errorData = await response.json();
                              console.error('API Error:', errorData);
                              throw new Error(errorData.error || 'Fehler beim Kündigen');
                            }

                            const result = await response.json();
                            console.log('API Success:', result);
                            
                            if (result.success) {
                              // Update local subscription state mit den Daten von der API
                              const updatedSubscription = {
                                ...subscription,
                                cancelAtPeriodEnd: result.subscription.cancelAtPeriodEnd,
                                status: result.subscription.status as const, // Status von der API übernehmen
                                currentPeriodEnd: new Date(result.subscription.currentPeriodEnd * 1000) // Unix Timestamp zu Date konvertieren
                              };
                              
                              // Update local state
                              if (onSubscriptionUpdate) {
                                onSubscriptionUpdate(updatedSubscription);
                              }
                              
                              // Update localStorage
                              localStorage.setItem('subscription', JSON.stringify(updatedSubscription));
                              
                              alert(`Ihr Abonnement wurde erfolgreich gekündigt und läuft bis zum ${(() => {
                                // Einheitliche Datumsberechnung: Verwende immer das ursprüngliche Ablaufdatum
                                if (subscription.currentPeriodEnd && !isNaN(new Date(subscription.currentPeriodEnd).getTime())) {
                                  return new Date(subscription.currentPeriodEnd).toLocaleDateString('de-DE');
                                } else {
                                  // Fallback: Datum basierend auf Plan berechnen
                                  const now = new Date();
                                  if (subscription.plan === 'yearly') {
                                    const oneYearLater = new Date(now);
                                    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
                                    return oneYearLater.toLocaleDateString('de-DE');
                                  } else if (subscription.plan === 'monthly') {
                                    const oneMonthLater = new Date(now);
                                    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
                                    return oneMonthLater.toLocaleDateString('de-DE');
                                  }
                                  return 'Unbekanntes Datum';
                                }
                              })()} weiter.`);
                            } else {
                              throw new Error('Kündigung fehlgeschlagen');
                            }
                          } catch (error) {
                            console.error('Fehler beim Kündigen:', error);
                            alert(`Fehler beim Kündigen des Abonnements: ${error.message}. Bitte versuchen Sie es erneut.`);
                          }
                        }

                      // Doppelter Code entfernt
                    }}
                    className="w-full px-4 py-3 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                  >
                    Abonnement kündigen
                  </button>
                ) : (
                  // Für gekündigte Abos: Kein Info-Text mehr nötig
                  null
                )}
              </div>
            ) : (
              // Nicht aktueller Plan - Zeige Aktionsbutton (aber nicht für kostenlosen Plan wenn User ein Abo hat)
              plan.id === 'free' && subscription && subscription.plan !== 'free' ? (
                // Kein Button für kostenlosen Plan wenn User ein Abo hat
                null
              ) : (
                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isLoading || plan.id === 'free' || (isCurrentPlan(plan.id) && subscription && subscription.cancelAtPeriodEnd)}
                  className={`w-full py-3 px-4 rounded-lg font-medium text-sm sm:text-base transition-colors ${
                    plan.id === 'free'
                      ? 'bg-gray-100 text-gray-700 cursor-not-allowed'
                      : isCurrentPlan(plan.id) && subscription && subscription.cancelAtPeriodEnd
                      ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed'
                      : plan.popular
                      ? 'bg-brand-500 text-white hover:bg-brand-600'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {plan.id === 'free' && (!subscription || subscription.plan === 'free') ? (
                    'Aktuell aktiv'
                  ) : plan.id === 'free' && subscription && subscription.plan !== 'free' ? (
                    'Aktuell aktiv'
                  ) : isCurrentPlan(plan.id) && subscription && subscription.cancelAtPeriodEnd ? (
                    `Abonnement läuft am ${(() => {
                      // Einheitliche Datumsberechnung: Verwende immer das ursprüngliche Ablaufdatum
                      if (subscription.currentPeriodEnd && !isNaN(new Date(subscription.currentPeriodEnd).getTime())) {
                        return new Date(subscription.currentPeriodEnd).toLocaleDateString('de-DE');
                      } else {
                        // Fallback: Datum basierend auf Plan berechnen
                        const now = new Date();
                        if (subscription.plan === 'yearly') {
                          const oneYearLater = new Date(now);
                          oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
                          return oneYearLater.toLocaleDateString('de-DE');
                        } else if (subscription.plan === 'monthly') {
                          const oneMonthLater = new Date(now);
                          oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
                          return oneMonthLater.toLocaleDateString('de-DE');
                        }
                        return 'Unbekanntes Datum';
                      }
                    })()} ab`
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
              )
            )}
          </div>
        ))}
      </div>
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

