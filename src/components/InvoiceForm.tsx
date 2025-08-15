import React, { useState } from 'react';
import { Invoice, InvoiceItem, CompanyInfo, Address } from '../types/invoice';
import { Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { LogoUpload } from './LogoUpload';

interface InvoiceFormProps {
  invoice: Invoice;
  setInvoice: (invoice: Invoice) => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, setInvoice }) => {
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const updateSender = (field: keyof CompanyInfo, value: any) => {
    setInvoice({
      ...invoice,
      sender: { ...invoice.sender, [field]: value }
    });
  };

  const updateSenderAddress = (field: keyof Address, value: string) => {
    setInvoice({
      ...invoice,
      sender: { 
        ...invoice.sender, 
        address: { ...invoice.sender.address, [field]: value }
      }
    });
  };

  const updateRecipient = (field: keyof CompanyInfo, value: any) => {
    setInvoice({
      ...invoice,
      recipient: { ...invoice.recipient, [field]: value }
    });
  };

  const updateRecipientAddress = (field: keyof Address, value: string) => {
    setInvoice({
      ...invoice,
      recipient: { 
        ...invoice.recipient, 
        address: { ...invoice.recipient.address, [field]: value }
      }
    });
  };

  const updateLogo = (logo: string | undefined) => {
    setInvoice({
      ...invoice,
      sender: { ...invoice.sender, logo }
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
    
    setInvoice({
      ...invoice,
      items: updatedItems
    });
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      position: invoice.items.length + 1,
      title: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: invoice.sender.isSmallBusiness ? 0 : 19,
      total: 0
    };
    setInvoice({
      ...invoice,
      items: [...invoice.items, newItem]
    });
  };

  const removeItem = (id: string) => {
    const updatedItems = invoice.items.filter(item => item.id !== id);
    // Positionen neu nummerieren
    const renumberedItems = updatedItems.map((item, index) => ({
      ...item,
      position: index + 1
    }));
    
    setInvoice({
      ...invoice,
      items: renumberedItems
    });
  };

  const updatePaymentInfo = (field: keyof Invoice['paymentInfo'], value: any) => {
    setInvoice({
      ...invoice,
      paymentInfo: { ...invoice.paymentInfo, [field]: value }
    });
  };

  const updateBankDetails = (field: keyof Invoice['paymentInfo']['bankDetails'], value: string) => {
    setInvoice({
      ...invoice,
      paymentInfo: { 
        ...invoice.paymentInfo, 
        bankDetails: { ...invoice.paymentInfo.bankDetails!, [field]: value }
      }
    });
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Pflichtfelder prüfen
    if (!invoice.sender.name.trim()) newErrors.senderName = 'Name ist erforderlich';
    if (!invoice.sender.address.street.trim()) newErrors.senderStreet = 'Straße ist erforderlich';
    if (!invoice.sender.address.city.trim()) newErrors.senderCity = 'Stadt ist erforderlich';
    if (!invoice.sender.address.country.trim()) newErrors.senderCountry = 'Land ist erforderlich';
    
    if (!invoice.recipient.name.trim()) newErrors.recipientName = 'Name ist erforderlich';
    if (!invoice.recipient.address.street.trim()) newErrors.recipientStreet = 'Straße ist erforderlich';
    if (!invoice.recipient.address.city.trim()) newErrors.recipientCity = 'Stadt ist erforderlich';
    if (!invoice.recipient.address.country.trim()) newErrors.recipientCountry = 'Land ist erforderlich';
    
    if (!invoice.invoiceNumber.trim()) newErrors.invoiceNumber = 'Rechnungsnummer ist erforderlich';
    if (!invoice.invoiceDate) newErrors.invoiceDate = 'Rechnungsdatum ist erforderlich';
    if (!invoice.deliveryDate) newErrors.deliveryDate = 'Leistungsdatum ist erforderlich';

    // Items prüfen
    invoice.items.forEach((item, index) => {
      if (!item.title.trim()) newErrors[`item${index}Title`] = 'Titel der Leistung ist erforderlich';
      if (!item.description.trim()) newErrors[`item${index}Description`] = 'Beschreibung ist erforderlich';
      if (item.quantity <= 0) newErrors[`item${index}Quantity`] = 'Menge muss größer 0 sein';
      if (item.unitPrice < 0) newErrors[`item${index}Price`] = 'Preis darf nicht negativ sein';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Formular ist gültig, könnte hier gespeichert werden
      console.log('Formular ist gültig:', invoice);
    }
  };

  const countries = ['Deutschland', 'Österreich', 'Schweiz', 'Frankreich', 'Italien', 'Spanien', 'Niederlande', 'Belgien', 'Dänemark', 'Schweden', 'Norwegen', 'Finnland', 'Polen', 'Tschechien', 'Ungarn', 'Slowakei', 'Slowenien', 'Kroatien', 'Rumänien', 'Bulgarien', 'Griechenland', 'Portugal', 'Irland', 'Vereinigtes Königreich', 'Vereinigte Staaten', 'Kanada', 'Australien', 'Neuseeland', 'Japan', 'China', 'Indien', 'Brasilien', 'Mexiko', 'Südafrika', 'Andere'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
      {/* Header Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rechnungsnummer <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={invoice.invoiceNumber}
            onChange={(e) => setInvoice({ ...invoice, invoiceNumber: e.target.value })}
            className={`w-full px-3 py-2 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent ${
              errors.invoiceNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="z.B. INV-2024-001"
          />
          {errors.invoiceNumber && (
            <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              {errors.invoiceNumber}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rechnungsdatum <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={invoice.invoiceDate}
            onChange={(e) => setInvoice({ ...invoice, invoiceDate: e.target.value })}
            className={`w-full px-3 py-2 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent ${
              errors.invoiceDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.invoiceDate && (
            <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              {errors.invoiceDate}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Leistungs-/Lieferdatum <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={invoice.deliveryDate}
            onChange={(e) => setInvoice({ ...invoice, deliveryDate: e.target.value })}
            className={`w-full px-3 py-2 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent ${
              errors.deliveryDate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.deliveryDate && (
            <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              {errors.deliveryDate}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sprache
          </label>
          <select
            value={invoice.language}
            onChange={(e) => setInvoice({ ...invoice, language: e.target.value as 'de' | 'en' })}
            className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent"
          >
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {/* Sender Info */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-[#9B1D20] mb-3 sm:mb-4">Absender (Rechnungssteller) <span className="text-red-500">*</span></h3>
        
        {/* Logo Upload */}
        <div className="mb-3 sm:mb-4">
          <LogoUpload logo={invoice.sender.logo} onLogoChange={updateLogo} />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name oder Firmenname <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Name oder Firmenname"
              value={invoice.sender.name}
              onChange={(e) => updateSender('name', e.target.value)}
              className={`w-full px-3 py-2 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent ${
                errors.senderName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.senderName && (
              <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                {errors.senderName}
              </p>
            )}
          </div>
          
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Straße und Hausnummer <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Musterstraße 123"
              value={invoice.sender.address.street}
              onChange={(e) => updateSenderAddress('street', e.target.value)}
              className={`w-full px-3 py-2 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent ${
                errors.senderStreet ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.senderStreet && (
              <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                {errors.senderStreet}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Postleitzahl und Ort <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="12345 Musterstadt"
              value={invoice.sender.address.city}
              onChange={(e) => updateSenderAddress('city', e.target.value)}
              className={`w-full px-3 py-2 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent ${
                errors.senderCity ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.senderCity && (
              <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                {errors.senderCity}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Land <span className="text-red-500">*</span>
            </label>
            <select
              value={invoice.sender.address.country}
              onChange={(e) => updateSenderAddress('country', e.target.value)}
              className={`w-full px-3 py-2 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent ${
                errors.senderCountry ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            {errors.senderCountry && (
              <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                {errors.senderCountry}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Steuernummer
            </label>
            <input
              type="text"
              placeholder="Steuernummer"
              value={invoice.sender.taxNumber || ''}
              onChange={(e) => updateSender('taxNumber', e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              USt-ID
            </label>
            <input
              type="text"
              placeholder="DE123456789"
              value={invoice.sender.vatId || ''}
              onChange={(e) => updateSender('vatId', e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Kleinunternehmerregelung */}
        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={invoice.sender.isSmallBusiness}
              onChange={(e) => updateSender('isSmallBusiness', e.target.checked)}
              className="w-4 h-4 text-[#9B1D20] border-gray-300 rounded focus:ring-[#9B1D20]"
            />
            <span className="font-medium text-blue-800 text-sm sm:text-base">
              Ich bin Kleinunternehmer gemäß §19 UStG
            </span>
          </label>
          {invoice.sender.isSmallBusiness && (
            <p className="mt-2 text-xs sm:text-sm text-blue-700">
              📌 Gemäß §19 UStG wird keine Umsatzsteuer berechnet.
            </p>
          )}
        </div>
      </div>

      {/* Recipient Info */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-[#9B1D20] mb-3 sm:mb-4">Empfänger (Kunde) <span className="text-red-500">*</span></h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name oder Firmenname <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Name oder Firmenname"
              value={invoice.recipient.name}
              onChange={(e) => updateRecipient('name', e.target.value)}
              className={`w-full px-3 py-2 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent ${
                errors.recipientName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.recipientName && (
              <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                {errors.recipientName}
              </p>
            )}
          </div>
          
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Straße und Hausnummer <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Musterstraße 123"
              value={invoice.recipient.address.street}
              onChange={(e) => updateRecipientAddress('street', e.target.value)}
              className={`w-full px-3 py-2 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent ${
                errors.recipientStreet ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.recipientStreet && (
              <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                {errors.recipientStreet}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Postleitzahl und Ort <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="12345 Musterstadt"
              value={invoice.recipient.address.city}
              onChange={(e) => updateRecipientAddress('city', e.target.value)}
              className={`w-full px-3 py-2 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent ${
                errors.recipientCity ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.recipientCity && (
              <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                {errors.recipientCity}
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Land <span className="text-red-500">*</span>
            </label>
            <select
              value={invoice.recipient.address.country}
              onChange={(e) => updateRecipientAddress('country', e.target.value)}
              className={`w-full px-3 py-2 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent ${
                errors.recipientCountry ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            {errors.recipientCountry && (
              <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                {errors.recipientCountry}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-[#9B1D20]">Leistungsbeschreibung <span className="text-red-500">*</span></h3>
          <button
            type="button"
            onClick={addItem}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-[#9B1D20] text-white rounded-md hover:bg-[#8A1A1D] transition-colors text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" />
            Position hinzufügen
          </button>
        </div>
        
        <div className="space-y-3 sm:space-y-4">
          {invoice.items.map((item, index) => (
            <div key={item.id} className="space-y-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
              {/* Position Header */}
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium text-gray-600 w-8 text-center">
                  {item.position}
                </div>
                <div className="text-sm font-medium text-[#9B1D20]">
                  Position {item.position}
                </div>
              </div>
              
              {/* Title and Description */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Titel der Leistung <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. Webdesign, Beratung, Produktentwicklung"
                    value={item.title}
                    onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                    className={`w-full px-3 py-2 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent ${
                      errors[`item${index}Title`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Beschreibung <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Detaillierte Beschreibung der Leistung, Umfang, etc."
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    rows={2}
                    className={`w-full px-3 py-2 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent resize-none ${
                      errors[`item${index}Description`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>
              
              {/* Quantity, Price, Tax Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Menge <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Menge"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                    className={`w-full px-3 py-2 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent ${
                      errors[`item${index}Quantity`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min="0"
                    step="1"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Einzelpreis netto <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Einzelpreis netto"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                    className={`w-full px-3 py-2 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent ${
                      errors[`item${index}Price`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Steuersatz
                  </label>
                  <select
                    value={item.taxRate}
                    onChange={(e) => updateItem(item.id, 'taxRate', Number(e.target.value))}
                    disabled={invoice.sender.isSmallBusiness}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value={0}>0%</option>
                    <option value={7}>7%</option>
                    <option value={19}>19%</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <div className="w-full text-right">
                    <div className="text-xs font-medium text-gray-700 mb-1">Gesamt netto</div>
                    <div className="text-base sm:text-lg font-bold text-[#9B1D20]">
                      €{item.total.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Remove Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4 inline mr-1" />
                  Position entfernen
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Fehlermeldungen für Items */}
        {invoice.items.map((item, index) => (
          <div key={`errors-${item.id}`}>
            {errors[`item${index}Title`] && (
              <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                Position {item.position}: {errors[`item${index}Title`]}
              </p>
            )}
            {errors[`item${index}Description`] && (
              <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                Position {item.position}: {errors[`item${index}Description`]}
              </p>
            )}
            {errors[`item${index}Quantity`] && (
              <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                Position {item.position}: {errors[`item${index}Quantity`]}
              </p>
            )}
            {errors[`item${index}Price`] && (
              <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                Position {item.position}: {errors[`item${index}Price`]}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Payment Information */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-[#9B1D20] mb-3 sm:mb-4">Zahlungsinformationen</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zahlungsziel
            </label>
            <input
              type="text"
              placeholder="Zahlbar innerhalb von 14 Tagen"
              value={invoice.paymentInfo.paymentTerms}
              onChange={(e) => updatePaymentInfo('paymentTerms', e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IBAN
            </label>
            <input
              type="text"
              placeholder="DE89 3704 0044 0532 0130 00"
              value={invoice.paymentInfo.bankDetails?.iban || ''}
              onChange={(e) => updateBankDetails('iban', e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              BIC
            </label>
            <input
              type="text"
              placeholder="COBADEFFXXX"
              value={invoice.paymentInfo.bankDetails?.bic || ''}
              onChange={(e) => updateBankDetails('bic', e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bankname
            </label>
            <input
              type="text"
              placeholder="Commerzbank AG"
              value={invoice.paymentInfo.bankDetails?.bankName || ''}
              onChange={(e) => updateBankDetails('bankName', e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alternative Zahlungsmethoden
            </label>
            <input
              type="text"
              placeholder="PayPal, Kreditkarte, etc."
              value={invoice.paymentInfo.alternativePayment || ''}
              onChange={(e) => updatePaymentInfo('alternativePayment', e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verwendungszweck
            </label>
            <input
              type="text"
              placeholder={invoice.invoiceNumber}
              value={invoice.paymentInfo.purpose}
              onChange={(e) => updatePaymentInfo('purpose', e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Footer Text */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-[#9B1D20] mb-3 sm:mb-4">Fußtext / Hinweistext</h3>
        <textarea
          placeholder="Rechtliche Hinweise, AGB, Kleinunternehmer-Hinweis, etc."
          value={invoice.footerText}
          onChange={(e) => setInvoice({ ...invoice, footerText: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9B1D20] focus:border-transparent"
        />
        {invoice.sender.isSmallBusiness && (
          <p className="mt-2 text-xs sm:text-sm text-blue-700 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            Kleinunternehmer-Hinweis wird automatisch hinzugefügt
          </p>
        )}
      </div>

      {/* Validation Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-800 mb-2 text-sm sm:text-base">Bitte beheben Sie folgende Fehler:</h4>
          <ul className="text-xs sm:text-sm text-red-700 space-y-1">
            {Object.entries(errors).map(([key, message]) => (
              <li key={key} className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                {message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
};