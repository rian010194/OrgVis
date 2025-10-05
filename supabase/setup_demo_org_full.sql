-- Create Demo Organization with Full JumpYard Structure
-- This script creates a demo organization with the complete organizational structure
-- but uses "Test" as the organization name to match your localStorage setup

-- Insert demo organization with Test branding
INSERT INTO organizations (id, name, description, type, password_hash, branding) VALUES
('demo_org', 'Test', 'Demo organization with sample data and structure', 'company', 
 NULL, -- No password required
 '{"primaryColor": "#ff5a00", "secondaryColor": "#e53e3e", "fontFamily": "system", "fontSize": "16", "logo": null}'::jsonb)

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    type = EXCLUDED.type,
    password_hash = EXCLUDED.password_hash,
    branding = EXCLUDED.branding,
    updated_at = NOW();

-- Clear existing data for demo_org
DELETE FROM relations WHERE organization_id = 'demo_org';
DELETE FROM metrics WHERE organization_id = 'demo_org';
DELETE FROM nodes WHERE organization_id = 'demo_org';

-- Insert all nodes from the original JumpYard structure
INSERT INTO nodes (id, organization_id, name, type, role, parent_id, support_office_id, responsibilities, outcomes) VALUES
('leadership_team', 'demo_org', 'Leadership Team', 'Unit', 'Sätter riktningen och säkrar att hela verksamheten arbetar mot samma mål.', NULL, NULL, 
 '["Definiera bolagets strategiska prioriteringar", "Tilldela resurser mellan regioner och supportorganisation"]'::jsonb,
 '["Affärsplaner per region", "Beslut om investeringar och expansion"]'::jsonb),

('ceo', 'demo_org', 'CEO', 'Individual', 'Driver kund- och expansionsagenda globalt.', 'leadership_team', NULL,
 '["Kommunicera vision och värderingar", "Prioritera marknadsexpansion"]'::jsonb,
 '["Godkänd expansionsplan", "Uppdaterad kundstrategi"]'::jsonb),

('coo', 'demo_org', 'COO', 'Individual', 'Driver den globala driften och utvecklar regionernas kapacitet.', 'leadership_team', NULL,
 '["Skala best practice mellan regioner", "Säkra att supportfunktionerna levererar"]'::jsonb,
 '["Driftplaner per region", "Beslut om nya supportinitiativ"]'::jsonb),

('cfo', 'demo_org', 'CFO', 'Individual', 'Övergripande finansiellt ansvar.', 'leadership_team', NULL,
 '["Kapitalstruktur och kassaflöde", "Styrning av investeringar"]'::jsonb,
 '["Godkända budgetar", "Finansiella rapporter"]'::jsonb),

('brand_experience', 'demo_org', 'Brand & Experience', 'Department', 'Säkerställer varumärkesupplevelsen globalt.', 'ceo', NULL,
 '["Utveckla varumärkesstrategi", "Säkerställa konsistent upplevelse"]'::jsonb,
 '["Varumärkesriktlinjer", "Uppdaterade designsystem"]'::jsonb),

('global_operations', 'demo_org', 'Global Operations', 'PO', 'Samordnar regioner och supportorganisation globalt.', 'coo', 'support_office_global',
 '["Översätta strategi till operativ plan", "Fördela resurser mellan regioner"]'::jsonb,
 '["Gemensamma arbetssätt", "Årsplaner per region"]'::jsonb),

('support_office_global', 'demo_org', 'Support Office Global', 'SupportOffice', 'Sätter globala standarder och ger expertis till regionerna.', 'global_operations', NULL,
 '["Definiera policys och processer", "Stötta regionerna med expertteam", "Vakta varumärke och säkerhetsnivå"]'::jsonb,
 '["Konsoliderade KPI-ramar", "Governance-modell", "Gemensamma utbildningspaket"]'::jsonb),

('region_nordics', 'demo_org', 'Region Nordics', 'PO', 'Driver JumpYard i Norden.', 'global_operations', 'support_office_nordics',
 '["Implementera global strategi lokalt", "Driva regional tillväxt"]'::jsonb,
 '["Regional affärsplan", "Lokala partnerskap"]'::jsonb),

('support_office_nordics', 'demo_org', 'Support Office Nordics', 'SupportOffice', 'Ger expertis och stöd till nordiska marknader.', 'region_nordics', NULL,
 '["Lokaliserade processer", "Regional kompetensutveckling", "Lokal kundsupport"]'::jsonb,
 '["Regionala KPI:er", "Lokaliserade manualer", "Regionala utbildningar"]'::jsonb),

