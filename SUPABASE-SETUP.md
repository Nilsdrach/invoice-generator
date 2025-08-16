# Supabase Setup für Invoice Generator

## 🚀 **Schritt 1: Supabase Tabellen erstellen**

**Gehe zu deinem Supabase Dashboard:**
1. **SQL Editor** → **New Query**
2. **Kopiere den Inhalt von `supabase-setup.sql`**
3. **Führe die SQL-Befehle aus**

## 🔑 **Schritt 2: Stripe Webhook einrichten**

**Gehe zu deinem Stripe Dashboard:**
1. **Developers** → **Webhooks**
2. **Add endpoint**
3. **URL:** `https://deine-domain.netlify.app/.netlify/functions/stripe-webhook`
4. **Events auswählen:**
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## 🌐 **Schritt 3: Environment Variables in Netlify**

**Füge diese Environment Variables hinzu:**
```bash
STRIPE_SECRET_KEY=sk_test_... # Dein Stripe Secret Key
STRIPE_MONTHLY_PRICE_ID=price_1RwQu1BdLY4NC8JCEMQjDsAG
STRIPE_YEARLY_PRICE_ID=price_1RwQubBdLY4NC8JCEMQjDsAG
STRIPE_WEBHOOK_SECRET=whsec_... # Von Stripe Webhook kopieren
```

## ✅ **Schritt 4: Testen**

1. **Deploye die Änderungen** auf Netlify
2. **Kaufe ein Test-Abonnement**
3. **Prüfe ob Daten in Supabase gespeichert werden**
4. **Lade die Seite neu** - Status sollte erhalten bleiben!

## 🎯 **Was jetzt funktioniert:**

- ✅ **Zentrale Datenspeicherung** in Supabase
- ✅ **Alle Nutzer weltweit** können sich registrieren
- ✅ **Abonnements bleiben** bei jedem Gerät erhalten
- ✅ **Echte Produktions-App** für alle! ✨

## 🔧 **Falls etwas nicht funktioniert:**

1. **Prüfe Supabase Logs** im Dashboard
2. **Prüfe Netlify Function Logs**
3. **Prüfe Browser Console** für Fehlermeldungen
4. **Stelle sicher dass alle Environment Variables gesetzt sind**

## 🚀 **Nächste Schritte (optional):**

- **Benutzer-Login/Register** System
- **Passwort-Reset** Funktionalität
- **E-Mail-Benachrichtigungen**
- **Admin-Dashboard** für Abonnements
