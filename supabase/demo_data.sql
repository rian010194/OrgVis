-- Create Demo Organization with FINAL CORRECT JumpYard Structure
-- This script creates a demo organization with the correct organizational structure:
-- - Nordics, Iberia, Germany (not Europe)
-- - Support Office Global has 8 children (departments)
-- - Each regional Support Office has 8 children (departments)
-- - Each region has Support Office + Sites unit + individual sites

-- Insert demo organization with Test branding
INSERT INTO organizations (id, name, description, type, password_hash, branding) VALUES
('demo_org', 'Test', 'Demo organization with sample data and structure', 'company', 
 NULL, -- No password required
 '{"primaryColor": "#ff5a00", "secondaryColor": "#e53e3e", "fontFamily": "system", "fontSize": "16", "logo": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZmY1YTAwIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkQ8L3RleHQ+Cjwvc3ZnPg=="}'::jsonb)

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

-- Insert all nodes from the FINAL CORRECT JumpYard structure
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

-- Support Office Global with 8 children (departments)
('support_office_global', 'demo_org', 'Support Office Global', 'SupportOffice', 'Sätter globala standarder och ger expertis till regionerna.', 'global_operations', NULL,
 '["Definiera policys och processer", "Stötta regionerna med expertteam", "Vakta varumärke och säkerhetsnivå"]'::jsonb,
 '["Konsoliderade KPI-ramar", "Governance-modell", "Gemensamma utbildningspaket"]'::jsonb),

('marketing_sales_global', 'demo_org', 'Marketing & Sales Global', 'Department', 'Drive guest flow and campaigns to maximize park utilization and revenue.', 'support_office_global', NULL,
 '["Utveckla marknadsstrategier", "Maximera parkutnyttjning"]'::jsonb,
 '["Kampanjplaner", "Gästflödesprognoser"]'::jsonb),

('expansion_global', 'demo_org', 'Expansion Global', 'Department', 'Plan and develop new parks and concepts to drive business growth.', 'support_office_global', NULL,
 '["Planera nya parker", "Utveckla nya koncept"]'::jsonb,
 '["Expansionsplaner", "Nya konceptutveckling"]'::jsonb),

('finance_global', 'demo_org', 'Finance Global', 'Department', 'Support budget, forecasting and controlling to ensure financial health.', 'support_office_global', NULL,
 '["Budget och prognoser", "Finansiell kontroll"]'::jsonb,
 '["Finansiella rapporter", "Budgetprognoser"]'::jsonb),

('it_global', 'demo_org', 'IT Global', 'Department', 'Own and manage systems and digital infrastructure.', 'support_office_global', NULL,
 '["Hantera IT-system", "Digital infrastruktur"]'::jsonb,
 '["IT-stöd", "Systemuppdateringar"]'::jsonb),

('hr_training_global', 'demo_org', 'HR & Training Global', 'Department', 'Ensure competence through comprehensive training programs.', 'support_office_global', NULL,
 '["Utveckla kompetens", "Utbildningsprogram"]'::jsonb,
 '["Utbildningsplaner", "Kompetensutveckling"]'::jsonb),

('safety_global', 'demo_org', 'Safety Global', 'Department', '24/7 guest safety above and beyond what could be expected.', 'support_office_global', NULL,
 '["Säkerhetsstandarder", "Säkerhetsutbildning"]'::jsonb,
 '["Säkerhetsrapporter", "Säkerhetsutbildningar"]'::jsonb),

('maintenance_global', 'demo_org', 'Maintenance Global', 'Department', 'Maintain attractions and facilities for optimal guest experience.', 'support_office_global', NULL,
 '["Underhåll av attraktioner", "Facilitetsunderhåll"]'::jsonb,
 '["Underhållsplaner", "Underhållsrapporter"]'::jsonb),

('operations_global', 'demo_org', 'Operations Global', 'Department', 'Support daily park operations for exceptional guest experience.', 'support_office_global', NULL,
 '["Daglig parkdrift", "Operativ excellens"]'::jsonb,
 '["Operativa rapporter", "Driftplaner"]'::jsonb),

-- Region Nordics
('region_nordics', 'demo_org', 'Nordics', 'PO', 'Driver parkerna i Nordics och säkrar lokalt kundlöfte.', 'global_operations', 'support_office_nordics',
 '["Implementera global strategi lokalt", "Driva regional tillväxt"]'::jsonb,
 '["Regional affärsplan", "Lokala partnerskap"]'::jsonb),