('nordics_stockholm_site', 'demo_org', 'Site Stockholm', 'Unit', 'Driver JumpYard Stockholm.', 'support_office_nordics', NULL,
 '["Leverera gästupplevelse enligt koncept", "Rapportera KPI:er"]'::jsonb,
 '["Säkra pass", "Nöjd kund-index"]'::jsonb),

('nordics_oslo_site', 'demo_org', 'Site Oslo', 'Unit', 'Driver JumpYard Oslo.', 'support_office_nordics', NULL,
 '["Leverera gästupplevelse enligt koncept", "Rapportera KPI:er"]'::jsonb,
 '["Säkra pass", "Nöjd kund-index"]'::jsonb),

('nordics_helsingborg_site', 'demo_org', 'Site Helsingborg', 'Unit', 'Driver JumpYard Helsingborg.', 'support_office_nordics', NULL,
 '["Leverera gästupplevelse enligt koncept", "Rapportera KPI:er"]'::jsonb,
 '["Säkra pass", "Nöjd kund-index"]'::jsonb),

('region_europe', 'demo_org', 'Region Europe', 'PO', 'Driver JumpYard i Europa.', 'global_operations', 'support_office_europe',
 '["Implementera global strategi lokalt", "Driva regional tillväxt"]'::jsonb,
 '["Regional affärsplan", "Lokala partnerskap"]'::jsonb),

('support_office_europe', 'demo_org', 'Support Office Europe', 'SupportOffice', 'Ger expertis och stöd till europeiska marknader.', 'region_europe', NULL,
 '["Lokaliserade processer", "Regional kompetensutveckling", "Lokal kundsupport"]'::jsonb,
 '["Regionala KPI:er", "Lokaliserade manualer", "Regionala utbildningar"]'::jsonb),

('europe_london_site', 'demo_org', 'Site London', 'Unit', 'Driver JumpYard London.', 'support_office_europe', NULL,
 '["Leverera gästupplevelse enligt koncept", "Rapportera KPI:er"]'::jsonb,
 '["Säkra pass", "Nöjd kund-index"]'::jsonb),

('europe_berlin_site', 'demo_org', 'Site Berlin', 'Unit', 'Driver JumpYard Berlin.', 'support_office_europe', NULL,
 '["Leverera gästupplevelse enligt koncept", "Rapportera KPI:er"]'::jsonb,
 '["Säkra pass", "Nöjd kund-index"]'::jsonb),

('europe_paris_site', 'demo_org', 'Site Paris', 'Unit', 'Driver JumpYard Paris.', 'support_office_europe', NULL,
 '["Leverera gästupplevelse enligt koncept", "Rapportera KPI:er"]'::jsonb,
 '["Säkra pass", "Nöjd kund-index"]'::jsonb),

('region_global', 'demo_org', 'Region Global', 'PO', 'Driver JumpYard globalt.', 'global_operations', 'support_office_global',
 '["Implementera global strategi lokalt", "Driva regional tillväxt"]'::jsonb,
 '["Regional affärsplan", "Lokala partnerskap"]'::jsonb),

('global_newyork_site', 'demo_org', 'Site New York', 'Unit', 'Driver JumpYard New York.', 'support_office_global', NULL,
 '["Leverera gästupplevelse enligt koncept", "Rapportera KPI:er"]'::jsonb,
 '["Säkra pass", "Nöjd kund-index"]'::jsonb),

('global_tokyo_site', 'demo_org', 'Site Tokyo', 'Unit', 'Driver JumpYard Tokyo.', 'support_office_global', NULL,
 '["Leverera gästupplevelse enligt koncept", "Rapportera KPI:er"]'::jsonb,
 '["Säkra pass", "Nöjd kund-index"]'::jsonb),

('global_sydney_site', 'demo_org', 'Site Sydney', 'Unit', 'Driver JumpYard Sydney.', 'support_office_global', NULL,
 '["Leverera gästupplevelse enligt koncept", "Rapportera KPI:er"]'::jsonb,
 '["Säkra pass", "Nöjd kund-index"]'::jsonb)

