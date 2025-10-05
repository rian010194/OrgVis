-- Supabase Database Setup for Organization Visualization (Safe Version)
-- This version handles existing tables gracefully

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS relations CASCADE;
DROP TABLE IF EXISTS metrics CASCADE;
DROP TABLE IF EXISTS nodes CASCADE;

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_nodes_parent_id ON nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(type);
CREATE INDEX IF NOT EXISTS idx_metrics_node_id ON metrics(node_id);
CREATE INDEX IF NOT EXISTS idx_relations_from_node ON relations(from_node_id);
CREATE INDEX IF NOT EXISTS idx_relations_to_node ON relations(to_node_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_nodes_updated_at ON nodes;
DROP TRIGGER IF EXISTS update_metrics_updated_at ON metrics;
DROP TRIGGER IF EXISTS update_relations_updated_at ON relations;

-- Create triggers to automatically update updated_at timestamps
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations on nodes" ON nodes;
DROP POLICY IF EXISTS "Allow all operations on metrics" ON metrics;
DROP POLICY IF EXISTS "Allow all operations on relations" ON relations;

-- Create policies (allow all for now - you can make these more restrictive later)
CREATE POLICY "Allow all operations on nodes" ON nodes
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on metrics" ON metrics
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on relations" ON relations
    FOR ALL USING (true);

-- Insert sample data from mock/org.json
-- This will populate the database with the same data as your mock file

-- Insert nodes
INSERT INTO nodes (id, name, type, role, parent_id, support_office_id, responsibilities, outcomes) VALUES
('leadership_team', 'Leadership Team', 'Unit', 'Sätter riktningen och säkrar att hela verksamheten arbetar mot samma mål.', NULL, NULL, 
 '["Definiera bolagets strategiska prioriteringar", "Tilldela resurser mellan regioner och supportorganisation"]'::jsonb,
 '["Affärsplaner per region", "Beslut om investeringar och expansion"]'::jsonb),

('ceo', 'CEO', 'Individual', 'Driver kund- och expansionsagenda globalt.', 'leadership_team', NULL,
 '["Kommunicera vision och värderingar", "Prioritera marknadsexpansion"]'::jsonb,
 '["Godkänd expansionsplan", "Uppdaterad kundstrategi"]'::jsonb),

('coo', 'COO', 'Individual', 'Driver den globala driften och utvecklar regionernas kapacitet.', 'leadership_team', NULL,
 '["Skala best practice mellan regioner", "Säkra att supportfunktionerna levererar"]'::jsonb,
 '["Driftplaner per region", "Beslut om nya supportinitiativ"]'::jsonb),

('cfo', 'CFO', 'Individual', 'Övergripande finansiellt ansvar.', 'leadership_team', NULL,
 '["Kapitalstruktur och kassaflöde", "Styrning av investeringar"]'::jsonb,
 '["Godkända budgetar", "Finansiella rapporter"]'::jsonb),

('global_operations', 'Global Operations', 'PO', 'Samordnar regioner och supportorganisation globalt.', 'coo', 'support_office_global',
 '["Översätta strategi till operativ plan", "Fördela resurser mellan regioner"]'::jsonb,
 '["Gemensamma arbetssätt", "Årsplaner per region"]'::jsonb),

('support_office_global', 'Support Office Global', 'SupportOffice', 'Sätter globala standarder och ger expertis till regionerna.', 'global_operations', NULL,
 '["Definiera policys och processer", "Stötta regionerna med expertteam", "Vakta varumärke och säkerhetsnivå"]'::jsonb,
 '["Konsoliderade KPI-ramar", "Governance-modell", "Gemensamma utbildningspaket"]'::jsonb)

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    role = EXCLUDED.role,
    parent_id = EXCLUDED.parent_id,
    support_office_id = EXCLUDED.support_office_id,
    responsibilities = EXCLUDED.responsibilities,
    outcomes = EXCLUDED.outcomes,
    updated_at = NOW();

-- Clear existing metrics first
DELETE FROM metrics WHERE node_id IN ('leadership_team', 'global_operations', 'support_office_global');

-- Insert metrics for leadership_team
INSERT INTO metrics (node_id, name, type, unit, data) VALUES
('leadership_team', 'Time spent on:', 'pie', '%', 
 '{"Strategisk planering": 35, "Ledningsmöten": 25, "Resursallokering": 20, "Riskanalys": 15, "Extern kommunikation": 5}'::jsonb),

-- Insert metrics for global_operations
('global_operations', 'Time spent on:', 'pie', '%', 
 '{"Regionala driftsforum": 30, "Incidentuppföljningar": 25, "Strategi till operation": 20, "Resursfördelning": 15, "Best practice delning": 10}'::jsonb),

-- Insert metrics for support_office_global
('support_office_global', 'Time spent on:', 'pie', '%', 
 '{"Utveckla globala manualer": 35, "Cross-region projekt": 25, "Koordinera utbildningar": 20, "Governance & standarder": 15, "Expertstöd till regioner": 5}'::jsonb);

-- Insert some relations
INSERT INTO relations (from_node_id, to_node_id, description) VALUES
('support_office_global', 'ceo', 'Globala standards'),
('global_operations', 'ceo', 'Operativa rapporter'),
('cfo', 'global_operations', 'Strategisk riktning'),
('support_office_global', 'global_operations', 'Governance och standarder')

ON CONFLICT (from_node_id, to_node_id, description) DO NOTHING;

-- Verify the setup
SELECT 'Database setup completed successfully!' as status;
SELECT COUNT(*) as total_nodes FROM nodes;
SELECT COUNT(*) as total_metrics FROM metrics;
SELECT COUNT(*) as total_relations FROM relations;