-- Support Office Nordics with 8 children (departments)
('support_office_nordics', 'demo_org', 'Support Office Nordics', 'SupportOffice', 'Ger dagligt stöd till parkerna i Nordics.', 'region_nordics', NULL,
 '["Lokaliserade processer", "Regional kompetensutveckling", "Lokal kundsupport"]'::jsonb,
 '["Regionala KPI:er", "Lokaliserade manualer", "Regionala utbildningar"]'::jsonb),

('marketing_sales_nordics', 'demo_org', 'Marketing & Sales Nordics', 'Department', 'Drive guest flow and campaigns in Nordic region.', 'support_office_nordics', NULL,
 '["Regionala marknadsstrategier", "Nordisk parkutnyttjning"]'::jsonb,
 '["Regionala kampanjplaner", "Nordiska gästflödesprognoser"]'::jsonb),

('expansion_nordics', 'demo_org', 'Expansion Nordics', 'Department', 'Plan and develop new parks in Nordic region.', 'support_office_nordics', NULL,
 '["Planera nya nordiska parker", "Nordisk konceptutveckling"]'::jsonb,
 '["Nordiska expansionsplaner", "Regionala konceptutveckling"]'::jsonb),

('finance_nordics', 'demo_org', 'Finance Nordics', 'Department', 'Support budget and forecasting for Nordic region.', 'support_office_nordics', NULL,
 '["Nordisk budget och prognoser", "Regional finansiell kontroll"]'::jsonb,
 '["Nordiska finansiella rapporter", "Regionala budgetprognoser"]'::jsonb),

('it_nordics', 'demo_org', 'IT Nordics', 'Department', 'Manage IT systems for Nordic region.', 'support_office_nordics', NULL,
 '["Hantera nordiska IT-system", "Regional digital infrastruktur"]'::jsonb,
 '["Nordiskt IT-stöd", "Regionala systemuppdateringar"]'::jsonb),

('hr_training_nordics', 'demo_org', 'HR & Training Nordics', 'Department', 'Ensure competence through Nordic training programs.', 'support_office_nordics', NULL,
 '["Utveckla nordisk kompetens", "Regionala utbildningsprogram"]'::jsonb,
 '["Nordiska utbildningsplaner", "Regional kompetensutveckling"]'::jsonb),

('safety_nordics', 'demo_org', 'Safety Nordics', 'Department', '24/7 guest safety in Nordic region.', 'support_office_nordics', NULL,
 '["Nordiska säkerhetsstandarder", "Regional säkerhetsutbildning"]'::jsonb,
 '["Nordiska säkerhetsrapporter", "Regionala säkerhetsutbildningar"]'::jsonb),

('maintenance_nordics', 'demo_org', 'Maintenance Nordics', 'Department', 'Maintain attractions in Nordic region.', 'support_office_nordics', NULL,
 '["Underhåll av nordiska attraktioner", "Regionalt facilitetsunderhåll"]'::jsonb,
 '["Nordiska underhållsplaner", "Regionala underhållsrapporter"]'::jsonb),

('operations_nordics', 'demo_org', 'Operations Nordics', 'Department', 'Support daily park operations in Nordic region.', 'support_office_nordics', NULL,
 '["Nordisk daglig parkdrift", "Regional operativ excellens"]'::jsonb,
 '["Nordiska operativa rapporter", "Regionala driftplaner"]'::jsonb),

('nordics_sites', 'demo_org', 'Nordics Sites', 'Unit', 'Samordnar alla nordiska anläggningar.', 'region_nordics', NULL,
 '["Operativ samordning", "Kvalitetssäkring", "Resursfördelning"]'::jsonb,
 '["Operativa rapporter", "Kvalitetsmätningar", "Resursplaner"]'::jsonb),

('nordics_stockholm_site', 'demo_org', 'Site Stockholm', 'Unit', 'Driver JumpYard Stockholm.', 'nordics_sites', NULL,
 '["Leverera gästupplevelse enligt koncept", "Rapportera KPI:er"]'::jsonb,
 '["Säkra pass", "Nöjd kund-index"]'::jsonb),

('nordics_oslo_site', 'demo_org', 'Site Oslo', 'Unit', 'Driver JumpYard Oslo.', 'nordics_sites', NULL,
 '["Leverera gästupplevelse enligt koncept", "Rapportera KPI:er"]'::jsonb,
 '["Säkra pass", "Nöjd kund-index"]'::jsonb),

('nordics_helsingborg_site', 'demo_org', 'Site Helsingborg', 'Unit', 'Driver JumpYard Helsingborg.', 'nordics_sites', NULL,
 '["Leverera gästupplevelse enligt koncept", "Rapportera KPI:er"]'::jsonb,
 '["Säkra pass", "Nöjd kund-index"]'::jsonb),

