import { supabase, DatabaseUser, DatabaseSubscription } from './supabase';

// User Management
export const supabaseService = {
  // User registrieren
  async registerUser(email: string, name: string, password: string): Promise<DatabaseUser | null> {
    try {
      // Prüfen ob User bereits existiert
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (existingUser) {
        throw new Error('Ein Konto mit dieser E-Mail-Adresse existiert bereits.');
      }

      // Neuen User erstellen
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email,
          name,
          password, // In Produktion würde das gehashed werden
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return newUser;
    } catch (error) {
      console.error('Fehler beim Registrieren des Users:', error);
      throw error;
    }
  },

  // User anmelden
  async loginUser(email: string, password: string): Promise<DatabaseUser | null> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Fehler beim Login des Users:', error);
      return null;
    }
  },

  // User erstellen oder aktualisieren
  async upsertUser(email: string, name: string): Promise<DatabaseUser | null> {
    try {
      // Prüfen ob User bereits existiert
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (existingUser) {
        // User existiert bereits, aktualisieren
        const { data: updatedUser, error } = await supabase
          .from('users')
          .update({ 
            name, 
            updated_at: new Date().toISOString() 
          })
          .eq('email', email)
          .select()
          .single();

        if (error) throw error;
        return updatedUser;
      } else {
        // Neuen User erstellen
        const { data: newUser, error } = await supabase
          .from('users')
          .insert({
            email,
            name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        return newUser;
      }
    } catch (error) {
      console.error('Fehler beim Erstellen/Aktualisieren des Users:', error);
      return null;
    }
  },

  // User nach E-Mail finden
  async getUserByEmail(email: string): Promise<DatabaseUser | null> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Fehler beim Finden des Users:', error);
      return null;
    }
  },

  // Subscription erstellen
  async createSubscription(
    userId: string,
    plan: 'monthly' | 'yearly',
    stripeSubscriptionId?: string
  ): Promise<DatabaseSubscription | null> {
    try {
      const currentDate = new Date();
      const periodEnd = new Date(
        currentDate.getTime() + 
        (plan === 'monthly' ? 30 * 24 * 60 * 60 * 1000 : 365 * 24 * 60 * 60 * 1000)
      );

      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan,
          status: 'active',
          current_period_start: currentDate.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          stripe_subscription_id: stripeSubscriptionId,
          created_at: currentDate.toISOString(),
          updated_at: currentDate.toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return subscription;
    } catch (error) {
      console.error('Fehler beim Erstellen der Subscription:', error);
      return null;
    }
  },

  // Aktive Subscription für User finden
  async getActiveSubscription(userId: string): Promise<DatabaseSubscription | null> {
    try {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = keine Ergebnisse
      return subscription;
    } catch (error) {
      console.error('Fehler beim Finden der aktiven Subscription:', error);
      return null;
    }
  },

  // Stripe Subscription ID aktualisieren
  async updateStripeSubscriptionId(
    subscriptionId: string,
    stripeSubscriptionId: string
  ): Promise<boolean> {
    try {
      console.log('Supabase: Aktualisiere Stripe Subscription ID...');
      console.log('Subscription ID:', subscriptionId);
      console.log('Stripe Subscription ID:', stripeSubscriptionId);
      
      const { error } = await supabase
        .from('subscriptions')
        .update({
          stripe_subscription_id: stripeSubscriptionId,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) {
        console.error('Supabase Update Error:', error);
        throw error;
      }
      
      console.log('Supabase: Stripe Subscription ID erfolgreich aktualisiert');
      return true;
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Stripe Subscription ID:', error);
      return false;
    }
  },

  // Subscription Status aktualisieren
  async updateSubscriptionStatus(
    subscriptionId: string,
    status: 'active' | 'expired' | 'cancelled'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Subscription-Status:', error);
      return false;
    }
  },

  // Alle abgelaufenen Subscriptions finden und deaktivieren
  async deactivateExpiredSubscriptions(): Promise<number> {
    try {
      const { data: expiredSubscriptions, error } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('status', 'active')
        .lt('current_period_end', new Date().toISOString());

      if (error) throw error;

      if (expiredSubscriptions && expiredSubscriptions.length > 0) {
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString()
          })
          .in('id', expiredSubscriptions.map(s => s.id));

        if (updateError) throw updateError;
        return expiredSubscriptions.length;
      }

      return 0;
    } catch (error) {
      console.error('Fehler beim Deaktivieren abgelaufener Subscriptions:', error);
      return 0;
    }
  }
};
