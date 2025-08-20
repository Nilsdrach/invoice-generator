-- Kompletter Reset der Datenbank
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- users Tabelle mit Passwort
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  isPro BOOLEAN DEFAULT FALSE,
  proExpiresAt TIMESTAMP WITH TIME ZONE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- pro_subscriptions Tabelle
CREATE TABLE pro_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  userId UUID REFERENCES users(id) ON DELETE CASCADE,
  stripePriceId TEXT NOT NULL,
  stripeSubscriptionId TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('active', 'canceled', 'expired')) DEFAULT 'active',
  currentPeriodStart TIMESTAMP WITH TIME ZONE NOT NULL,
  currentPeriodEnd TIMESTAMP WITH TIME ZONE NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexe erstellen
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_pro_subscriptions_user_id ON pro_subscriptions(userId);
CREATE INDEX idx_pro_subscriptions_stripe_id ON pro_subscriptions(stripeSubscriptionId);

-- Trigger-Funktion für updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger für beide Tabellen
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pro_subscriptions_updated_at 
  BEFORE UPDATE ON pro_subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) aktivieren
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies für users Tabelle
CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read user data" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (true);

-- Policies für pro_subscriptions Tabelle
CREATE POLICY "Anyone can create subscriptions" ON pro_subscriptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read subscriptions" ON pro_subscriptions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update subscriptions" ON pro_subscriptions
  FOR UPDATE USING (true);




