import React from 'react';
import { Invoice } from '../types/invoice';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface InvoicePreviewProps {
  invoice: Invoice;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
  };

  const getTaxRateText = (taxRate: number) => {
    if (taxRate === 0) return '0% (steuerfrei)';
    if (taxRate === 7) return '7% (ermäßigt)';
    if (taxRate === 19) return '19% (regulär)';
    return `${taxRate}%`;
  };

  return (
    <div className="bg-white p-3 sm:p-4 md:p-6 lg:p-8 rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#9B1D20]">RECHNUNG</h1>
          {invoice.sender.logo && (
            <img
              src={invoice.sender.logo}
              alt="Firmenlogo"
              className="h-12 w-auto sm:h-16 object-contain"
            />
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
          <div>
            <p><span className="font-medium">Rechnungsnummer:</span> {invoice.invoiceNumber}</p>
            <p><span className="font-medium">Rechnungsdatum:</span> {formatDate(invoice.invoiceDate)}</p>
            <p><span className="font-medium">Leistungsdatum:</span> {formatDate(invoice.deliveryDate)}</p>
          </div>
          <div>
            <p><span className="font-medium">Sprache:</span> {invoice.language === 'de' ? 'Deutsch' : 'English'}</p>
            {invoice.sender.taxNumber && (
              <p><span className="font-medium">Steuernummer:</span> {invoice.sender.taxNumber}</p>
            )}
            {invoice.sender.vatId && (
              <p><span className="font-medium">USt-ID:</span> {invoice.sender.vatId}</p>
            )}
          </div>
        </div>
      </div>

      {/* Kleinunternehmer-Hinweis */}
      {invoice.sender.isSmallBusiness && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800">
            <Info className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-medium text-sm sm:text-base">Kleinunternehmerregelung §19 UStG</span>
          </div>
          <p className="mt-2 text-xs sm:text-sm text-blue-700">
            Gemäß §19 UStG wird keine Umsatzsteuer berechnet.
          </p>
        </div>
      )}

      {/* Sender and Recipient */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-4 sm:mb-6 lg:mb-8">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-[#9B1D20] uppercase tracking-wider mb-2">
            Absender (Rechnungssteller)
          </h3>
          <div className="text-xs sm:text-sm text-gray-800 space-y-1">
            <p className="font-medium">{invoice.sender.name}</p>
            <p>{invoice.sender.address.street}</p>
            <p>{invoice.sender.address.city}</p>
            <p>{invoice.sender.address.country}</p>
            {invoice.sender.taxNumber && <p>Steuernummer: {invoice.sender.taxNumber}</p>}
            {invoice.sender.vatId && <p>USt-ID: {invoice.sender.vatId}</p>}
          </div>
        </div>
        
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-[#9B1D20] uppercase tracking-wider mb-2">
            Empfänger (Kunde)
          </h3>
          <div className="text-xs sm:text-sm text-gray-800 space-y-1">
            <p className="font-medium">{invoice.recipient.name}</p>
            <p>{invoice.recipient.address.street}</p>
            <p>{invoice.recipient.address.city}</p>
            <p>{invoice.recipient.address.country}</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h3 className="text-xs sm:text-sm font-bold text-[#9B1D20] uppercase tracking-wider mb-3 sm:mb-4">
          Leistungsbeschreibung
        </h3>
        
        {/* Mobile View - Cards */}
        <div className="block sm:hidden space-y-3">
          {invoice.items.map((item, index) => (
            <div key={item.id} className={`p-3 border rounded-lg ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium text-gray-600">Pos. {item.position}</span>
                <span className="text-sm font-bold text-[#9B1D20]">€{item.total.toFixed(2)}</span>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm">{item.title || '-'}</p>
                <p className="text-xs text-gray-600">{item.description || '-'}</p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Menge: {item.quantity}</span>
                  <span>Preis: €{item.unitPrice.toFixed(2)}</span>
                  <span>Steuer: {getTaxRateText(item.taxRate)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Desktop View - Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#9B1D20] text-white">
                <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Pos.
                </th>
                <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Titel der Leistung
                </th>
                <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Beschreibung
                </th>
                <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right text-xs font-medium uppercase tracking-wider">
                  Menge
                </th>
                <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right text-xs font-medium uppercase tracking-wider">
                  Einzelpreis netto
                </th>
                <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center text-xs font-medium uppercase tracking-wider">
                  Steuersatz
                </th>
                <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-right text-xs font-medium uppercase tracking-wider">
                  Gesamt netto
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoice.items.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 text-center">
                    {item.position}
                  </td>
                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 font-medium">
                    <div className="max-w-[120px] lg:max-w-[200px] truncate" title={item.title || '-'}>
                      {item.title || '-'}
                    </div>
                  </td>
                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900">
                    <div className="max-w-[120px] lg:max-w-[200px]">
                      <div className="line-clamp-2 text-xs sm:text-sm">
                        {item.description || '-'}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 text-right">
                    {item.quantity}
                  </td>
                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 text-right">
                    €{item.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 text-center">
                    <span className="text-xs">{getTaxRateText(item.taxRate)}</span>
                  </td>
                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 text-right font-medium">
                    €{item.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="border-t border-gray-200 pt-3 sm:pt-4 mb-4 sm:mb-6">
        <div className="flex justify-end">
          <div className="w-full sm:w-64">
            <div className="flex justify-between py-2 text-xs sm:text-sm">
              <span>Zwischensumme netto:</span>
              <span>€{invoice.subtotal.toFixed(2)}</span>
            </div>
            
            {!invoice.sender.isSmallBusiness && invoice.tax > 0 && (
              <div className="flex justify-between py-2 text-xs sm:text-sm">
                <span>Umsatzsteuer:</span>
                <span>€{invoice.tax.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between py-2 sm:py-3 text-sm sm:text-lg font-bold text-[#9B1D20] border-t border-gray-200">
              <span>Gesamtsumme:</span>
              <span>€{invoice.total.toFixed(2)}</span>
            </div>
            
            {invoice.sender.isSmallBusiness && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Kleinunternehmer gemäß §19 UStG
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Information */}
      {invoice.paymentInfo.paymentTerms || invoice.paymentInfo.bankDetails?.iban || invoice.paymentInfo.alternativePayment ? (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-xs sm:text-sm font-bold text-[#9B1D20] uppercase tracking-wider mb-2 sm:mb-3">
            Zahlungsinformationen
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            {invoice.paymentInfo.paymentTerms && (
              <div>
                <span className="font-medium">Zahlungsziel:</span> {invoice.paymentInfo.paymentTerms}
              </div>
            )}
            {invoice.paymentInfo.bankDetails?.iban && (
              <div>
                <span className="font-medium">IBAN:</span> {invoice.paymentInfo.bankDetails.iban}
              </div>
            )}
            {invoice.paymentInfo.bankDetails?.bic && (
              <div>
                <span className="font-medium">BIC:</span> {invoice.paymentInfo.bankDetails.bic}
              </div>
            )}
            {invoice.paymentInfo.bankDetails?.bankName && (
              <div>
                <span className="font-medium">Bank:</span> {invoice.paymentInfo.bankDetails.bankName}
              </div>
            )}
            {invoice.paymentInfo.alternativePayment && (
              <div>
                <span className="font-medium">Alternative Zahlung:</span> {invoice.paymentInfo.alternativePayment}
              </div>
            )}
            {invoice.paymentInfo.purpose && (
              <div>
                <span className="font-medium">Verwendungszweck:</span> {invoice.paymentInfo.purpose}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Footer Text */}
      {invoice.footerText && (
        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-xs sm:text-sm font-bold text-[#9B1D20] uppercase tracking-wider mb-2">
            Hinweise
          </h4>
          <div className="text-xs sm:text-sm text-gray-700 whitespace-pre-line">
            {invoice.footerText}
          </div>
        </div>
      )}

      {/* UStG Compliance Notice */}
      <div className="text-xs text-gray-500 border-t border-gray-200 pt-3 sm:pt-4">
        <p className="mb-1">
          <strong>UStG-konforme Rechnung:</strong> Diese Rechnung erfüllt die Anforderungen des §14 UStG.
        </p>
        {invoice.sender.isSmallBusiness && (
          <p>
            <strong>Kleinunternehmerregelung:</strong> Gemäß §19 UStG wird keine Umsatzsteuer berechnet.
          </p>
        )}
        <p className="mt-2">
          Erstellt mit Invoice Generator - UStG-konform
        </p>
      </div>
    </div>
  );
};