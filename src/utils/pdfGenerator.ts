import jsPDF from 'jspdf';
import { Invoice } from '../types/invoice';

export const generateInvoicePDF = (invoice: Invoice, showWatermark: boolean = true): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let currentY = margin;

  // Logo (if available)
  if (invoice.sender.logo) {
    try {
      // Add logo to the top right
      const logoWidth = 40;
      const logoHeight = 30;
      const logoX = pageWidth - margin - logoWidth;
      const logoY = margin;
      
      doc.addImage(invoice.sender.logo, 'JPEG', logoX, logoY, logoWidth, logoHeight);
      currentY = Math.max(currentY, logoY + logoHeight + 10);
    } catch (error) {
      console.warn('Logo konnte nicht zum PDF hinzugefügt werden:', error);
    }
  }

  // Title
  doc.setFontSize(24);
  doc.setTextColor(155, 29, 32); // #9B1D20
  doc.text('RECHNUNG', margin, currentY);
  currentY += 20;

  // Invoice info
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Rechnungsnummer: ${invoice.invoiceNumber}`, margin, currentY);
  currentY += 8;
  doc.text(`Rechnungsdatum: ${invoice.invoiceDate}`, margin, currentY);
  currentY += 20;

  // Sender info
  doc.setFontSize(14);
  doc.setTextColor(155, 29, 32);
  doc.text('Absender:', margin, currentY);
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  currentY += 8;
  
  const senderLines = [
    invoice.sender.name,
    invoice.sender.address,
    invoice.sender.email,
    invoice.sender.phone
  ].filter(line => line.trim());
  
  senderLines.forEach(line => {
    doc.text(line, margin, currentY);
    currentY += 6;
  });
  currentY += 10;

  // Recipient info
  doc.setFontSize(14);
  doc.setTextColor(155, 29, 32);
  doc.text('Empfänger:', margin, currentY);
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  currentY += 8;
  
  const recipientLines = [
    invoice.recipient.name,
    invoice.recipient.address,
    invoice.recipient.email
  ].filter(line => line.trim());
  
  recipientLines.forEach(line => {
    doc.text(line, margin, currentY);
    currentY += 6;
  });
  currentY += 20;

  // Items table
  doc.setFontSize(14);
  doc.setTextColor(155, 29, 32);
  doc.text('Positionen:', margin, currentY);
  currentY += 15;

  // Table header
  doc.setFillColor(155, 29, 32);
  doc.rect(margin, currentY - 5, pageWidth - 2 * margin, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('Beschreibung', margin + 2, currentY);
  doc.text('Menge', margin + 80, currentY);
  doc.text('Einzelpreis', margin + 110, currentY);
  doc.text('Gesamt', margin + 150, currentY);
  currentY += 12;

  // Table rows
  doc.setTextColor(0, 0, 0);
  invoice.items.forEach((item, index) => {
    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = margin;
    }
    
    // Alternate row colors
    if (index % 2 === 0) {
      doc.setFillColor(248, 249, 250);
      doc.rect(margin, currentY - 8, pageWidth - 2 * margin, 12, 'F');
    }
    
    doc.text(item.title, margin + 2, currentY);
    doc.text(item.quantity.toString(), margin + 85, currentY);
    doc.text(`€${item.unitPrice.toFixed(2)}`, margin + 115, currentY);
    doc.text(`€${item.total.toFixed(2)}`, margin + 155, currentY);
    currentY += 12;
  });

  currentY += 10;

  // Totals
  const totalsX = pageWidth - margin - 60;
  doc.setFontSize(11);
  doc.text('Zwischensumme:', totalsX - 40, currentY);
  doc.text(`€${invoice.subtotal.toFixed(2)}`, totalsX, currentY);
  currentY += 8;
  
  doc.text('MwSt. (19%):', totalsX - 40, currentY);
  doc.text(`€${invoice.tax.toFixed(2)}`, totalsX, currentY);
  currentY += 8;
  
  doc.setFontSize(12);
  doc.setTextColor(155, 29, 32);
  doc.text('Gesamtsumme:', totalsX - 40, currentY);
  doc.text(`€${invoice.total.toFixed(2)}`, totalsX, currentY);

  // Add watermark if enabled
  if (showWatermark) {
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.setGState(new doc.GState({ opacity: 0.3 }));
    
    // Rotate and position watermark
    doc.saveGraphicsState();
    doc.translate(pageWidth / 2, pageHeight / 2);
    doc.rotate(-45);
    doc.text('Erstellt mit Rechnung10Sekunden.de', 0, 0, { align: 'center' });
    doc.restoreGraphicsState();
    
    doc.setGState(new doc.GState({ opacity: 1 }));
  }

  // Save PDF
  doc.save(`Rechnung_${invoice.invoiceNumber}.pdf`);
};