-- Region Iberia
('region_iberia', 'demo_org', 'Iberia', 'PA', 'Driver parkerna i Iberia och säkrar lokalt kundlöfte.', 'global_operations', 'support_office_iberia',
 '["Implementera global strategi lokalt", "Driva regional tillväxt"]'::jsonb,
 '["Regional affärsplan", "Lokala partnerskap"]'::jsonb),

-- Support Office Iberia with 8 children (departments)
('support_office_iberia', 'demo_org', 'Support Office Iberia', 'SupportOffice', 'Ger dagligt stöd till parkerna i Iberia.', 'region_iberia', NULL,
 '["Lokaliserade processer", "Regional kompetensutveckling", "Lokal kundsupport"]'::jsonb,
 '["Regionala KPI:er", "Lokaliserade manualer", "Regionala utbildningar"]'::jsonb),

('marketing_sales_iberia', 'demo_org', 'Marketing & Sales Iberia', 'Department', 'Drive guest flow and campaigns in Iberian region.', 'support_office_iberia', NULL,
 '["Regionala marknadsstrategier", "Iberisk parkutnyttjning"]'::jsonb,
 '["Regionala kampanjplaner", "Iberiska gästflödesprognoser"]'::jsonb),

('expansion_iberia', 'demo_org', 'Expansion Iberia', 'Department', 'Plan and develop new parks in Iberian region.', 'support_office_iberia', NULL,
 '["Planera nya iberiska parker", "Iberisk konceptutveckling"]'::jsonb,
 '["Iberiska expansionsplaner", "Regionala konceptutveckling"]'::jsonb),

('finance_iberia', 'demo_org', 'Finance Iberia', 'Department', 'Support budget and forecasting for Iberian region.', 'support_office_iberia', NULL,
 '["Iberisk budget och prognoser", "Regional finansiell kontroll"]'::jsonb,
 '["Iberiska finansiella rapporter", "Regionala budgetprognoser"]'::jsonb),

('it_iberia', 'demo_org', 'IT Iberia', 'Department', 'Manage IT systems for Iberian region.', 'support_office_iberia', NULL,
 '["Hantera iberiska IT-system", "Regional digital infrastruktur"]'::jsonb,
 '["Iberiskt IT-stöd", "Regionala systemuppdateringar"]'::jsonb),

('hr_training_iberia', 'demo_org', 'HR & Training Iberia', 'Department', 'Ensure competence through Iberian training programs.', 'support_office_iberia', NULL,
 '["Utveckla iberisk kompetens", "Regionala utbildningsprogram"]'::jsonb,
 '["Iberiska utbildningsplaner", "Regional kompetensutveckling"]'::jsonb),

('safety_iberia', 'demo_org', 'Safety Iberia', 'Department', '24/7 guest safety in Iberian region.', 'support_office_iberia', NULL,
 '["Iberiska säkerhetsstandarder", "Regional säkerhetsutbildning"]'::jsonb,
 '["Iberiska säkerhetsrapporter", "Regionala säkerhetsutbildningar"]'::jsonb),

('maintenance_iberia', 'demo_org', 'Maintenance Iberia', 'Department', 'Maintain attractions in Iberian region.', 'support_office_iberia', NULL,
 '["Underhåll av iberiska attraktioner", "Regionalt facilitetsunderhåll"]'::jsonb,
 '["Iberiska underhållsplaner", "Regionala underhållsrapporter"]'::jsonb),

('operations_iberia', 'demo_org', 'Operations Iberia', 'Department', 'Support daily park operations in Iberian region.', 'support_office_iberia', NULL,
 '["Iberisk daglig parkdrift", "Regional operativ excellens"]'::jsonb,
 '["Iberiska operativa rapporter", "Regionala driftplaner"]'::jsonb),

('iberia_sites', 'demo_org', 'Iberia Sites', 'Unit', 'Samordnar alla iberiska anläggningar.', 'region_iberia', NULL,
 '["Operativ samordning", "Kvalitetssäkring", "Resursfördelning"]'::jsonb,
 '["Operativa rapporter", "Kvalitetsmätningar", "Resursplaner"]'::jsonb),

('iberia_lisbon_site', 'demo_org', 'Site Lisbon', 'Unit', 'Driver JumpYard Lisbon.', 'iberia_sites', NULL,
 '["Leverera gästupplevelse enligt koncept", "Rapportera KPI:er"]'::jsonb,
 '["Säkra pass", "Nöjd kund-index"]'::jsonb),

