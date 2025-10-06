# Quick Start Guide - Supabase Cloud

## 🚀 Snabbstart utan CLI

### Steg 1: Skapa Supabase-projekt
1. Gå till [supabase.com](https://supabase.com)
2. Klicka "Start your project" 
3. Logga in med GitHub/GitLab/Google
4. Klicka "New Project"
5. Fyll i:
   - **Name**: `organization-chart`
   - **Database Password**: Välj ett starkt lösenord
   - **Region**: Stockholm (närmast Sverige)
6. Klicka "Create new project"

### Steg 2: Konfigurera databas
1. När projektet är skapat, gå till **SQL Editor** i vänster meny
2. Klicka "New query"
3. Kopiera och klistra in följande SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create nodes table
CREATE TABLE nodes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Unit',
    role TEXT DEFAULT '',
    parent_id TEXT REFERENCES nodes(id) ON DELETE SET NULL,
    support_office_id TEXT,
    responsibilities JSONB DEFAULT '[]'::jsonb,
    outcomes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create metrics table
CREATE TABLE metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Time spent on:',
    type TEXT NOT NULL DEFAULT 'pie',
    unit TEXT NOT NULL DEFAULT '%',
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create relations table
CREATE TABLE relations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_node_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    to_node_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    description TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_node_id, to_node_id, description)
);

-- Create indexes
CREATE INDEX idx_nodes_parent_id ON nodes(parent_id);
CREATE INDEX idx_nodes_type ON nodes(type);
CREATE INDEX idx_metrics_node_id ON metrics(node_id);
CREATE INDEX idx_relations_from_node ON relations(from_node_id);
CREATE INDEX idx_relations_to_node ON relations(to_node_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_nodes_updated_at BEFORE UPDATE ON nodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metrics_updated_at BEFORE UPDATE ON metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relations_updated_at BEFORE UPDATE ON relations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE relations ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now)
CREATE POLICY "Allow all operations on nodes" ON nodes
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on metrics" ON metrics
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on relations" ON relations
    FOR ALL USING (true);
```

4. Klicka **Run** för att köra SQL-koden

### Steg 3: Lägg till testdata
1. Skapa en ny SQL query
2. Kopiera och klistra in följande:

```sql
-- Insert test nodes
INSERT INTO nodes (id, name, type, role, parent_id, support_office_id, responsibilities, outcomes) VALUES
('leadership_team', 'Leadership Team', 'Unit', 'Sätter riktningen och säkrar att hela verksamheten arbetar mot samma mål.', null, null, 
 '["Definiera bolagets strategiska prioriteringar", "Tilldela resurser mellan regioner och supportorganisation"]',
 '["Affärsplaner per region", "Beslut om investeringar och expansion"]'),

('ceo', 'CEO', 'Individual', 'Driver kund- och expansionsagenda globalt.', 'leadership_team', null,
 '["Kommunicera vision och värderingar", "Prioritera marknadsexpansion"]',
 '["Godkänd expansionsplan", "Uppdaterad kundstrategi"]'),

('coo', 'COO', 'Individual', 'Driver den globala driften och utvecklar regionernas kapacitet.', 'leadership_team', null,
 '["Skala best practice mellan regioner", "Säkra att supportfunktionerna levererar"]',
 '["Driftplaner per region", "Beslut om nya supportinitiativ"]'),

('cfo', 'CFO', 'Individual', 'Övergripande finansiellt ansvar.', 'leadership_team', null,
 '["Kapitalstruktur och kassaflöde", "Styrning av investeringar"]',
 '["Godkända budgetar", "Finansiella rapporter"]'),

('global_operations', 'Global Operations', 'PO', 'Samordnar regioner och supportorganisation globalt.', 'coo', 'support_office_global',
 '["Översätta strategi till operativ plan", "Fördela resurser mellan regioner"]',
 '["Gemensamma arbetssätt", "Årsplaner per region"]'),

('support_office_global', 'Support Office Global', 'SupportOffice', 'Sätter globala standarder och ger expertis till regionerna.', 'global_operations', null,
 '["Definiera policys och processer", "Stötta regionerna med expertteam", "Vakta varumärke och säkerhetsnivå"]',
 '["Konsoliderade KPI-ramar", "Governance-modell", "Gemensamma utbildningspaket"]');

-- Insert sample metrics
INSERT INTO metrics (node_id, name, type, unit, data) VALUES
('leadership_team', 'Time spent on:', 'pie', '%', '{"Strategisk planering": 35, "Ledningsmöten": 25, "Resursallokering": 20, "Riskanalys": 15, "Extern kommunikation": 5}'),
('global_operations', 'Time spent on:', 'pie', '%', '{"Regionala driftsforum": 30, "Incidentuppföljningar": 25, "Strategi till operation": 20, "Resursfördelning": 15, "Best practice delning": 10}'),
('support_office_global', 'Time spent on:', 'pie', '%', '{"Utveckla globala manualer": 35, "Cross-region projekt": 25, "Koordinera utbildningar": 20, "Governance & standarder": 15, "Expertstöd till regioner": 5}');

-- Insert sample relations
INSERT INTO relations (from_node_id, to_node_id, description) VALUES
('support_office_global', 'global_operations', 'Strategiska ramar'),
('global_operations', 'leadership_team', 'Operativa rapporter'),
('ceo', 'global_operations', 'Strategisk riktning');
```

3. Klicka **Run** för att lägga till testdata

### Steg 4: Konfigurera frontend
1. Gå till **Settings** > **API** i Supabase dashboard
2. Kopiera:
   - **Project URL** (ser ut som: `https://xxxxx.supabase.co`)
   - **anon public** key (lång sträng som börjar med `eyJ...`)

3. Öppna `js/config.js` i ditt projekt
4. Ersätt värdena:

```javascript
export const SUPABASE_CONFIG = {
  url: 'https://DIN-PROJECT-URL.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpaGdwdGNmaGFldWp4aHB2YW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDUyMzMsImV4cCI6MjA3NTA4MTIzM30.ZnGwhkJ6tJWV_jyKMOQ7NE8oS0iZTmR7u3171KpX_SU',
  debug: true
};
```

### Steg 5: Testa applikationen
1. Öppna `index.html` i din webbläsare
2. Du bör se organisationskartan med data från Supabase
3. Testa att lägga till/redigera noder via admin-panelen

## ✅ Klar!

Nu har du:
- ✅ Supabase-projekt skapat
- ✅ Databas konfigurerad
- ✅ Testdata inlagd
- ✅ Frontend konfigurerad
- ✅ Allt fungerar tillsammans

## 🔧 Nästa steg

När du vill lägga till fler noder eller metrics, kan du:
1. Använda admin-panelen i applikationen
2. Eller lägga till direkt i Supabase dashboard under **Table Editor**

## 🆘 Hjälp behövs?

Om något inte fungerar:
1. Kontrollera att du kopierade rätt URL och key
2. Kontrollera att SQL-koden kördes utan fel
3. Öppna Developer Tools (F12) för att se eventuella fel
