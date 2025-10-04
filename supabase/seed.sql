-- Seed data for JumpYard organization
-- This will populate the database with the existing organization structure

-- Insert nodes
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
 '["Konsoliderade KPI-ramar", "Governance-modell", "Gemensamma utbildningspaket"]'),

('region_iberia', 'Iberia', 'PA', 'Driver parkerna i Iberia och säkrar lokalt kundlöfte.', 'global_operations', 'support_office_iberia',
 '["Leverera resultat enligt budget", "Anpassa globala standards till lokala marknader"]',
 '["Nöjda gäster", "Stabila driftprocesser"]'),

('region_germany', 'Germany', 'PA', 'Driver parkerna i Germany och säkrar lokalt kundlöfte.', 'global_operations', 'support_office_germany',
 '["Leverera resultat enligt budget", "Anpassa globala standards till lokala marknader"]',
 '["Nöjda gäster", "Stabila driftprocesser"]'),

('region_nordics', 'Nordics', 'PO', 'Driver parkerna i Nordics och säkrar lokalt kundlöfte.', 'global_operations', 'support_office_nordics',
 '["Leverera resultat enligt budget", "Anpassa globala standards till lokala marknader"]',
 '["Nöjda gäster", "Stabila driftprocesser"]');

-- Insert some sample metrics
INSERT INTO metrics (node_id, name, type, unit, data) VALUES
('leadership_team', 'Time spent on:', 'pie', '%', '{"Strategisk planering": 35, "Ledningsmöten": 25, "Resursallokering": 20, "Riskanalys": 15, "Extern kommunikation": 5}'),
('global_operations', 'Time spent on:', 'pie', '%', '{"Regionala driftsforum": 30, "Incidentuppföljningar": 25, "Strategi till operation": 20, "Resursfördelning": 15, "Best practice delning": 10}'),
('support_office_global', 'Time spent on:', 'pie', '%', '{"Utveckla globala manualer": 35, "Cross-region projekt": 25, "Koordinera utbildningar": 20, "Governance & standarder": 15, "Expertstöd till regioner": 5}'),
('region_iberia', 'Time spent on:', 'pie', '%', '{"Regionala kampanjer": 35, "Sitechefstöd": 25, "Lokal marknadsanpassning": 20, "Budgetuppföljning": 15, "Eventplanering": 5}'),
('region_germany', 'Time spent on:', 'pie', '%', '{"Regionala kampanjer": 35, "Sitechefstöd": 25, "Lokal marknadsanpassning": 20, "Budgetuppföljning": 15, "Eventplanering": 5}'),
('region_nordics', 'Time spent on:', 'pie', '%', '{"Regionala kampanjer": 35, "Sitechefstöd": 25, "Lokal marknadsanpassning": 20, "Budgetuppföljning": 15, "Eventplanering": 5}');

-- Insert some sample relations
INSERT INTO relations (from_node_id, to_node_id, description) VALUES
('support_office_global', 'region_iberia', 'Strategiska ramar'),
('support_office_global', 'region_iberia', 'Globala standards'),
('support_office_global', 'region_germany', 'Strategiska ramar'),
('support_office_global', 'region_germany', 'Globala standards'),
('support_office_global', 'region_nordics', 'Strategiska ramar'),
('support_office_global', 'region_nordics', 'Globala standards'),
('region_iberia', 'global_operations', 'Regionala resultat'),
('region_germany', 'global_operations', 'Regionala resultat'),
('region_nordics', 'global_operations', 'Regionala resultat');
