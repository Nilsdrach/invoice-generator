import React from 'react';
import { Invoice, InvoiceItem, InvoiceSender, InvoiceRecipient } from '../types/invoice';
import { Plus, Trash2 } from 'lucide-react';
import { LogoUpload } from './LogoUpload';

interface InvoiceFormProps {
  invoice: Invoice;
  setInvoice: (invoice: Invoice) => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, setInvoice }) => {
  const updateSender = (field: keyof InvoiceSender, value: string) => {
    setInvoice({
      ...invoice,
      sender: { ...invoice.sender, [field]: value }
    });
  };

  const updateLogo = (logo: string | undefined) => {
    setInvoice({
      ...invoice,
      sender: { ...invoice.sender, logo }
    });
  };

  const updateRecipient = (field: keyof InvoiceRecipient, value: string) => {
    setInvoice({
      ...invoice,
      recipient: { ...invoice.recipient, [field]: value }
    });
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = invoice.items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        }
        return updatedItem;
      }
      return item;
    });
    
    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.19;
    const total = subtotal + tax;
    
    setInvoice({
      ...invoice,
      items: updatedItems,
      subtotal,
      tax,
      total
    });
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      title: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    setInvoice({
      ...invoice,
      items: [...invoice.items, newItem]
    });
  };

  const removeItem = (id: string) => {
    const updatedItems = invoice.items.filter(item => item.id !== id);
    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.19;
    const total = subtotal + tax;
    
    setInvoice({
      ...invoice,
      items: updatedItems,
      subtotal,
      tax,
      total
    });
  };

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rechnungsnummer
          </label>
          <input
            type="text"
            value={invoice.invoiceNumber}
            onChange={(e) => setInvoice({ ...invoice, invoiceNumber: e.target.value })}
            className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent"
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rechnungsdatum
          </label>
          <input
            type="date"
            value={invoice.invoiceDate}
            onChange={(e) => setInvoice({ ...invoice, invoiceDate: e.target.value })}
            className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent"
          />
        </div>
      </div>

      {/* Sender Info */}
      <div>
        <h3 className="text-lg font-semibold text-[#9B1D20] mb-4">Absender</h3>
        
        {/* Logo Upload */}
        <div className="mb-4">
          <LogoUpload logo={invoice.sender.logo} onLogoChange={updateLogo} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Name"
            value={invoice.sender.name}
            onChange={(e) => updateSender('name', e.target.value)}
            className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Adresse"
            value={invoice.sender.address}
            onChange={(e) => updateSender('address', e.target.value)}
            className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent"
          />
          <input
            type="email"
            placeholder="E-Mail"
            value={invoice.sender.email}
            onChange={(e) => updateSender('email', e.target.value)}
            className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent"
          />
          <input
            type="tel"
            placeholder="Telefon"
            value={invoice.sender.phone}
            onChange={(e) => updateSender('phone', e.target.value)}
            className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent"
          />
        </div>
      </div>

      {/* Recipient Info */}
      <div>
        <h3 className="text-lg font-semibold text-[#9B1D20] mb-4">Empfänger</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Name"
            value={invoice.recipient.name}
            onChange={(e) => updateRecipient('name', e.target.value)}
            className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Adresse"
            value={invoice.recipient.address}
            onChange={(e) => updateRecipient('address', e.target.value)}
            className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent"
          />
          <input
            type="email"
            placeholder="E-Mail"
            value={invoice.recipient.email}
            onChange={(e) => updateRecipient('email', e.target.value)}
            className="w-full md:col-span-2 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent"
          />
        </div>
      </div>

      {/* Items */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h3 className="text-lg font-semibold text-[#9B1D20]">Positionen</h3>
          <button
            onClick={addItem}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-[#9B1D20] text-white rounded-md hover:bg-[#8A1A1D] transition-colors text-base"
          >
            <Plus className="w-4 h-4" />
            Position hinzufügen
          </button>
        </div>
        
        <div className="space-y-4">
          {invoice.items.map((item) => (
            <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-4 bg-gray-50 rounded-lg">
              <input
                type="text"
                placeholder="Beschreibung"
                value={item.title}
                onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                className="col-span-1 sm:col-span-12 md:col-span-5 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Menge"
                value={item.quantity}
                onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                className="col-span-1 sm:col-span-4 md:col-span-2 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent"
                min="0"
                step="1"
              />
              <input
                type="number"
                placeholder="Einzelpreis"
                value={item.unitPrice}
                onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                className="col-span-1 sm:col-span-4 md:col-span-2 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent"
                min="0"
                step="0.01"
              />
              <div className="col-span-1 sm:col-span-3 md:col-span-2 text-right font-medium text-base">
                €{item.total.toFixed(2)}
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="col-span-1 sm:col-span-1 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};