('iberia_madrid_site', 'demo_org', 'Site Madrid', 'Unit', 'Driver JumpYard Madrid.', 'iberia_sites', NULL,
 '["Leverera gästupplevelse enligt koncept", "Rapportera KPI:er"]'::jsonb,
 '["Säkra pass", "Nöjd kund-index"]'::jsonb),

('iberia_barcelona_site', 'demo_org', 'Site Barcelona', 'Unit', 'Driver JumpYard Barcelona.', 'iberia_sites', NULL,
 '["Leverera gästupplevelse enligt koncept", "Rapportera KPI:er"]'::jsonb,
 '["Säkra pass", "Nöjd kund-index"]'::jsonb),

-- Region Germany
('region_germany', 'demo_org', 'Germany', 'PA', 'Driver parkerna i Germany och säkrar lokalt kundlöfte.', 'global_operations', 'support_office_germany',
 '["Implementera global strategi lokalt", "Driva regional tillväxt"]'::jsonb,
 '["Regional affärsplan", "Lokala partnerskap"]'::jsonb),

-- Support Office Germany with 8 children (departments)
('support_office_germany', 'demo_org', 'Support Office Germany', 'SupportOffice', 'Ger dagligt stöd till parkerna i Germany.', 'region_germany', NULL,
 '["Lokaliserade processer", "Regional kompetensutveckling", "Lokal kundsupport"]'::jsonb,
 '["Regionala KPI:er", "Lokaliserade manualer", "Regionala utbildningar"]'::jsonb),

('marketing_sales_germany', 'demo_org', 'Marketing & Sales Germany', 'Department', 'Drive guest flow and campaigns in German region.', 'support_office_germany', NULL,
 '["Regionala marknadsstrategier", "Tysk parkutnyttjning"]'::jsonb,
 '["Regionala kampanjplaner", "Tyska gästflödesprognoser"]'::jsonb),

('expansion_germany', 'demo_org', 'Expansion Germany', 'Department', 'Plan and develop new parks in German region.', 'support_office_germany', NULL,
 '["Planera nya tyska parker", "Tysk konceptutveckling"]'::jsonb,
 '["Tyska expansionsplaner", "Regionala konceptutveckling"]'::jsonb),

('finance_germany', 'demo_org', 'Finance Germany', 'Department', 'Support budget and forecasting for German region.', 'support_office_germany', NULL,
 '["Tysk budget och prognoser", "Regional finansiell kontroll"]'::jsonb,
 '["Tyska finansiella rapporter", "Regionala budgetprognoser"]'::jsonb),

('it_germany', 'demo_org', 'IT Germany', 'Department', 'Manage IT systems for German region.', 'support_office_germany', NULL,
 '["Hantera tyska IT-system", "Regional digital infrastruktur"]'::jsonb,
 '["Tyskt IT-stöd", "Regionala systemuppdateringar"]'::jsonb),

('hr_training_germany', 'demo_org', 'HR & Training Germany', 'Department', 'Ensure competence through German training programs.', 'support_office_germany', NULL,
 '["Utveckla tysk kompetens", "Regionala utbildningsprogram"]'::jsonb,
 '["Tyska utbildningsplaner", "Regional kompetensutveckling"]'::jsonb),

('safety_germany', 'demo_org', 'Safety Germany', 'Department', '24/7 guest safety in German region.', 'support_office_germany', NULL,
 '["Tyska säkerhetsstandarder", "Regional säkerhetsutbildning"]'::jsonb,
 '["Tyska säkerhetsrapporter", "Regionala säkerhetsutbildningar"]'::jsonb),

('maintenance_germany', 'demo_org', 'Maintenance Germany', 'Department', 'Maintain attractions in German region.', 'support_office_germany', NULL,
 '["Underhåll av tyska attraktioner", "Regionalt facilitetsunderhåll"]'::jsonb,
 '["Tyska underhållsplaner", "Regionala underhållsrapporter"]'::jsonb),

('operations_germany', 'demo_org', 'Operations Germany', 'Department', 'Support daily park operations in German region.', 'support_office_germany', NULL,
 '["Tysk daglig parkdrift", "Regional operativ excellens"]'::jsonb,
 '["Tyska operativa rapporter", "Regionala driftplaner"]'::jsonb),

('germany_sites', 'demo_org', 'Germany Sites', 'Unit', 'Samordnar alla tyska anläggningar.', 'region_germany', NULL,
 '["Operativ samordning", "Kvalitetssäkring", "Resursfördelning"]'::jsonb,
 '["Operativa rapporter", "Kvalitetsmätningar", "Resursplaner"]'::jsonb),

