import { supabase } from './supabase';

export interface User {
  id: string;
  email: string;
  name: string;
  isPro: boolean;
  proExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProSubscription {
  id: string;
  userId: string;
  stripePriceId: string;
  stripeSubscriptionId: string;
  status: 'active' | 'canceled' | 'expired';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
  updatedAt: string;
}

// User erstellen oder aktualisieren
export const upsertUser = async (email: string, name: string): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .upsert(
      { 
        email, 
        name, 
        isPro: false,
        updatedAt: new Date().toISOString()
      },
      { 
        onConflict: 'email',
        ignoreDuplicates: false
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error upserting user:', error);
    throw new Error('Fehler beim Erstellen/Aktualisieren des Benutzers');
  }

  return data;
};

// User nach E-Mail finden
export const getUserByEmail = async (email: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error getting user:', error);
    throw new Error('Fehler beim Laden des Benutzers');
  }

  return data;
};

// Pro-Status für User setzen
export const setUserProStatus = async (email: string, isPro: boolean, expiresAt?: string): Promise<void> => {
  const { error } = await supabase
    .from('users')
    .update({ 
      isPro, 
      proExpiresAt: expiresAt,
      updatedAt: new Date().toISOString()
    })
    .eq('email', email);

  if (error) {
    console.error('Error updating user pro status:', error);
    throw new Error('Fehler beim Aktualisieren des Pro-Status');
  }
};

// Pro-Subscription erstellen
export const createProSubscription = async (
  email: string, 
  stripePriceId: string, 
  stripeSubscriptionId: string
): Promise<void> => {
  // Erst User finden
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error('Benutzer nicht gefunden');
  }

  // Pro-Status setzen
  await setUserProStatus(email, true);

  // Subscription in Datenbank speichern
  const { error } = await supabase
    .from('pro_subscriptions')
    .insert({
      userId: user.id,
      stripePriceId,
      stripeSubscriptionId,
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 Tage
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

  if (error) {
    console.error('Error creating subscription:', error);
    throw new Error('Fehler beim Erstellen der Subscription');
  }
};
