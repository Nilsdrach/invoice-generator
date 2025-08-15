# Backend-Integration für Invoice Generator

Dieses Verzeichnis enthält Beispiele und Strukturen für die Backend-Integration des Abonnement-Systems.

## 🏗️ Architektur

### Empfohlene Tech-Stack
- **Node.js** mit Express.js
- **PostgreSQL** für Benutzerdaten und Abonnements
- **Redis** für Session-Management
- **Stripe** für Zahlungsabwicklung
- **JWT** für Authentifizierung

## 📁 Projektstruktur

```
backend/
├── src/
│   ├── controllers/          # API-Controller
│   ├── models/              # Datenbank-Modelle
│   ├── routes/              # API-Routen
│   ├── middleware/          # Middleware (Auth, Validation)
│   ├── services/            # Business Logic
│   ├── utils/               # Hilfsfunktionen
│   └── config/              # Konfiguration
├── database/
│   ├── migrations/          # Datenbank-Migrationen
│   └── seeds/               # Testdaten
├── tests/                   # Unit und Integration Tests
├── docs/                    # API-Dokumentation
└── package.json
```

## 🔐 Authentifizierung

### JWT-Token-Struktur
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "uuid",
    "email": "user@example.com",
    "subscription": "monthly",
    "exp": 1640995200,
    "iat": 1640908800
  }
}
```

### Middleware
```typescript
// auth.middleware.ts
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};
```

## 💳 Stripe-Integration

### Webhook-Handler
```typescript
// webhooks.controller.ts
export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
  }

  res.json({ received: true });
};
```

## 🗄️ Datenbank-Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL CHECK (plan IN ('free', 'monthly', 'yearly', 'single')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Invoices Table
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  invoice_number VARCHAR(255) NOT NULL,
  invoice_data JSONB NOT NULL,
  pdf_url VARCHAR(500),
  watermark_removed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 API-Endpoints

### Authentifizierung
```
POST /api/auth/register     # Benutzer registrieren
POST /api/auth/login        # Benutzer anmelden
POST /api/auth/refresh      # Token erneuern
POST /api/auth/logout       # Abmelden
POST /api/auth/forgot-password # Passwort vergessen
POST /api/auth/reset-password  # Passwort zurücksetzen
```

### Benutzer
```
GET    /api/user/profile           # Profil abrufen
PUT    /api/user/profile           # Profil aktualisieren
DELETE /api/user/profile           # Konto löschen
GET    /api/user/invoices          # Rechnungen abrufen
POST   /api/user/invoices          # Neue Rechnung erstellen
```

### Abonnements
```
GET    /api/subscriptions          # Aktuelles Abonnement
POST   /api/subscriptions          # Abonnement erstellen
PUT    /api/subscriptions          # Abonnement aktualisieren
DELETE /api/subscriptions          # Abonnement kündigen
POST   /api/subscriptions/cancel   # Abonnement kündigen
```

### Zahlungen
```
POST   /api/payments/create-intent # Zahlungsabsicht erstellen
POST   /api/payments/confirm       # Zahlung bestätigen
GET    /api/payments/history       # Zahlungshistorie
POST   /api/payments/webhook       # Stripe Webhook
```

### PDF-Generierung
```
POST   /api/pdf/generate           # PDF generieren
GET    /api/pdf/download/:id       # PDF herunterladen
POST   /api/pdf/watermark-remove   # Wasserzeichen entfernen
```

## 🔒 Sicherheit

### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 5, // Max 5 Versuche
  message: 'Zu viele Anmeldeversuche, versuchen Sie es später erneut'
});
```

### CORS-Konfiguration
```typescript
import cors from 'cors';

const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

### Helmet.js für Sicherheits-Header
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

## 🧪 Testing

### Jest-Konfiguration
```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
};
```

### Test-Beispiel
```typescript
// auth.test.ts
describe('Authentication', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
  });
});
```

## 📊 Monitoring & Logging

### Winston Logger
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Health Check
```typescript
app.get('/health', async (req, res) => {
  try {
    // Datenbank-Verbindung testen
    await db.query('SELECT 1');
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

## 🚀 Deployment

### Docker
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Environment Variables
```bash
# .env.example
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
DATABASE_URL=postgresql://user:password@localhost:5432/invoice_generator
REDIS_URL=redis://localhost:6379
```

## 📈 Performance-Optimierung

### Caching-Strategien
- Redis für Session-Daten
- In-Memory-Caching für häufige Abfragen
- CDN für statische Assets

### Datenbank-Optimierung
- Indizes für häufige Abfragen
- Connection Pooling
- Query-Optimierung

### API-Optimierung
- Pagination für große Datensätze
- Lazy Loading
- GraphQL für flexible Abfragen

---

**Hinweis**: Dies ist eine Beispiel-Implementierung. Für den Produktiveinsatz sollten Sie:
- Umfassende Tests schreiben
- Sicherheitsaudits durchführen
- Performance-Monitoring implementieren
- Backup-Strategien entwickeln
- Disaster Recovery planen


