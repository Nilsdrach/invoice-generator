import React, { useState, useEffect } from 'react';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoicePreview } from './components/InvoicePreview';
import { Pricing } from './components/Pricing';
import { StripePayment } from './components/StripePayment';
import { WatermarkModal } from './components/WatermarkModal';
import { generateInvoicePDF } from './utils/pdfGenerator';
import { Invoice } from './types/invoice';
import { SubscriptionPlan, User, Subscription, isSubscriptionActive, canCreateInvoiceWithoutWatermark } from './types/subscription';
import { supabaseService } from './utils/supabaseService';
import { supabase } from './utils/supabase';
import { FileText, Download, Crown, User as UserIcon, Settings, Info } from 'lucide-react';

function App() {
  // Invoice state
  const [invoice, setInvoice] = useState<Invoice>(() => {
    const savedInvoice = localStorage.getItem('lastInvoice');
    if (savedInvoice) {
      return JSON.parse(savedInvoice);
    }
    
    // Standardwerte für neue Rechnung
    return {
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      invoiceDate: new Date().toISOString().split('T')[0],
      deliveryDate: new Date().toISOString().split('T')[0],
      sender: {
        name: '',
        address: {
          street: '',
          city: '',
          country: 'Deutschland'
        },
        taxNumber: '',
        vatId: '',
        isSmallBusiness: false,
        logo: undefined
      },
      recipient: {
        name: '',
        address: {
          street: '',
          city: '',
          country: 'Deutschland'
        },
        taxNumber: '',
        vatId: '',
        isSmallBusiness: false,
        logo: undefined
      },
      items: [
        {
          id: '1',
          position: 1,
          title: '',
          description: '',
          quantity: 1,
          unitPrice: 0,
          taxRate: 19,
          total: 0
        }
      ],
      subtotal: 0,
      tax: 0,
      total: 0,
      paymentInfo: {
        paymentTerms: 'Zahlbar innerhalb von 14 Tagen',
        bankDetails: {
          iban: '',
          bic: '',
          bankName: ''
        },
        alternativePayment: '',
        purpose: ''
      },
      footerText: '',
      language: 'de'
    };
  });

  // User and subscription state
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      // Datumsfelder korrekt konvertieren
      if (parsed.createdAt) {
        parsed.createdAt = new Date(parsed.createdAt);
      }
      if (parsed.updatedAt) {
        parsed.updatedAt = new Date(parsed.updatedAt);
      }
      return parsed;
    }
    return null;
  });

  const [subscription, setSubscription] = useState<Subscription | null>(() => {
    const savedSubscription = localStorage.getItem('subscription');
    if (savedSubscription) {
      const parsed = JSON.parse(savedSubscription);
      // Datumsfelder korrekt konvertieren
      if (parsed.currentPeriodStart) {
        parsed.currentPeriodStart = new Date(parsed.currentPeriodStart);
      }
      if (parsed.currentPeriodEnd) {
        parsed.currentPeriodEnd = new Date(parsed.currentPeriodEnd);
      }
      if (parsed.createdAt) {
        parsed.createdAt = new Date(parsed.createdAt);
      }
      if (parsed.updatedAt) {
        parsed.updatedAt = new Date(parsed.updatedAt);
      }
      return parsed;
    }
    return null;
  });

  // UI state
  const [showPricing, setShowPricing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showWatermarkModal, setShowWatermarkModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'invoice' | 'pricing' | 'account'>('invoice');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Rechnung im LocalStorage speichern
  useEffect(() => {
    localStorage.setItem('lastInvoice', JSON.stringify(invoice));
  }, [invoice]);

  // User und Subscription im LocalStorage speichern
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    if (subscription) {
      localStorage.setItem('subscription', JSON.stringify(subscription));
    }
  }, [user, subscription]);

  // Funktion zum Laden der Subscription für einen User
  const loadSubscriptionForUser = async (email: string) => {
    try {
      // Versuche die Subscription aus der Datenbank zu laden
      const dbUser = await supabaseService.getUserByEmail(email);
      if (dbUser) {
        // Suche nach aktiven Subscriptions für diesen User
        const { data: subscriptions, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', dbUser.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && subscriptions && subscriptions.length > 0) {
          const dbSubscription = subscriptions[0];
          
          // Debug: Alle Daten anzeigen
          console.log('Raw Subscription aus Datenbank:', dbSubscription);
          console.log('current_period_end (raw):', dbSubscription.current_period_end);
          console.log('current_period_end (Date):', new Date(dbSubscription.current_period_end));
          
          const appSubscription: Subscription = {
            id: dbSubscription.id,
            userId: dbSubscription.user_id,
            plan: dbSubscription.plan,
            status: dbSubscription.status,
            currentPeriodStart: new Date(dbSubscription.current_period_start),
            currentPeriodEnd: new Date(dbSubscription.current_period_end),
            cancelAtPeriodEnd: dbSubscription.cancel_at_period_end,
            stripeSubscriptionId: dbSubscription.stripe_subscription_id,
            createdAt: new Date(dbSubscription.created_at),
            updatedAt: new Date(dbSubscription.updated_at)
          };
          
          console.log('Subscription für User geladen:', appSubscription);
          console.log('currentPeriodEnd (final):', appSubscription.currentPeriodEnd);
          console.log('currentPeriodEnd (formatted):', appSubscription.currentPeriodEnd.toLocaleDateString('de-DE'));
          
          // Prüfen ob das Datum korrekt ist
          const now = new Date();
          const expectedEndDate = new Date();
          if (dbSubscription.plan === 'yearly') {
            expectedEndDate.setFullYear(expectedEndDate.getFullYear() + 1);
          } else if (dbSubscription.plan === 'monthly') {
            expectedEndDate.setMonth(expectedEndDate.getMonth() + 1);
          }
          
          console.log('Erwartetes Ablaufdatum:', expectedEndDate.toLocaleDateString('de-DE'));
          console.log('Ist das Datum korrekt?', appSubscription.currentPeriodEnd.getTime() === expectedEndDate.getTime());
          
          // Falls das Datum falsch ist, korrigieren
          if (Math.abs(appSubscription.currentPeriodEnd.getTime() - expectedEndDate.getTime()) > 24 * 60 * 60 * 1000) { // Mehr als 1 Tag Unterschied
            console.log('Datum wird korrigiert...');
            appSubscription.currentPeriodEnd = expectedEndDate;
            
            // In der Datenbank aktualisieren
            await supabase
              .from('subscriptions')
              .update({ 
                current_period_end: expectedEndDate.toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', dbSubscription.id);
            
            console.log('Datum in Datenbank korrigiert');
          }
          
          setSubscription(appSubscription);
          localStorage.setItem('subscription', JSON.stringify(appSubscription));
        } else {
          // Keine aktive Subscription gefunden
          console.log('Keine aktive Subscription für User gefunden');
          setSubscription(null);
          localStorage.removeItem('subscription');
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Subscription für User:', error);
    }
  };

  // Subscription-Status beim Laden der App prüfen
  useEffect(() => {
    // Beim App-Start: Subscription aus der Datenbank laden
    if (user && user.email) {
      loadSubscriptionForUser(user.email);
    }
  }, [user]); // Nur ausführen wenn sich der User ändert

  // Subscription-Status prüfen (nur wenn Subscription geladen ist)
  useEffect(() => {
    if (subscription && (subscription.status === 'active' || subscription.cancelAtPeriodEnd)) {
      const now = new Date();
      if (now > new Date(subscription.currentPeriodEnd)) {
        // Abonnement ist abgelaufen - automatisch zum Free Plan wechseln
        const freeSubscription: Subscription = {
          ...subscription,
          plan: 'free',
          status: 'active',
          cancelAtPeriodEnd: false,
          currentPeriodStart: now,
          currentPeriodEnd: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 Jahr
          updatedAt: now
        };
        setSubscription(freeSubscription);
        localStorage.setItem('subscription', JSON.stringify(freeSubscription));
        
        // Optional: Supabase aktualisieren
        if (user) {
          supabaseService.updateSubscription(freeSubscription.id, {
            plan: 'free',
            status: 'active',
            cancel_at_period_end: false
          }).catch(console.error);
        }
      }
    }
  }, []); // Nur beim ersten Laden ausführen

  // Regelmäßige Prüfung des Abo-Status (alle 5 Minuten)
  useEffect(() => {
    const checkSubscriptionStatus = () => {
      if (subscription && (subscription.status === 'active' || subscription.cancelAtPeriodEnd) && subscription.plan !== 'free') {
        const now = new Date();
        if (now > new Date(subscription.currentPeriodEnd)) {
          // Abonnement ist abgelaufen - automatisch zum Free Plan wechseln
          const freeSubscription: Subscription = {
            ...subscription,
            plan: 'free',
            status: 'active',
            cancelAtPeriodEnd: false,
            currentPeriodStart: now,
            currentPeriodEnd: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 Jahr
            updatedAt: now
          };
          setSubscription(freeSubscription);
          localStorage.setItem('subscription', JSON.stringify(freeSubscription));
          
          // Optional: Supabase aktualisieren
          if (user) {
            supabaseService.updateSubscription(freeSubscription.id, {
              plan: 'free',
              status: 'active',
              cancel_at_period_end: false
            }).catch(console.error);
          }
        }
      }
    };

    // Sofort prüfen
    checkSubscriptionStatus();
    
    // Dann alle 5 Minuten prüfen
    const interval = setInterval(checkSubscriptionStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [subscription, user]);

  // Beim Laden der App: Abgelaufene Subscriptions in Supabase deaktivieren
  useEffect(() => {
    const cleanupExpiredSubscriptions = async () => {
      try {
        await supabaseService.deactivateExpiredSubscriptions();
      } catch (error) {
        console.error('Fehler beim Bereinigen abgelaufener Subscriptions:', error);
      }
    };

    cleanupExpiredSubscriptions();
  }, []); // Nur beim ersten Laden ausführen

  // Totale neu berechnen wenn sich Items ändern
  useEffect(() => {
    const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
    
    let tax = 0;
    if (!invoice.sender.isSmallBusiness) {
      // Verschiedene Steuersätze berücksichtigen
      tax = invoice.items.reduce((sum, item) => {
        return sum + (item.total * (item.taxRate / 100));
      }, 0);
    }
    
    const total = subtotal + tax;
    
    setInvoice(prev => ({
      ...prev,
      subtotal,
      tax,
      total
    }));
  }, [invoice.items, invoice.sender.isSmallBusiness]);

  const handleGeneratePDF = () => {
    // Prüfen ob Benutzer PDF ohne Wasserzeichen erstellen kann
    // Wasserzeichen entfernen wenn Pro-Abo aktiv ist
    const canCreateWithoutWatermark = (() => {
      if (!subscription) return false;
      
      // Nur für Pro-Pläne (nicht free)
      if (subscription.plan === 'free') return false;
      
      // Wenn das Abo aktiv ist, kann ohne Wasserzeichen erstellt werden
      if (subscription.status === 'active' || subscription.status === 'trialing') {
        return true;
      }
      
      return false;
    })();
    
    if (!canCreateWithoutWatermark) {
      // Für kostenlose Nutzer: Zeige Modal vor der PDF-Erstellung
      setShowWatermarkModal(true);
      return;
    }
    
    // Pro-Nutzer können direkt PDF ohne Wasserzeichen generieren
    generateInvoicePDF(invoice, false);
  };

  const handleSelectPlan = (planId: SubscriptionPlan) => {
    if (planId === 'free') return; // Free Plan kann nicht ausgewählt werden
    
    setSelectedPlan(planId);
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentData?: { email: string; name: string; stripeSubscriptionId?: string }) => {
    setIsPaymentLoading(false);
    setShowPayment(false);
    
    if (selectedPlan) {
      if (selectedPlan === 'single') {
        // Bei Einmalzahlung: PDF ohne Wasserzeichen erstellen
        generateInvoicePDF(invoice, false);
        setActiveTab('invoice');
      } else {
        // Bei Abonnement: Echte Daten in Supabase speichern
        try {
          // E-Mail und Name aus dem Payment Form verwenden
          const userEmail = paymentData?.email || 'user@example.com';
          const userName = paymentData?.name || 'Benutzer';
          
          if (!userEmail || !userName) {
            alert('E-Mail und Name sind erforderlich!');
            return;
          }

          // User in Supabase erstellen/aktualisieren
          const dbUser = await supabaseService.upsertUser(userEmail, userName);
          if (!dbUser) {
            alert('Fehler beim Erstellen des Benutzerkontos!');
            return;
          }

          // Subscription in Supabase erstellen
          const dbSubscription = await supabaseService.createSubscription(
            dbUser.id,
            selectedPlan
          );

          if (!dbSubscription) {
            alert('Fehler beim Erstellen des Abonnements!');
            return;
          }

          // Stripe Subscription ID aus der Payment-Response extrahieren
          // Diese kommt von der StripePayment-Komponente
          const stripeSubscriptionId = paymentData?.stripeSubscriptionId;
          console.log('Stripe Subscription ID aus Payment Data:', stripeSubscriptionId);
          
          if (stripeSubscriptionId) {
            console.log('Aktualisiere Stripe Subscription ID in Supabase...');
            const updateSuccess = await supabaseService.updateStripeSubscriptionId(dbSubscription.id, stripeSubscriptionId);
            console.log('Update erfolgreich:', updateSuccess);
          } else {
            console.warn('Keine Stripe Subscription ID gefunden!');
          }

          const newUser: User = {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            createdAt: new Date(dbUser.created_at),
            updatedAt: new Date(dbUser.updated_at)
          };

          const newSubscription: Subscription = {
            id: dbSubscription.id,
            userId: dbSubscription.user_id,
            plan: dbSubscription.plan,
            status: dbSubscription.status,
            currentPeriodStart: dbSubscription.current_period_start ? new Date(dbSubscription.current_period_start * 1000) : new Date(),
            currentPeriodEnd: dbSubscription.current_period_end ? new Date(dbSubscription.current_period_end * 1000) : (() => {
              // Fallback: Korrektes Datum basierend auf Plan berechnen
              const now = new Date();
              if (dbSubscription.plan === 'yearly') {
                // 1 Jahr ab jetzt
                const oneYearLater = new Date(now);
                oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
                return oneYearLater;
              } else if (dbSubscription.plan === 'monthly') {
                // 1 Monat ab jetzt
                const oneMonthLater = new Date(now);
                oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
                return oneMonthLater;
              }
              return now;
            })(),
            cancelAtPeriodEnd: dbSubscription.cancel_at_period_end,
            stripeSubscriptionId: stripeSubscriptionId || 'stripe_sub_' + Date.now(),
            createdAt: new Date(dbSubscription.created_at),
            updatedAt: new Date(dbSubscription.updated_at)
          };

          console.log('Neue Subscription erstellt:', newSubscription);

          setUser(newUser);
          setSubscription(newSubscription);

          // Lokalen Storage auch aktualisieren (Fallback)
          localStorage.setItem('user', JSON.stringify(newUser));
          localStorage.setItem('subscription', JSON.stringify(newSubscription));

          alert('Abonnement erfolgreich erstellt! Sie haben jetzt Pro-Features!');
          setActiveTab('invoice');
        } catch (error) {
          console.error('Fehler beim Erstellen des Abonnements:', error);
          alert('Fehler beim Erstellen des Abonnements. Bitte versuchen Sie es erneut.');
        }
      }
    }
    
    setSelectedPlan(null);
  };

  const handlePaymentCancel = () => {
    setIsPaymentLoading(false);
    setShowPayment(false);
    setSelectedPlan(null);
  };

  const handleLogout = () => {
    setUser(null);
    setSubscription(null);
    localStorage.removeItem('user');
    localStorage.removeItem('subscription');
    setActiveTab('invoice');
  };

  const handleWatermarkModalUpgrade = () => {
    setShowWatermarkModal(false);
    setActiveTab('pricing');
  };

  const handleWatermarkModalSinglePurchase = () => {
    setShowWatermarkModal(false);
    setSelectedPlan('single');
    setShowPayment(true);
    // Bleibe im Invoice-Tab
  };

  const handleWatermarkModalContinue = () => {
    setShowWatermarkModal(false);
    // PDF mit Wasserzeichen erstellen
    generateInvoicePDF(invoice, true);
  };

  // Wasserzeichen entfernen wenn Pro-Abo aktiv ist (auch wenn gekündigt aber noch läuft)
  const canCreateWithoutWatermark = (() => {
    if (!subscription) return false;
    
    // Nur für Pro-Pläne (nicht free)
    if (subscription.plan === 'free') return false;
    
    // Wenn das Abo aktiv ist ODER gekündigt aber noch läuft
    if (subscription.status === 'active' || subscription.status === 'trialing' || subscription.cancelAtPeriodEnd) {
      return true;
    }
    
    return false;
  })();
  
  // Pro-Zeichen anzeigen wenn Abo aktiv ist ODER gekündigt aber noch läuft
  const isSubscribed = (() => {
    if (!subscription) return false;
    
    // Nur für Pro-Pläne (nicht free)
    if (subscription.plan === 'free') return false;
    
    // Wenn das Abo aktiv ist ODER gekündigt aber noch läuft
    if (subscription.status === 'active' || subscription.status === 'trialing' || subscription.cancelAtPeriodEnd) {
      return true;
    }
    
    return false;
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-[#9B1D20] flex-shrink-0" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Invoice Generator
              </h1>
              {isSubscribed && (
                <div className="flex items-center gap-1 bg-brand-500 text-white px-2 py-1 rounded-full text-xs">
                  <Crown className="w-3 h-3" />
                  Pro
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              {/* User Menu */}
              <div className="flex items-center gap-2">
                {user ? (
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-700">
                      {user.name}
                    </div>
                    <button
                      onClick={() => setActiveTab('account')}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                      title="Konto anzeigen"
                    >
                      <UserIcon className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveTab('account')}
                    className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                  >
                    Anmelden
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('invoice')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'invoice'
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Rechnung erstellen
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'pricing'
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Abonnements
            </button>
            {/* Account Tab entfernt - nur über User-Icon erreichbar */}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Invoice Tab */}
        {activeTab === 'invoice' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Form Section */}
            <div className="xl:order-1">
              <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 md:mb-6">
                  Rechnung erstellen
                </h2>
                <InvoiceForm invoice={invoice} setInvoice={setInvoice} />
              </div>
            </div>

            {/* Preview Section */}
            <div className="xl:order-2">
              <div className="xl:sticky xl:top-8">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 md:mb-6">
                  Vorschau
                </h2>
                <InvoicePreview invoice={invoice} />
                
                {/* PDF Generation Button */}
                <div className="mt-4 sm:mt-6 flex justify-center">
                  <button
                    onClick={handleGeneratePDF}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#9B1D20] text-white rounded-lg hover:bg-[#8B1D20] transition-colors shadow-md text-sm sm:text-base font-medium"
                  >
                    <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                    PDF erstellen
                  </button>
                </div>

                {/* Watermark Notice */}
                {!canCreateWithoutWatermark && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Info className="w-4 h-4" />
                      <span className="text-sm font-medium">PDF wird mit Wasserzeichen erstellt</span>
                    </div>
                    <p className="mt-1 text-xs text-blue-700">
                      Nach der Erstellung können Sie das Wasserzeichen für 1,99€ entfernen oder ein Abo abschließen.
                    </p>
                  </div>
                )}

                {/* Pro Features Notice */}
                {canCreateWithoutWatermark && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <Crown className="w-4 h-4" />
                      <span className="text-sm font-medium">Pro-Features aktiv</span>
                    </div>
                    <p className="mt-1 text-xs text-green-700">
                      Ihre PDFs werden ohne Wasserzeichen erstellt.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}



        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <div>
            {showPayment ? (
              <div className="max-w-2xl mx-auto">
                <StripePayment
                  selectedPlan={selectedPlan!}
                  onPaymentSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                  isLoading={isPaymentLoading}
                />
              </div>
            ) : (
              <Pricing
                subscription={subscription}
                isLoading={isPaymentLoading}
                onSelectPlan={handleSelectPlan}
                onSubscriptionUpdate={(updatedSubscription) => {
                  setSubscription(updatedSubscription);
                  localStorage.setItem('subscription', JSON.stringify(updatedSubscription));
                }}
              />
            )}
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="max-w-2xl mx-auto">
            {/* Debug-Anzeige entfernt */}
            {user ? (
              // Eingeloggter Nutzer
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
                  Mein Konto
                </h2>
                
                <div className="space-y-6">
                  {/* User Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Benutzerinformationen</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name</label>
                          <p className="text-sm text-gray-900">{user.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">E-Mail</label>
                          <p className="text-sm text-gray-900">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Subscription Info */}
                  {subscription && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Abonnement</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Plan</label>
                            <p className="text-sm text-gray-900">
                              {subscription.plan === 'free'
                                ? 'Free'
                                : subscription.plan === 'monthly'
                                ? 'Pro Monthly'
                                : subscription.plan === 'yearly'
                                ? 'Pro Yearly'
                                : subscription.plan}
                            </p>
                            {subscription.currentPeriodEnd && !isNaN(new Date(subscription.currentPeriodEnd).getTime()) && (
                              <p className="text-xs text-gray-500">
                                Läuft bis: {new Date(subscription.currentPeriodEnd).toLocaleDateString('de-DE')}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Wasserzeichen</label>
                            <p className="text-sm text-gray-900">
                              {canCreateWithoutWatermark ? 'Entfernt' : 'Aktiv'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setActiveTab('pricing')}
                      className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                    >
                      Abonnement verwalten
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Abmelden
                    </button>
                    {/* Debug Button entfernt für Produktion */}
                    {/* Test Subscription Button entfernt für Produktion */}
                  </div>
                </div>
              </div>
            ) : (
              // Nicht eingeloggter Nutzer - Login/Register
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
                  Anmelden oder Registrieren
                </h2>
                
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      Melden Sie sich an oder erstellen Sie ein Konto, um Ihre Einstellungen zu verwalten.
                    </p>
                    
                    {/* Login/Register Tabs */}
                    <div className="max-w-sm mx-auto">
                      <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
                        <button
                          onClick={() => setAuthMode('login')}
                          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                            authMode === 'login'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Anmelden
                        </button>
                        <button
                          onClick={() => setAuthMode('register')}
                          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                            authMode === 'register'
                              ? 'bg-white text-gray-900 shadow-sm'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          Registrieren
                        </button>
                      </div>
                      
                      {/* Login Form */}
                      {authMode === 'login' && (
                        <div className="space-y-4">
                          <input
                            type="email"
                            id="login-email"
                            placeholder="E-Mail-Adresse"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                          />
                          <input
                            type="password"
                            id="login-password"
                            placeholder="Passwort"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                          />
                          <button
                            onClick={() => {
                              const email = (document.getElementById('login-email') as HTMLInputElement)?.value;
                              const password = (document.getElementById('login-password') as HTMLInputElement)?.value;
                              
                              if (!email || !password) {
                                alert('Bitte füllen Sie alle Felder aus.');
                                return;
                              }
                              
                              // Echter Login über Supabase
                              supabaseService.loginUser(email, password)
                                .then(user => {
                                  if (user) {
                                    // Login erfolgreich
                                    const appUser: User = {
                                      id: user.id,
                                      email: user.email,
                                      name: user.name,
                                      password: user.password,
                                      createdAt: new Date(user.created_at),
                                      updatedAt: new Date(user.updated_at)
                                    };
                                    
                                    setUser(appUser);
                                    localStorage.setItem('user', JSON.stringify(appUser));
                                    
                                    // Nach dem Login: Subscription laden
                                    loadSubscriptionForUser(appUser.email);
                                    
                                    setActiveTab('invoice');
                                  } else {
                                    alert('E-Mail oder Passwort falsch. Falls Sie noch kein Konto haben, registrieren Sie sich bitte.');
                                  }
                                })
                                .catch(error => {
                                  console.error('Login-Fehler:', error);
                                  alert('Fehler beim Login. Bitte versuchen Sie es erneut.');
                                });
                            }}
                            className="w-full px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium"
                          >
                            Anmelden
                          </button>
                        </div>
                      )}
                      
                      {/* Register Form */}
                      {authMode === 'register' && (
                        <div className="space-y-4">
                          <input
                            type="text"
                            id="register-name"
                            placeholder="Vollständiger Name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                          />
                          <input
                            type="email"
                            id="register-email"
                            placeholder="E-Mail-Adresse"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                          />
                          <input
                            type="password"
                            id="register-password"
                            placeholder="Passwort (mindestens 6 Zeichen)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                          />
                          <input
                            type="password"
                            id="register-password-confirm"
                            placeholder="Passwort bestätigen"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                          />
                          <button
                            onClick={() => {
                              const name = (document.getElementById('register-name') as HTMLInputElement)?.value;
                              const email = (document.getElementById('register-email') as HTMLInputElement)?.value;
                              const password = (document.getElementById('register-password') as HTMLInputElement)?.value;
                              const passwordConfirm = (document.getElementById('register-password-confirm') as HTMLInputElement)?.value;
                              
                              if (!name || !email || !password || !passwordConfirm) {
                                alert('Bitte füllen Sie alle Felder aus.');
                                return;
                              }
                              
                              if (password.length < 6) {
                                alert('Das Passwort muss mindestens 6 Zeichen lang sein.');
                                return;
                              }
                              
                              if (password !== passwordConfirm) {
                                alert('Die Passwörter stimmen nicht überein.');
                                return;
                              }
                              
                              // Neuen User über Supabase erstellen
                              supabaseService.registerUser(email, name, password)
                                .then(user => {
                                  if (user) {
                                    // Registrierung erfolgreich
                                    const appUser: User = {
                                      id: user.id,
                                      email: user.email,
                                      name: user.name,
                                      password: user.password,
                                      createdAt: new Date(user.created_at),
                                      updatedAt: new Date(user.updated_at)
                                    };
                                    
                                    setUser(appUser);
                                    localStorage.setItem('user', JSON.stringify(appUser));
                                    
                                    alert('Konto erfolgreich erstellt! Sie sind jetzt angemeldet.');
                                    setActiveTab('invoice');
                                  }
                                })
                                .catch(error => {
                                  console.error('Registrierungsfehler:', error);
                                  if (error.message.includes('existiert bereits')) {
                                    alert('Ein Konto mit dieser E-Mail-Adresse existiert bereits. Bitte melden Sie sich an.');
                                    setAuthMode('login');
                                  } else {
                                    alert('Fehler bei der Registrierung. Bitte versuchen Sie es erneut.');
                                  }
                                });
                            }}
                            className="w-full px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium"
                          >
                            Konto erstellen
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => setActiveTab('pricing')}
                        className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                      >
                        Oder direkt zu den Abonnements
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8 sm:mt-12 lg:mt-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
          <p className="text-center text-xs sm:text-sm text-gray-500">
            Invoice Generator - Erstellt für einfache Rechnungserstellung
          </p>
        </div>
      </footer>

      {/* Watermark Modal */}
      <WatermarkModal
        isOpen={showWatermarkModal}
        onClose={() => setShowWatermarkModal(false)}
        onUpgrade={handleWatermarkModalUpgrade}
        onSinglePurchase={handleWatermarkModalSinglePurchase}
        onContinue={handleWatermarkModalContinue}
      />

      {/* Payment Modal */}
      {showPayment && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <StripePayment
                selectedPlan={selectedPlan}
                onPaymentSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
                isLoading={isPaymentLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Test-Buttons entfernt - Account Tab nur über User-Icon erreichbar */}

      
    </div>
  );
}

export default App;