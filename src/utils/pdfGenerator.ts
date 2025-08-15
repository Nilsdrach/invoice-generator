import { Invoice } from '../types/invoice';

export const generateInvoicePDF = (invoice: Invoice, showWatermark: boolean = true) => {
  // Erstelle ein neues Fenster für die PDF-Generierung
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Bitte erlauben Sie Pop-ups für diese Website, um PDFs zu generieren.');
    return;
  }

  // HTML-Inhalt für die PDF-Generierung
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rechnung ${invoice.invoiceNumber}</title>
      <style>
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
        
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 20px;
          background: white;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          border-bottom: 2px solid #9B1D20;
          padding-bottom: 20px;
        }
        
        .logo {
          max-width: 150px;
          max-height: 80px;
          object-fit: contain;
        }
        
        .invoice-title {
          font-size: 32px;
          font-weight: bold;
          color: #9B1D20;
          text-align: center;
          margin: 0;
        }
        
        .invoice-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }
        
        .info-section h3 {
          color: #9B1D20;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 10px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        
        .info-section p {
          margin: 5px 0;
          font-size: 14px;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        
        .items-table th {
          background-color: #9B1D20;
          color: white;
          padding: 12px 8px;
          text-align: left;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .items-table td {
          padding: 10px 8px;
          border-bottom: 1px solid #eee;
          font-size: 14px;
        }
        
        .items-table tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        
        .totals {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 30px;
        }
        
        .totals-table {
          width: 300px;
          border-collapse: collapse;
        }
        
        .totals-table td {
          padding: 8px 0;
          font-size: 14px;
        }
        
        .totals-table .total-row {
          border-top: 2px solid #9B1D20;
          font-weight: bold;
          font-size: 18px;
          color: #9B1D20;
        }
        
        .payment-info {
          background-color: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        
        .payment-info h4 {
          color: #9B1D20;
          margin-top: 0;
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .payment-info p {
          margin: 5px 0;
          font-size: 14px;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
        }
        
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 48px;
          color: rgba(155, 29, 32, 0.1);
          pointer-events: none;
          z-index: 1000;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .watermark-text {
          font-size: 24px;
          color: rgba(155, 29, 32, 0.15);
          margin-top: 10px;
        }
        
        .small-business-notice {
          background-color: #e3f2fd;
          border: 1px solid #2196f3;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .small-business-notice h4 {
          color: #1976d2;
          margin-top: 0;
          font-size: 16px;
        }
        
        .small-business-notice p {
          margin: 5px 0;
          color: #1565c0;
          font-size: 14px;
        }
        
        .print-button {
          position: fixed;
          top: 20px;
          right: 20px;
          background-color: #9B1D20;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
          z-index: 1001;
        }
        
        .print-button:hover {
          background-color: #8A1A1D;
        }
        
        @media print {
          .print-button { display: none; }
        }
      </style>
    </head>
    <body>
      ${showWatermark ? `
        <div class="watermark">
          <div>WASSERZEICHEN</div>
          <div class="watermark-text">Invoice Generator</div>
        </div>
      ` : ''}
      
      <button class="print-button no-print" onclick="window.print()">
        🖨️ PDF drucken
      </button>
      
      <div class="header">
        <div>
          <h1 class="invoice-title">RECHNUNG</h1>
          <div class="invoice-details">
            <p><strong>Rechnungsnummer:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Rechnungsdatum:</strong> ${formatDate(invoice.invoiceDate)}</p>
            <p><strong>Leistungsdatum:</strong> ${formatDate(invoice.deliveryDate)}</p>
          </div>
        </div>
        ${invoice.sender.logo ? `<img src="${invoice.sender.logo}" alt="Logo" class="logo">` : ''}
      </div>
      
      ${invoice.sender.isSmallBusiness ? `
        <div class="small-business-notice">
          <h4>⚠️ Kleinunternehmerregelung §19 UStG</h4>
          <p>Gemäß §19 UStG wird keine Umsatzsteuer berechnet.</p>
        </div>
      ` : ''}
      
      <div class="invoice-info">
        <div class="info-section">
          <h3>Absender (Rechnungssteller)</h3>
          <p><strong>${invoice.sender.name}</strong></p>
          <p>${invoice.sender.address.street}</p>
          <p>${invoice.sender.address.city}</p>
          <p>${invoice.sender.address.country}</p>
          ${invoice.sender.taxNumber ? `<p><strong>Steuernummer:</strong> ${invoice.sender.taxNumber}</p>` : ''}
          ${invoice.sender.vatId ? `<p><strong>USt-ID:</strong> ${invoice.sender.vatId}</p>` : ''}
        </div>
        
        <div class="info-section">
          <h3>Empfänger (Kunde)</h3>
          <p><strong>${invoice.recipient.name}</strong></p>
          <p>${invoice.recipient.address.street}</p>
          <p>${invoice.recipient.address.city}</p>
          <p>${invoice.recipient.address.country}</p>
        </div>
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>Pos.</th>
            <th>Titel der Leistung</th>
            <th>Beschreibung</th>
            <th style="text-align: right;">Menge</th>
            <th style="text-align: right;">Einzelpreis netto</th>
            <th style="text-align: center;">Steuersatz</th>
            <th style="text-align: right;">Gesamt netto</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
            <tr>
              <td>${item.position}</td>
              <td>${item.title || '-'}</td>
              <td>${item.description || '-'}</td>
              <td style="text-align: right;">${item.quantity}</td>
              <td style="text-align: right;">€${item.unitPrice.toFixed(2)}</td>
              <td style="text-align: center;">${getTaxRateText(item.taxRate)}</td>
              <td style="text-align: right; font-weight: bold;">€${item.total.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals">
        <table class="totals-table">
          <tr>
            <td>Zwischensumme netto:</td>
            <td style="text-align: right;">€${invoice.subtotal.toFixed(2)}</td>
          </tr>
          ${!invoice.sender.isSmallBusiness && invoice.tax > 0 ? `
            <tr>
              <td>Umsatzsteuer:</td>
              <td style="text-align: right;">€${invoice.tax.toFixed(2)}</td>
            </tr>
          ` : ''}
          <tr class="total-row">
            <td>Gesamtsumme:</td>
            <td style="text-align: right;">€${invoice.total.toFixed(2)}</td>
          </tr>
        </table>
      </div>
      
      ${(invoice.paymentInfo.paymentTerms || invoice.paymentInfo.bankDetails?.iban) ? `
        <div class="payment-info">
          <h4>Zahlungsinformationen</h4>
          ${invoice.paymentInfo.paymentTerms ? `<p><strong>Zahlungsziel:</strong> ${invoice.paymentInfo.paymentTerms}</p>` : ''}
          ${invoice.paymentInfo.bankDetails?.iban ? `<p><strong>IBAN:</strong> ${invoice.paymentInfo.bankDetails.iban}</p>` : ''}
          ${invoice.paymentInfo.bankDetails?.bic ? `<p><strong>BIC:</strong> ${invoice.paymentInfo.bankDetails.bic}</p>` : ''}
          ${invoice.paymentInfo.bankDetails?.bankName ? `<p><strong>Bank:</strong> ${invoice.paymentInfo.bankDetails.bankName}</p>` : ''}
          ${invoice.paymentInfo.alternativePayment ? `<p><strong>Alternative Zahlung:</strong> ${invoice.paymentInfo.alternativePayment}</p>` : ''}
          ${invoice.paymentInfo.purpose ? `<p><strong>Verwendungszweck:</strong> ${invoice.paymentInfo.purpose}</p>` : ''}
        </div>
      ` : ''}
      
      ${invoice.footerText ? `
        <div class="footer">
          <h4>Hinweise</h4>
          <div style="white-space: pre-line;">${invoice.footerText}</div>
        </div>
      ` : ''}
      
      <div class="footer">
        <p><strong>UStG-konforme Rechnung:</strong> Diese Rechnung erfüllt die Anforderungen des §14 UStG.</p>
        ${invoice.sender.isSmallBusiness ? `
          <p><strong>Kleinunternehmerregelung:</strong> Gemäß §19 UStG wird keine Umsatzsteuer berechnet.</p>
        ` : ''}
        <p>Erstellt mit Invoice Generator - UStG-konform</p>
        ${showWatermark ? '<p style="color: #999; font-style: italic;">Wasserzeichen entfernen mit Pro-Abonnement</p>' : ''}
      </div>
    </body>
    </html>
  `;

  // Schreibe den HTML-Inhalt in das neue Fenster
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Warte bis der Inhalt geladen ist, dann öffne den Druckdialog
  printWindow.onload = () => {
    // Automatisch den Druckdialog öffnen
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
};

// Hilfsfunktionen
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE');
};

const getTaxRateText = (taxRate: number): string => {
  if (taxRate === 0) return '0% (steuerfrei)';
  if (taxRate === 7) return '7% (ermäßigt)';
  if (taxRate === 19) return '19% (regulär)';
  return `${taxRate}%`;
};