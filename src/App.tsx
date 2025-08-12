import React, { useState, useEffect } from 'react';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoicePreview } from './components/InvoicePreview';
import { Login } from './components/Login';
import { generateInvoicePDF } from './utils/pdfGenerator';
import { Invoice, User } from './types/invoice';
import { FileText, Download } from 'lucide-react';

function App() {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('invoiceUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [invoice, setInvoice] = useState<Invoice>({
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    invoiceDate: new Date().toISOString().split('T')[0],
    sender: {
      name: '',
      address: '',
      email: '',
      phone: ''
    },
    recipient: {
      name: '',
      address: '',
      email: ''
    },
    items: [
      {
        id: '1',
        title: '',
        quantity: 1,
        unitPrice: 0,
        total: 0
      }
    ],
    subtotal: 0,
    tax: 0,
    total: 0
  });

  const handleGeneratePDF = () => {
    // Premium-User bekommen kein Wasserzeichen
    const showWatermark = !user?.isPremium;
    generateInvoicePDF(invoice, showWatermark);
  };

  const handleLogin = (newUser: User) => {
    setUser(newUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Update totals when items change
  useEffect(() => {
    const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.19;
    const total = subtotal + tax;
    
    setInvoice(prev => ({
      ...prev,
      subtotal,
      tax,
      total
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-[#9B1D20]" />
              <h1 className="text-2xl font-bold text-gray-900">
                Invoice Generator
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Login user={user} onLogin={handleLogin} onLogout={handleLogout} />
              <button
                onClick={handleGeneratePDF}
                className="flex items-center gap-2 px-6 py-2 bg-[#9B1D20] text-white rounded-lg hover:bg-[#8A1A1D] transition-colors shadow-md"
              >
                <Download className="w-5 h-5" />
                PDF erstellen
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="lg:order-1">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                Rechnung erstellen
              </h2>
              <InvoiceForm invoice={invoice} setInvoice={setInvoice} />
            </div>
          </div>

          {/* Preview Section */}
          <div className="lg:order-2">
            <div className="lg:sticky lg:top-8">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                Vorschau
              </h2>
              <InvoicePreview invoice={invoice} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Invoice Generator - Erstellt für einfache Rechnungserstellung
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;