('germany_berlin_site', 'demo_org', 'Site Berlin', 'Unit', 'Driver JumpYard Berlin.', 'germany_sites', NULL,
 '["Leverera gästupplevelse enligt koncept", "Rapportera KPI:er"]'::jsonb,
 '["Säkra pass", "Nöjd kund-index"]'::jsonb),

('germany_munich_site', 'demo_org', 'Site Munich', 'Unit', 'Driver JumpYard Munich.', 'germany_sites', NULL,
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
 '{"Nordic": 40, "Iberia": 35, "Germany": 25}'::jsonb),

('demo_org', 'ceo', 'Customer Satisfaction', 'line', '%', 
 '{"Q1": 85, "Q2": 88, "Q3": 92, "Q4": 90}'::jsonb),

('demo_org', 'ceo', 'Revenue Growth', 'bar', '%', 
 '{"Nordic": 15, "Iberia": 22, "Germany": 8}'::jsonb),

('demo_org', 'global_operations', 'Time spent on:', 'pie', '%', 
 '{"Regionala driftsforum": 30, "Incidentuppföljningar": 25, "Strategi till operation": 20, "Resursfördelning": 15, "Best practice delning": 10}'::jsonb),

('demo_org', 'support_office_global', 'Time spent on:', 'pie', '%', 
 '{"Utveckla globala manualer": 35, "Cross-region projekt": 25, "Koordinera utbildningar": 20, "Governance & standarder": 15, "Expertstöd till regioner": 5}'::jsonb),

('demo_org', 'region_nordics', 'Regional Performance', 'bar', '%', 
 '{"Stockholm": 95, "Oslo": 88, "Helsingborg": 92}'::jsonb),

('demo_org', 'region_iberia', 'Regional Performance', 'bar', '%', 
 '{"Lisbon": 90, "Madrid": 85, "Barcelona": 88}'::jsonb),

('demo_org', 'region_germany', 'Regional Performance', 'bar', '%', 
 '{"Berlin": 92, "Munich": 95}'::jsonb);

-- Insert comprehensive relations for the demo organization
INSERT INTO relations (organization_id, from_node_id, to_node_id, description) VALUES
('demo_org', 'support_office_global', 'ceo', 'Globala standards'),
('demo_org', 'global_operations', 'ceo', 'Operativa rapporter'),
('demo_org', 'cfo', 'global_operations', 'Strategisk riktning'),
('demo_org', 'support_office_global', 'global_operations', 'Governance och standarder'),
('demo_org', 'brand_experience', 'ceo', 'Varumärkesstrategi'),
('demo_org', 'region_nordics', 'global_operations', 'Regionala rapporter'),
('demo_org', 'region_iberia', 'global_operations', 'Regionala rapporter'),
('demo_org', 'region_germany', 'global_operations', 'Regionala rapporter'),
('demo_org', 'support_office_nordics', 'region_nordics', 'Regional support'),
('demo_org', 'support_office_iberia', 'region_iberia', 'Regional support'),
('demo_org', 'support_office_germany', 'region_germany', 'Regional support'),
('demo_org', 'nordics_sites', 'region_nordics', 'Site rapporter'),
('demo_org', 'iberia_sites', 'region_iberia', 'Site rapporter'),
('demo_org', 'germany_sites', 'region_germany', 'Site rapporter'),
('demo_org', 'nordics_stockholm_site', 'nordics_sites', 'Operativa rapporter'),
('demo_org', 'nordics_oslo_site', 'nordics_sites', 'Operativa rapporter'),
('demo_org', 'nordics_helsingborg_site', 'nordics_sites', 'Operativa rapporter'),
('demo_org', 'iberia_lisbon_site', 'iberia_sites', 'Operativa rapporter'),
('demo_org', 'iberia_madrid_site', 'iberia_sites', 'Operativa rapporter'),
('demo_org', 'iberia_barcelona_site', 'iberia_sites', 'Operativa rapporter'),
('demo_org', 'germany_berlin_site', 'germany_sites', 'Operativa rapporter'),
('demo_org', 'germany_munich_site', 'germany_sites', 'Operativa rapporter')

ON CONFLICT (organization_id, from_node_id, to_node_id, description) DO NOTHING;

-- Verify the demo organization setup
SELECT 'FINAL CORRECT demo organization setup completed successfully!' as status;
SELECT * FROM organizations WHERE id = 'demo_org';
SELECT COUNT(*) as total_nodes FROM nodes WHERE organization_id = 'demo_org';
SELECT COUNT(*) as total_metrics FROM metrics WHERE organization_id = 'demo_org';
SELECT COUNT(*) as total_relations FROM relations WHERE organization_id = 'demo_org';
