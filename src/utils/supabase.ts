import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qxhbxmglobiccfqspdip.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aGJ4bWdsb2JpY2NmcXNwZGlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzMzg3NjIsImV4cCI6MjA3MDkxNDc2Mn0.PFZQj2G1j17J9owBUiwdwzZL5bnZFFXRyAvzkrtQ9eQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Datenbank-Typen
export interface DatabaseUser {
  id: string;
  email: string;
  name: string;
  password: string; // Passwort für Authentifizierung
  created_at: string;
  updated_at: string;
}

export interface DatabaseSubscription {
  id: string;
  user_id: string;
  plan: 'monthly' | 'yearly';
  status: 'active' | 'expired' | 'cancelled';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id?: string;
  created_at: string;
  updated_at: string;
}
