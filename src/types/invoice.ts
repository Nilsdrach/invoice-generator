export interface InvoiceItem {
  id: string;
  title: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceSender {
  name: string;
  address: string;
  email: string;
  phone: string;
  logo?: string; // Base64 encoded logo
}

export interface InvoiceRecipient {
  name: string;
  address: string;
  email: string;
}

export interface Invoice {
  invoiceNumber: string;
  invoiceDate: string;
  sender: InvoiceSender;
  recipient: InvoiceRecipient;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
}

export interface User {
  email: string;
  isPremium: boolean;
}