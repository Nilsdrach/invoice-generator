import React, { useState, useEffect } from 'react';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoicePreview } from './components/InvoicePreview';
import { PricingSection } from './components/PricingSection';
import { generateInvoicePDF } from './utils/pdfGenerator';
import { Invoice } from './types/invoice';
import { FileText, Download, Crown, User, LogOut } from 'lucide-react';
import { supabase, registerUser, loginUser, getUserByEmail, setUserProStatus } from './utils/supabaseService';
import { AuthModal } from './components/AuthModal';

function App() {
  // Invoice state
  const [invoice, setInvoice] = useState<Invoice>({
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
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'invoice' | 'pricing'>('invoice');
  const [isPro, setIsPro] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

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
    // PDF mit oder ohne Wasserzeichen je nach Pro-Status
    generateInvoicePDF(invoice, !isPro);
  };

  const resetProStatus = () => {
    setIsPro(false);
    sessionStorage.removeItem('isPro');
    alert('Pro-Status zurückgesetzt. Für Tests verwenden.');
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      // User anmelden
      const user = await loginUser(email, password);
      
      // Pro-Status laden
      if (user.isPro) {
        setIsPro(true);
      }
      
      setCurrentUser({ email: user.email, name: user.name });
      setShowAuthModal(false);
      
      // User-Info in sessionStorage speichern
      sessionStorage.setItem('userEmail', user.email);
      sessionStorage.setItem('userName', user.name);
      
    } catch (error) {
      console.error('Login error:', error);
      alert('Fehler beim Login: ' + error.message);
    }
  };

  const handleRegister = async (email: string, name: string, password: string) => {
    try {
      // User registrieren
      const user = await registerUser(email, name, password);
      
      // Automatisch anmelden nach Registrierung
      setCurrentUser({ email: user.email, name: user.name });
      setShowAuthModal(false);
      
      // User-Info in sessionStorage speichern
      sessionStorage.setItem('userEmail', user.email);
      sessionStorage.setItem('userName', user.name);
      
      alert('Registrierung erfolgreich! Sie sind jetzt angemeldet.');
      
    } catch (error) {
      console.error('Registration error:', error);
      alert('Fehler bei der Registrierung: ' + error.message);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsPro(false);
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('isPro');
  };

  const handleSelectPlan = async (priceId: string) => {
    if (!currentUser) {
      alert('Bitte melden Sie sich zuerst an.');
      setShowAuthModal(true);
      return;
    }

    try {
      console.log('Creating checkout session for price:', priceId);
      
      const response = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userEmail: currentUser.email,
          successUrl: `${window.location.origin}?success=true`,
          cancelUrl: `${window.location.origin}?canceled=true`
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('Server error details:', errorData);
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Checkout session response:', data);
      
      if (data.url) {
        console.log('Redirecting to Stripe Checkout:', data.url);
        window.location.href = data.url;
      } else {
        throw new Error('Keine Checkout-URL erhalten');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      
      let userMessage = 'Fehler beim Erstellen der Checkout-Session';
      if (error.message.includes('Stripe configuration missing')) {
        userMessage = 'Stripe ist nicht konfiguriert. Bitte kontaktieren Sie den Support.';
      } else if (error.message.includes('Invalid price ID')) {
        userMessage = 'Ungültiger Preis. Bitte wählen Sie einen anderen Plan.';
      } else if (error.message.includes('HTTP 500')) {
        userMessage = 'Server-Fehler. Bitte versuchen Sie es später erneut.';
      } else {
        userMessage = `${userMessage}: ${error.message}`;
      }
      
      alert(userMessage);
    }
  };

  // Load user status and Pro status on app start
  useEffect(() => {
    const loadUserStatus = async () => {
      try {
        // Load user info from sessionStorage
        const savedEmail = sessionStorage.getItem('userEmail');
        const savedName = sessionStorage.getItem('userName');
        
        if (savedEmail && savedName) {
          // User is logged in, load Pro status from database
          const user = await getUserByEmail(savedEmail);
          if (user) {
            setCurrentUser({ email: user.email, name: user.name });
            setIsPro(user.isPro);
          }
        }
      } catch (error) {
        console.error('Error loading user status:', error);
      }
    };

    loadUserStatus();
  }, []);

  // Check for payment success in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      // Payment successful, update Pro status in database
      const userEmail = urlParams.get('email') || sessionStorage.getItem('userEmail');
      if (userEmail) {
        setUserProStatus(userEmail, true)
          .then(() => {
            setIsPro(true);
            setActiveTab('invoice');
            // Remove success parameter from URL
            window.history.replaceState({}, document.title, window.location.pathname);
            alert('Zahlung erfolgreich! Pro-Features sind jetzt aktiviert.');
          })
          .catch(error => {
            console.error('Error updating Pro status:', error);
            alert('Zahlung erfolgreich, aber Fehler beim Aktivieren der Pro-Features. Bitte kontaktieren Sie den Support.');
          });
      } else {
        // No user logged in, just set local state
        setIsPro(true);
        setActiveTab('invoice');
        window.history.replaceState({}, document.title, window.location.pathname);
        alert('Zahlung erfolgreich! Pro-Features sind jetzt aktiviert.');
      }
    }
  }, []);

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
              {isPro && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                    <Crown className="w-3 h-3" />
                    Pro
                  </div>
                  <button
                    onClick={resetProStatus}
                    className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                    title="Pro-Status zurücksetzen (nur für Tests)"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <nav className="flex space-x-6">
                <button
                  onClick={() => setActiveTab('invoice')}
                  className={`text-sm font-medium transition-colors ${
                    activeTab === 'invoice'
                      ? 'text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Rechnung
                </button>
                <button
                  onClick={() => setActiveTab('pricing')}
                  className={`text-sm font-medium transition-colors ${
                    activeTab === 'pricing'
                      ? 'text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Pro Features
                </button>
              </nav>
              
              {/* User Authentication */}
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <User className="w-4 h-4" />
                    <span>{currentUser.name}</span>
                    <span className="text-gray-500">({currentUser.email})</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Abmelden
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Anmelden
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

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
               
               {/* Wasserzeichen Notice für Free Users */}
               {!isPro && (
                 <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                   <div className="text-sm text-yellow-800">
                     <strong>Free Version:</strong> PDF wird mit Wasserzeichen erstellt.
                   </div>
                   <button
                     onClick={() => setActiveTab('pricing')}
                     className="mt-2 text-sm text-yellow-700 underline hover:text-yellow-800"
                   >
                     Jetzt Pro Features freischalten
                   </button>
                 </div>
               )}
             </div>
           </div>
         </div>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <div className="max-w-4xl mx-auto">
            <PricingSection onSelectPlan={handleSelectPlan} isLoggedIn={!!currentUser} />
          </div>
        )}
       </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
}

export default App;