# Invoice Generator - Professioneller Rechnungsgenerator

Ein moderner, responsiver Rechnungsgenerator mit Abonnement-System für professionelle PDF-Erstellung ohne Wasserzeichen.

## 🚀 Features

### Kostenlose Version
- ✅ Unbegrenzte Rechnungen erstellen
- ✅ Professionelle Rechnungsvorlagen
- ✅ UStG-konforme Rechnungen
- ✅ Responsive Design für alle Geräte
- ⚠️ Wasserzeichen auf allen PDFs

### Pro-Version (Abonnement)
- ✅ Alle Features der kostenlosen Version
- ✅ PDFs ohne Wasserzeichen
- ✅ Erweiterte Vorlagen
- ✅ Prioritäts-Support
- ✅ Cloud-Speicher für Rechnungen
- ✅ Export in verschiedene Formate

## 💰 Preismodell

| Plan | Preis | Features |
|------|-------|----------|
| **Kostenlos** | €0 | Grundfunktionen + Wasserzeichen |
| **Einmalzahlung** | €1,99 | 1 Rechnung ohne Wasserzeichen |
| **Monatlich** | €9,99 | Unbegrenzte Rechnungen ohne Wasserzeichen |
| **Jährlich** | €99,99 | Unbegrenzte Rechnungen + 2 Monate geschenkt |

## 🛠️ Technische Details

### Frontend
- **React 18** mit TypeScript
- **Tailwind CSS** für responsives Design
- **Lucide React** für Icons
- **Vite** als Build-Tool

### Responsive Design
- Mobile-First Ansatz
- Optimiert für alle Bildschirmgrößen
- Flexible Grid-Layouts
- Adaptive Typography und Spacing

### Komponenten
- `InvoiceForm`: Vollständiges Rechnungsformular
- `InvoicePreview`: Live-Vorschau der Rechnung
- `Pricing`: Abonnement-Auswahl
- `Payment`: Zahlungsabwicklung
- `LogoUpload`: Logo-Upload mit Vorschau

## 📱 Responsive Breakpoints

- **xs**: 475px (sehr kleine Mobilgeräte)
- **sm**: 640px (kleine Mobilgeräte)
- **md**: 768px (Tablets)
- **lg**: 1024px (kleine Desktops)
- **xl**: 1280px (große Desktops)
- **2xl**: 1536px (sehr große Bildschirme)

## 🎨 Design-System

### Farben
- **Primary**: #9B1D20 (Brand-Rot)
- **Success**: #16A34A (Grün)
- **Warning**: #CA8A04 (Gelb)
- **Error**: #DC2626 (Rot)

### Typography
- Responsive Schriftgrößen
- Optimierte Zeilenhöhen
- Klare Hierarchie

### Spacing
- Konsistente Abstände
- Responsive Margins und Paddings
- Flexible Grid-Systeme

## 🔧 Installation

```bash
# Repository klonen
git clone [repository-url]
cd invoice

# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev

# Build erstellen
npm run build
```

## 📋 Verwendung

### 1. Rechnung erstellen
- Füllen Sie alle Pflichtfelder aus
- Fügen Sie Leistungspositionen hinzu
- Nutzen Sie die Live-Vorschau

### 2. Abonnement wählen
- Navigieren Sie zu "Preise & Abonnements"
- Wählen Sie Ihren gewünschten Plan
- Abschließen der Zahlung

### 3. PDF generieren
- Mit kostenlosem Plan: PDF mit Wasserzeichen
- Mit Pro-Plan: PDF ohne Wasserzeichen

## 🔒 Sicherheit

- Alle Zahlungsdaten werden verschlüsselt übertragen
- Sichere Authentifizierung
- DSGVO-konform
- Regelmäßige Sicherheitsupdates

## 🚧 Backend-Integration (Geplant)

### Benötigte Services
- **Authentication-System** (JWT, OAuth)
- **Datenbank** (PostgreSQL/MongoDB)
- **Zahlungsabwicklung** (Stripe)
- **PDF-Generierung** (Server-seitig)
- **Cloud-Speicher** (AWS S3/Azure Blob)

### API-Endpoints
```
POST /api/auth/register
POST /api/auth/login
POST /api/subscriptions/create
POST /api/invoices/generate
GET  /api/user/profile
PUT  /api/user/profile
```

## 📊 Performance

- Lazy Loading für Komponenten
- Optimierte Bundle-Größe
- Effiziente State-Management
- Responsive Images

## 🌐 Browser-Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📱 Mobile-Features

- Touch-optimierte Bedienung
- Responsive Tabellen
- Mobile-spezifische Layouts
- Optimierte Formulare

## 🔄 Updates & Wartung

- Regelmäßige Feature-Updates
- Bug-Fixes und Verbesserungen
- Neue Vorlagen und Funktionen
- Community-Feedback integriert

## 🤝 Beitragen

1. Fork des Repositories
2. Feature-Branch erstellen
3. Änderungen committen
4. Pull Request erstellen

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.

## 📞 Support

- **E-Mail**: support@invoice-generator.com
- **Dokumentation**: [docs.invoice-generator.com]
- **Community**: [community.invoice-generator.com]

## 🎯 Roadmap

### Phase 1 (Aktuell)
- ✅ Grundfunktionen
- ✅ Responsive Design
- ✅ Abonnement-System (Frontend)

### Phase 2 (Geplant)
- 🔄 Backend-Integration
- 🔄 Echte Zahlungsabwicklung
- 🔄 Benutzer-Management

### Phase 3 (Zukunft)
- 🔄 Team-Funktionen
- 🔄 API für Entwickler
- 🔄 Mobile App

---

**Entwickelt mit ❤️ für professionelle Rechnungserstellung**

