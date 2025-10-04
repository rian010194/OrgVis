# JumpYard Organization Chart - Setup Guide

Denna guide hjälper dig att komma igång med JumpYard Organization Chart med Supabase backend.

## 🚀 Snabbstart

### 1. Förutsättningar
- Node.js (version 16 eller senare)
- Git
- En webbläsare som stöder ES6 modules

### 2. Klona och installera
```bash
# Klona projektet (om du inte redan har det)
git clone <your-repo-url>
cd jumpyard-org-chart

# Installera dependencies
npm install
```

### 3. Sätt upp Supabase

#### Alternativ A: Använd Supabase Cloud (Rekommenderat för produktion)

1. **Skapa Supabase-projekt**
   - Gå till [supabase.com](https://supabase.com)
   - Skapa ett nytt konto eller logga in
   - Klicka "New Project"
   - Välj organisation och fyll i projektnamn
   - Välj region (Stockholm för Sverige)
   - Skapa projektet

2. **Konfigurera projektet**
   - Gå till Settings > API i ditt Supabase-projekt
   - Kopiera "Project URL" och "anon public" key
   - Öppna `js/config.js` i ditt projekt
   - Ersätt `your-project-ref.supabase.co` med din Project URL
   - Ersätt `your-anon-key-here` med din anon key

3. **Sätt upp databasen**
   ```bash
   # Installera Supabase CLI
   npm install -g supabase
   
   # Logga in på Supabase
   supabase login
   
   # Länka till ditt projekt
   supabase link --project-ref YOUR_PROJECT_REF
   
   # Kör migrations
   supabase db push
   
   # Seed databasen med testdata
   supabase db seed
   ```

#### Alternativ B: Lokal utveckling med Supabase CLI

1. **Starta lokal Supabase**
   ```bash
   # Starta Supabase lokalt
   supabase start
   
   # Kör migrations
   supabase db push
   
   # Seed databasen
   supabase db seed
   ```

2. **Konfigurera för lokal utveckling**
   - Öppna `js/config.js`
   - Använd dessa värden:
   ```javascript
   export const SUPABASE_CONFIG = {
     url: 'http://localhost:54321',
     anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
     debug: true
   };
   ```

### 4. Starta applikationen

```bash
# Starta en lokal webbserver (valfritt)
# Du kan också öppna index.html direkt i webbläsaren
python -m http.server 8000
# eller
npx serve .
```

Öppna `http://localhost:8000` i din webbläsare.

## 📊 Databas Schema

### Nodes (Organisationsnoder)
- `id` - Unik identifierare
- `name` - Namn på noden
- `type` - Typ (Unit, Group, Department, Individual, etc.)
- `role` - Rollbeskrivning
- `parent_id` - Referens till föräldernod
- `support_office_id` - Referens till support office
- `responsibilities` - JSON array av ansvarsområden
- `outcomes` - JSON array av deliverables

### Metrics (Mätvärden)
- `id` - Unik identifierare
- `node_id` - Referens till nod
- `name` - Namn på metric
- `type` - Visualiseringstyp (pie, bar, line, table)
- `unit` - Enhet
- `data` - JSON objekt med metric data

### Relations (Relationer)
- `id` - Unik identifierare
- `from_node_id` - Från-nod
- `to_node_id` - Till-nod
- `description` - Beskrivning av relationen

## 🔧 Utveckling

### Lägga till nya noder
```javascript
// Via admin-panelen i applikationen
// eller programmatiskt:
await OrgStore.addNode({
  id: 'new_node',
  name: 'New Node',
  type: 'Department',
  role: 'Description of role',
  parent: 'parent_node_id'
});
```

### Lägga till metrics
```javascript
await orgDb.createMetric('node_id', {
  name: 'Time spent on:',
  type: 'pie',
  unit: '%',
  data: {
    'Planning': 40,
    'Development': 35,
    'Testing': 25
  }
});
```

### Lägga till relationer
```javascript
await OrgStore.addLink({
  from: 'node_a',
  to: 'node_b',
  desc: 'Delivers reports to'
});
```

## 🚀 Deployment

### Frontend Deployment
1. **Vercel (Rekommenderat)**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Netlify**
   - Dra och släpp mappen till netlify.com
   - Eller använd Netlify CLI

3. **GitHub Pages**
   - Pusha till GitHub
   - Aktivera GitHub Pages i repository settings

### Backend (Supabase)
- Supabase hanterar hosting automatiskt
- Inga extra steg behövs för backend deployment

## 🔐 Säkerhet

### Row Level Security (RLS)
- Aktiverat på alla tabeller
- För närvarande tillåter alla operationer
- Kan begränsas senare med policies

### Autentisering
- Kan läggas till med Supabase Auth
- Stöder email, social login, etc.

## 🐛 Troubleshooting

### Vanliga problem

1. **"Failed to fetch" fel**
   - Kontrollera att SUPABASE_URL och SUPABASE_ANON_KEY är korrekt
   - Kontrollera CORS-inställningar i Supabase dashboard

2. **"Module not found" fel**
   - Kontrollera att alla script-taggar har `type="module"`
   - Kontrollera att filvägar är korrekta

3. **Databas-anslutning**
   - Kontrollera att migrations har körts: `supabase db push`
   - Kontrollera att seed-data finns: `supabase db seed`

4. **Real-time fungerar inte**
   - Kontrollera att RLS policies tillåter läsning
   - Kontrollera nätverksanslutning

### Debug-tips
- Öppna Developer Tools (F12) för att se fel
- Kontrollera Network-tabben för API-anrop
- Använd `console.log` för debugging

## 📚 Ytterligare resurser

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [D3.js Documentation](https://d3js.org/)

## 🤝 Support

För support eller frågor:
1. Kontrollera denna guide först
2. Kolla Supabase dokumentation
3. Skapa en issue i projektet
