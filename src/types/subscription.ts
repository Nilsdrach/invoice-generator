export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  subscription?: Subscription;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionPlan = 'free' | 'monthly' | 'yearly' | 'single';

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';

export interface PricingPlan {
  id: SubscriptionPlan;
  name: string;
  price: number;
  currency: string;
  interval?: 'month' | 'year' | 'once';
  features: string[];
  popular?: boolean;
  savings?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  clientSecret: string;
}

export interface InvoiceUsage {
  userId: string;
  invoiceCount: number;
  limit: number;
  resetDate: Date;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Kostenlos',
    price: 0,
    currency: 'EUR',
    features: [
      'Unbegrenzte Rechnungen erstellen',
      'Wasserzeichen auf allen PDFs',
      'Grundlegende Vorlagen',
      'E-Mail-Support verfügbar'
    ]
  },
  {
    id: 'monthly',
    name: 'Monatlich',
    price: 9.99,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Unbegrenzte Rechnungen ohne Wasserzeichen',
      'Alle Vorlagen verfügbar',
      'Prioritäts-Support',
      'Export in verschiedene Formate'
    ]
  },
  {
    id: 'yearly',
    name: 'Jährlich',
    price: 99.99,
    currency: 'EUR',
    interval: 'year',
    features: [
      'Unbegrenzte Rechnungen ohne Wasserzeichen',
      'Alle Vorlagen verfügbar',
      'Prioritäts-Support',
      'Export in verschiedene Formate'
    ],
    popular: true,
    savings: '2 Monate geschenkt'
  }
];

// Einmalzahlung-Plan (nicht in PRICING_PLANS angezeigt, aber für interne Verwendung)
export const SINGLE_PURCHASE_PLAN: PricingPlan = {
  id: 'single',
  name: 'Einmalzahlung',
  price: 1.99,
  currency: 'EUR',
  interval: 'once',
  features: [
    '1 Rechnung ohne Wasserzeichen',
    'Professionelle PDF-Qualität',
    'Sofortiger Download',
    'E-Mail-Support'
  ]
};

export const getPlanById = (id: SubscriptionPlan): PricingPlan | undefined => {
  // Zuerst in PRICING_PLANS suchen
  const plan = PRICING_PLANS.find(plan => plan.id === id);
  if (plan) return plan;
  
  // Falls nicht gefunden, prüfen ob es der single Plan ist
  if (id === 'single') return SINGLE_PURCHASE_PLAN;
  
  return undefined;
};

export const isSubscriptionActive = (subscription?: Subscription): boolean => {
  if (!subscription) return false;
  return subscription.status === 'active' || subscription.status === 'trialing';
};

export const canCreateInvoiceWithoutWatermark = (subscription?: Subscription): boolean => {
  if (!subscription) return false;
  return isSubscriptionActive(subscription) && subscription.plan !== 'free';
};

