export interface Address {
  street: string;
  city: string;
  country: string;
}

export interface CompanyInfo {
  name: string;
  address: Address;
  taxNumber?: string;
  vatId?: string;
  isSmallBusiness: boolean; // §19 UStG
  logo?: string;
}

export interface InvoiceItem {
  id: string;
  position: number;
  title: string; // Titel der Leistung
  description: string; // Detaillierte Beschreibung
  quantity: number;
  unitPrice: number;
  taxRate: number; // 0%, 7%, 19%
  total: number;
}

export interface PaymentInfo {
  paymentTerms: string; // z.B. "Zahlbar innerhalb von 14 Tagen"
  bankDetails?: {
    iban: string;
    bic: string;
    bankName: string;
  };
  alternativePayment?: string; // PayPal, etc.
  purpose: string; // Verwendungszweck
}

export interface Invoice {
  invoiceNumber: string;
  invoiceDate: string;
  deliveryDate: string;
  sender: CompanyInfo;
  recipient: CompanyInfo;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentInfo: PaymentInfo;
  footerText: string;
  language: 'de' | 'en';
}

export interface User {
  email: string;
  isPremium: boolean;
}

export interface CustomerData {
  id: string;
  name: string;
  address: Address;
  email?: string;
  phone?: string;
}