ON CONFLICT (id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    role = EXCLUDED.role,
    parent_id = EXCLUDED.parent_id,
    support_office_id = EXCLUDED.support_office_id,
    responsibilities = EXCLUDED.responsibilities,
    outcomes = EXCLUDED.outcomes,
    updated_at = NOW();

-- Insert comprehensive metrics for the demo organization
INSERT INTO metrics (organization_id, node_id, name, type, unit, data) VALUES
('demo_org', 'leadership_team', 'Time spent on:', 'pie', '%', 
 '{"Strategisk planering": 35, "Ledningsmöten": 25, "Resursallokering": 20, "Riskanalys": 15, "Extern kommunikation": 5}'::jsonb),

('demo_org', 'leadership_team', 'Budget Allocation', 'bar', '%', 
 '{"Nordic": 40, "Europe": 35, "Global": 25}'::jsonb),

('demo_org', 'ceo', 'Customer Satisfaction', 'line', '%', 
 '{"Q1": 85, "Q2": 88, "Q3": 92, "Q4": 90}'::jsonb),

('demo_org', 'ceo', 'Revenue Growth', 'bar', '%', 
 '{"Nordic": 15, "Europe": 22, "Global": 8}'::jsonb),

('demo_org', 'global_operations', 'Time spent on:', 'pie', '%', 
 '{"Regionala driftsforum": 30, "Incidentuppföljningar": 25, "Strategi till operation": 20, "Resursfördelning": 15, "Best practice delning": 10}'::jsonb),

('demo_org', 'support_office_global', 'Time spent on:', 'pie', '%', 
 '{"Utveckla globala manualer": 35, "Cross-region projekt": 25, "Koordinera utbildningar": 20, "Governance & standarder": 15, "Expertstöd till regioner": 5}'::jsonb),

('demo_org', 'region_nordics', 'Regional Performance', 'bar', '%', 
 '{"Stockholm": 95, "Oslo": 88, "Helsingborg": 92}'::jsonb),

('demo_org', 'region_europe', 'Regional Performance', 'bar', '%', 
 '{"London": 90, "Berlin": 85, "Paris": 88}'::jsonb),

('demo_org', 'region_global', 'Regional Performance', 'bar', '%', 
 '{"New York": 92, "Tokyo": 95, "Sydney": 87}'::jsonb);

-- Insert comprehensive relations for the demo organization
INSERT INTO relations (organization_id, from_node_id, to_node_id, description) VALUES
('demo_org', 'support_office_global', 'ceo', 'Globala standards'),
('demo_org', 'global_operations', 'ceo', 'Operativa rapporter'),
('demo_org', 'cfo', 'global_operations', 'Strategisk riktning'),
('demo_org', 'support_office_global', 'global_operations', 'Governance och standarder'),
('demo_org', 'brand_experience', 'ceo', 'Varumärkesstrategi'),
('demo_org', 'region_nordics', 'global_operations', 'Regionala rapporter'),
('demo_org', 'region_europe', 'global_operations', 'Regionala rapporter'),
('demo_org', 'region_global', 'global_operations', 'Regionala rapporter'),
('demo_org', 'support_office_nordics', 'region_nordics', 'Regional support'),
('demo_org', 'support_office_europe', 'region_europe', 'Regional support'),
('demo_org', 'nordics_stockholm_site', 'support_office_nordics', 'Operativa rapporter'),
('demo_org', 'nordics_oslo_site', 'support_office_nordics', 'Operativa rapporter'),
('demo_org', 'nordics_helsingborg_site', 'support_office_nordics', 'Operativa rapporter'),
('demo_org', 'europe_london_site', 'support_office_europe', 'Operativa rapporter'),
('demo_org', 'europe_berlin_site', 'support_office_europe', 'Operativa rapporter'),
('demo_org', 'europe_paris_site', 'support_office_europe', 'Operativa rapporter'),
('demo_org', 'global_newyork_site', 'support_office_global', 'Operativa rapporter'),
('demo_org', 'global_tokyo_site', 'support_office_global', 'Operativa rapporter'),
('demo_org', 'global_sydney_site', 'support_office_global', 'Operativa rapporter')

ON CONFLICT (organization_id, from_node_id, to_node_id, description) DO NOTHING;

-- Verify the demo organization setup
SELECT 'Full demo organization setup completed successfully!' as status;
SELECT * FROM organizations WHERE id = 'demo_org';
SELECT COUNT(*) as total_nodes FROM nodes WHERE organization_id = 'demo_org';
SELECT COUNT(*) as total_metrics FROM metrics WHERE organization_id = 'demo_org';
SELECT COUNT(*) as total_relations FROM relations WHERE organization_id = 'demo_org';
