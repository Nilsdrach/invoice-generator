import React from 'react';
import { Invoice } from '../types/invoice';

interface InvoicePreviewProps {
  invoice: Invoice;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice }) => {
  return (
    <div className="bg-white p-4 sm:p-8 rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#9B1D20] mb-3 sm:mb-4">RECHNUNG</h1>
        <div className="text-sm text-gray-600">
          <p><span className="font-medium">Rechnungsnummer:</span> {invoice.invoiceNumber}</p>
          <p><span className="font-medium">Rechnungsdatum:</span> {invoice.invoiceDate}</p>
        </div>
      </div>

      {/* Sender and Recipient */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
        <div>
          <h3 className="text-sm font-bold text-[#9B1D20] uppercase tracking-wider mb-2">
            Absender
          </h3>
          <div className="text-sm text-gray-800 space-y-1">
            {invoice.sender.logo && (
              <div className="mb-3">
                <img
                  src={invoice.sender.logo}
                  alt="Firmenlogo"
                  className="h-12 sm:h-16 object-contain"
                />
              </div>
            )}
            {invoice.sender.name && <p className="font-medium">{invoice.sender.name}</p>}
            {invoice.sender.address && <p>{invoice.sender.address}</p>}
            {invoice.sender.email && <p>{invoice.sender.email}</p>}
            {invoice.sender.phone && <p>{invoice.sender.phone}</p>}
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-bold text-[#9B1D20] uppercase tracking-wider mb-2">
            Empfänger
          </h3>
          <div className="text-sm text-gray-800 space-y-1">
            {invoice.recipient.name && <p className="font-medium">{invoice.recipient.name}</p>}
            {invoice.recipient.address && <p>{invoice.recipient.address}</p>}
            {invoice.recipient.email && <p>{invoice.recipient.email}</p>}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-6 sm:mb-8">
        <h3 className="text-sm font-bold text-[#9B1D20] uppercase tracking-wider mb-3 sm:mb-4">
          Positionen
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#9B1D20] text-white">
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Beschreibung
                </th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium uppercase tracking-wider">
                  Menge
                </th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium uppercase tracking-wider">
                  Einzelpreis
                </th>
                <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium uppercase tracking-wider">
                  Gesamt
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoice.items.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-sm text-gray-900">
                    {item.title || '-'}
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-sm text-gray-900 text-right">
                    {item.quantity}
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-sm text-gray-900 text-right">
                    €{item.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-sm text-gray-900 text-right font-medium">
                    €{item.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-2 text-sm">
              <span>Zwischensumme:</span>
              <span>€{invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 text-sm">
              <span>MwSt. (19%):</span>
              <span>€{invoice.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-3 text-lg font-bold text-[#9B1D20] border-t border-gray-200">
              <span>Gesamtsumme:</span>
              <span>€{invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};