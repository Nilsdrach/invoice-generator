# Invoice Generator - Rechnungserstellungs-App

Eine moderne React-basierte Webanwendung zur einfachen Erstellung professioneller Rechnungen mit PDF-Export.

## 🚀 Features

- **Live-Vorschau**: HTML-Vorschau der Rechnung aktualisiert sich in Echtzeit
- **Logo-Upload**: Unterstützung für Firmenlogos (Base64-kodiert)
- **Premium-System**: Login-System mit LocalStorage für Premium-User
- **Wasserzeichen**: Automatisches Wasserzeichen für kostenlose Nutzer
- **Responsive Design**: Optimiert für Desktop und Mobile
- **PDF-Export**: Professionelle PDF-Generierung mit jsPDF
- **Mehrwertsteuer**: Automatische Berechnung der MwSt. (19%)

## 🛠️ Technologien

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **PDF-Generierung**: jsPDF
- **Icons**: Lucide React

## 📱 Mobile-Optimierung

- Responsive Grid-Layout
- Touch-freundliche Buttons
- Optimierte Schriftgrößen
- Mobile-first Design-Ansatz

## 🔐 Premium-Features

- **Kostenlose Nutzer**: Wasserzeichen im PDF
- **Premium-User**: Keine Wasserzeichen
- **Demo-Login**: E-Mail mit "premium" = Premium-Status

## 🚀 Installation & Entwicklung

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev

# Produktions-Build erstellen
npm run build

# Build vorschauen
npm run preview
```

## 📦 Deployment

### Netlify
1. Repository zu Netlify verbinden
2. Build-Befehl: `npm run build`
3. Publish-Verzeichnis: `dist`
4. Automatisches Deployment bei Git-Push

### Vercel
1. Repository zu Vercel verbinden
2. Framework: Vite
3. Build-Befehl: `npm run build`
4. Output-Verzeichnis: `dist`

## 📁 Projektstruktur

```
src/
├── components/          # React-Komponenten
│   ├── InvoiceForm.tsx # Rechnungsformular
│   ├── InvoicePreview.tsx # Live-Vorschau
│   ├── Login.tsx       # Login-System
│   └── LogoUpload.tsx  # Logo-Upload
├── types/
│   └── invoice.ts      # TypeScript-Interfaces
├── utils/
│   └── pdfGenerator.ts # PDF-Generierung
└── App.tsx             # Hauptkomponente
```

## 🎨 Anpassungen

### Farben
Die App verwendet ein klares Farbschema:
- Primärfarbe: `#9B1D20` (Dunkelrot)
- Hover-Effekte: `#8A1A1D`
- Hintergründe: Grau-Skala

### Styling
- Tailwind CSS für konsistentes Design
- Responsive Breakpoints: `sm:`, `md:`, `lg:`
- Mobile-first Ansatz

## 🔧 Konfiguration

### MwSt.-Satz
Standardmäßig wird 19% MwSt. berechnet. Ändern Sie den Wert in `InvoiceForm.tsx`:

```typescript
const tax = subtotal * 0.19; // Ändern Sie 0.19 auf gewünschten Satz
```

### Wasserzeichen-Text
Der Wasserzeichen-Text kann in `pdfGenerator.ts` angepasst werden:

```typescript
doc.text('Erstellt mit Rechnung10Sekunden.de', 0, 0, { align: 'center' });
```

## 📝 Verwendung

1. **Rechnung erstellen**: Füllen Sie alle Felder aus
2. **Logo hochladen**: Optional ein Firmenlogo hinzufügen
3. **Positionen**: Produkte/Dienstleistungen mit Mengen und Preisen
4. **Vorschau**: Überprüfen Sie die Rechnung in der Live-Vorschau
5. **PDF exportieren**: Generieren Sie die finale PDF-Rechnung

## 🤝 Beitragen

1. Repository forken
2. Feature-Branch erstellen
3. Änderungen committen
4. Pull Request erstellen

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz.

## 🆘 Support

Bei Fragen oder Problemen erstellen Sie ein Issue im Repository.

---

**Entwickelt mit ❤️ für einfache Rechnungserstellung**
