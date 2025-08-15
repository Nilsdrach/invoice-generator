import React, { useState, useEffect } from 'react';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoicePreview } from './components/InvoicePreview';
import { Pricing } from './components/Pricing';
import { StripePayment } from './components/StripePayment';
import { WatermarkModal } from './components/WatermarkModal';
import { generateInvoicePDF } from './utils/pdfGenerator';
import { Invoice } from './types/invoice';
import { SubscriptionPlan, User, Subscription, isSubscriptionActive, canCreateInvoiceWithoutWatermark } from './types/subscription';
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
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [subscription, setSubscription] = useState<Subscription | null>(() => {
    const savedSubscription = localStorage.getItem('subscription');
    return savedSubscription ? JSON.parse(savedSubscription) : null;
  });

  // UI state
  const [showPricing, setShowPricing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showWatermarkModal, setShowWatermarkModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'invoice' | 'pricing' | 'account'>('invoice');

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
    const canCreateWithoutWatermark = canCreateInvoiceWithoutWatermark(subscription);
    
    if (!canCreateWithoutWatermark) {
      // Für kostenlose Nutzer: Zeige Modal vor der PDF-Erstellung
      setShowWatermarkModal(true);
      return;
    }
    
    // Pro-Nutzer können direkt PDF ohne Wasserzeichen generieren
    generateInvoicePDF(invoice, false);
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (plan === 'free') return;
    
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    setIsPaymentLoading(false);
    setShowPayment(false);
    
    // Simuliere erfolgreiche Zahlung
    if (selectedPlan) {
      if (selectedPlan === 'single') {
        // Bei Einmalzahlung: PDF ohne Wasserzeichen erstellen
        generateInvoicePDF(invoice, false);
        // Zurück zum Invoice-Tab
        setActiveTab('invoice');
      } else {
        // Bei Abonnement: Subscription erstellen
        const newSubscription: Subscription = {
          id: Date.now().toString(),
          userId: user?.id || 'anonymous',
          plan: selectedPlan,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + (selectedPlan === 'monthly' ? 30 * 24 * 60 * 60 * 1000 : 365 * 24 * 60 * 60 * 1000)),
          cancelAtPeriodEnd: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        setSubscription(newSubscription);
        
        // Wenn kein Benutzer existiert, erstelle einen
        if (!user) {
          const newUser: User = {
            id: Date.now().toString(),
            email: 'user@example.com',
            name: 'Benutzer',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          setUser(newUser);
        }
        
        // Zurück zum Invoice-Tab
        setActiveTab('invoice');
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

  const canCreateWithoutWatermark = canCreateInvoiceWithoutWatermark(subscription);
  const isSubscribed = isSubscriptionActive(subscription);

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
                      onClick={handleLogout}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <UserIcon className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveTab('pricing')}
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
              Preise & Abonnements
            </button>
            {user && (
              <button
                onClick={() => setActiveTab('account')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'account'
                    ? 'border-brand-500 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Mein Konto
              </button>
            )}
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
                onSelectPlan={handleSelectPlan}
                currentPlan={subscription?.plan || 'free'}
                isLoading={isPaymentLoading}
              />
            )}
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && user && (
          <div className="max-w-2xl mx-auto">
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
                      {user.company && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Firma</label>
                          <p className="text-sm text-gray-900">{user.company}</p>
                        </div>
                      )}
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
                          <p className="text-sm text-gray-900 capitalize">{subscription.plan}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Status</label>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            subscription.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {subscription.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                          </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Gültig bis</label>
                          <p className="text-sm text-gray-900">
                            {subscription.currentPeriodEnd.toLocaleDateString('de-DE')}
                          </p>
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
                </div>
              </div>
            </div>
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
    </div>
  );
}

export default App;