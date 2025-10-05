-- Supabase Database Setup for Organization Visualization
-- Run this script in your Supabase SQL editor to set up the database

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

-- Create indexes for better performance
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
 '["Konsoliderade KPI-ramar", "Governance-modell", "Gemensamma utbildningspaket"]'::jsonb);

-- Insert metrics for leadership_team
INSERT INTO metrics (node_id, name, type, unit, data) VALUES
('leadership_team', 'Time spent on:', 'pie', '%', 
 '{"Strategisk planering": 35, "Ledningsmöten": 25, "Resursallokering": 20, "Riskanalys": 15, "Extern kommunikation": 5}'::jsonb);

-- Insert metrics for global_operations
INSERT INTO metrics (node_id, name, type, unit, data) VALUES
('global_operations', 'Time spent on:', 'pie', '%', 
 '{"Regionala driftsforum": 30, "Incidentuppföljningar": 25, "Strategi till operation": 20, "Resursfördelning": 15, "Best practice delning": 10}'::jsonb);

-- Insert metrics for support_office_global
INSERT INTO metrics (node_id, name, type, unit, data) VALUES
('support_office_global', 'Time spent on:', 'pie', '%', 
 '{"Utveckla globala manualer": 35, "Cross-region projekt": 25, "Koordinera utbildningar": 20, "Governance & standarder": 15, "Expertstöd till regioner": 5}'::jsonb);

-- Insert some relations
INSERT INTO relations (from_node_id, to_node_id, description) VALUES
('support_office_global', 'ceo', 'Globala standards'),
('global_operations', 'ceo', 'Operativa rapporter'),
('cfo', 'global_operations', 'Strategisk riktning'),
('support_office_global', 'global_operations', 'Governance och standarder');

-- Verify the setup
SELECT 'Database setup completed successfully!' as status;
SELECT COUNT(*) as total_nodes FROM nodes;
SELECT COUNT(*) as total_metrics FROM metrics;
SELECT COUNT(*) as total_relations FROM relations;
