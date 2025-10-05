-- Fix metrics for demo_org
-- This script ensures metrics are properly inserted and linked to nodes

-- First, clear existing metrics for demo_org
DELETE FROM metrics WHERE organization_id = 'demo_org';

-- Insert comprehensive metrics for the demo organization with proper format
INSERT INTO metrics (organization_id, node_id, name, type, unit, data) VALUES
-- Leadership Team metrics
('demo_org', 'leadership_team', 'Time spent on:', 'pie', '%', 
 '{"Strategisk planering": 35, "Ledningsmöten": 25, "Resursallokering": 20, "Riskanalys": 15, "Extern kommunikation": 5}'::jsonb),

('demo_org', 'leadership_team', 'Budget Allocation', 'bar', '%', 
 '{"Nordic": 40, "Iberia": 35, "Germany": 25}'::jsonb),

-- CEO metrics
('demo_org', 'ceo', 'Customer Satisfaction', 'line', '%', 
 '{"Q1": 85, "Q2": 88, "Q3": 92, "Q4": 90}'::jsonb),

('demo_org', 'ceo', 'Revenue Growth', 'bar', '%', 
 '{"Nordic": 15, "Iberia": 22, "Germany": 8}'::jsonb),

-- COO metrics
('demo_org', 'coo', 'Operational Efficiency', 'bar', '%', 
 '{"Nordic": 92, "Iberia": 87, "Germany": 78}'::jsonb),

-- CFO metrics
('demo_org', 'cfo', 'Financial Performance', 'pie', 'SEK', 
 '{"Revenue": 15000000, "Expenses": 12000000, "Profit": 3000000}'::jsonb),

-- Brand & Experience metrics
('demo_org', 'brand_experience', 'Brand Awareness', 'doughnut', '%', 
 '{"Local": 65, "Regional": 45, "National": 30, "International": 15}'::jsonb),

-- Global Operations metrics
('demo_org', 'global_operations', 'Time spent on:', 'pie', '%', 
 '{"Regionala driftsforum": 30, "Incidentuppföljningar": 25, "Strategi till operation": 20, "Resursfördelning": 15, "Best practice delning": 10}'::jsonb),

('demo_org', 'global_operations', 'Regional Performance', 'bar', '%', 
 '{"Nordics": 95, "Iberia": 88, "Germany": 82}'::jsonb),

-- Support Office Global metrics
('demo_org', 'support_office_global', 'Time spent on:', 'pie', '%', 
 '{"Utveckla globala manualer": 35, "Cross-region projekt": 25, "Koordinera utbildningar": 20, "Governance & standarder": 15, "Expertstöd till regioner": 5}'::jsonb),

-- Marketing & Sales Global metrics
('demo_org', 'marketing_sales_global', 'Campaign Performance', 'bar', '%', 
 '{"Digital": 75, "Social Media": 60, "Traditional": 40}'::jsonb),

-- Finance Global metrics
('demo_org', 'finance_global', 'Budget Utilization', 'line', '%', 
 '{"Q1": 85, "Q2": 92, "Q3": 88, "Q4": 95}'::jsonb),

-- IT Global metrics
('demo_org', 'it_global', 'System Uptime', 'line', '%', 
 '{"Q1": 99.5, "Q2": 99.8, "Q3": 99.2, "Q4": 99.9}'::jsonb),

-- HR & Training Global metrics
('demo_org', 'hr_training_global', 'Training Completion', 'bar', '%', 
 '{"Safety": 95, "Operations": 88, "Leadership": 75}'::jsonb),

-- Safety Global metrics
('demo_org', 'safety_global', 'Safety Incidents', 'line', 'count', 
 '{"Q1": 2, "Q2": 1, "Q3": 0, "Q4": 1}'::jsonb),

-- Maintenance Global metrics
('demo_org', 'maintenance_global', 'Equipment Availability', 'bar', '%', 
 '{"Attractions": 98, "Facilities": 95, "IT Systems": 99}'::jsonb),

-- Operations Global metrics
('demo_org', 'operations_global', 'Guest Satisfaction', 'line', '%', 
 '{"Q1": 88, "Q2": 91, "Q3": 89, "Q4": 93}'::jsonb),

-- Region Nordics metrics
('demo_org', 'region_nordics', 'Regional Performance', 'bar', '%', 
 '{"Stockholm": 95, "Oslo": 88, "Helsingborg": 92}'::jsonb),

-- Support Office Nordics metrics
('demo_org', 'support_office_nordics', 'Support Efficiency', 'pie', '%', 
 '{"Site Support": 40, "Training": 25, "Compliance": 20, "Reporting": 15}'::jsonb),

-- Marketing & Sales Nordics metrics
('demo_org', 'marketing_sales_nordics', 'Local Campaign ROI', 'bar', '%', 
 '{"Stockholm": 120, "Oslo": 110, "Helsingborg": 105}'::jsonb),

-- Region Iberia metrics
('demo_org', 'region_iberia', 'Regional Performance', 'bar', '%', 
 '{"Lisbon": 90, "Madrid": 85, "Barcelona": 88}'::jsonb),

-- Support Office Iberia metrics
('demo_org', 'support_office_iberia', 'Support Efficiency', 'pie', '%', 
 '{"Site Support": 35, "Training": 30, "Compliance": 20, "Reporting": 15}'::jsonb),

-- Marketing & Sales Iberia metrics
('demo_org', 'marketing_sales_iberia', 'Local Campaign ROI', 'bar', '%', 
 '{"Lisbon": 115, "Madrid": 108, "Barcelona": 112}'::jsonb),

-- Region Germany metrics
('demo_org', 'region_germany', 'Regional Performance', 'bar', '%', 
 '{"Berlin": 92, "Munich": 95}'::jsonb),

-- Support Office Germany metrics
('demo_org', 'support_office_germany', 'Support Efficiency', 'pie', '%', 
 '{"Site Support": 45, "Training": 25, "Compliance": 20, "Reporting": 10}'::jsonb),

-- Marketing & Sales Germany metrics
('demo_org', 'marketing_sales_germany', 'Local Campaign ROI', 'bar', '%', 
 '{"Berlin": 118, "Munich": 125}'::jsonb),

-- Site metrics
('demo_org', 'nordics_stockholm_site', 'Guest Satisfaction', 'line', '%', 
 '{"Q1": 92, "Q2": 95, "Q3": 93, "Q4": 96}'::jsonb),

('demo_org', 'nordics_oslo_site', 'Guest Satisfaction', 'line', '%', 
 '{"Q1": 88, "Q2": 91, "Q3": 89, "Q4": 92}'::jsonb),

('demo_org', 'nordics_helsingborg_site', 'Guest Satisfaction', 'line', '%', 
 '{"Q1": 90, "Q2": 93, "Q3": 91, "Q4": 94}'::jsonb),

('demo_org', 'iberia_lisbon_site', 'Guest Satisfaction', 'line', '%', 
 '{"Q1": 87, "Q2": 90, "Q3": 88, "Q4": 91}'::jsonb),

('demo_org', 'iberia_madrid_site', 'Guest Satisfaction', 'line', '%', 
 '{"Q1": 85, "Q2": 88, "Q3": 86, "Q4": 89}'::jsonb),

('demo_org', 'iberia_barcelona_site', 'Guest Satisfaction', 'line', '%', 
 '{"Q1": 86, "Q2": 89, "Q3": 87, "Q4": 90}'::jsonb),

('demo_org', 'germany_berlin_site', 'Guest Satisfaction', 'line', '%', 
 '{"Q1": 89, "Q2": 92, "Q3": 90, "Q4": 93}'::jsonb),

('demo_org', 'germany_munich_site', 'Guest Satisfaction', 'line', '%', 
 '{"Q1": 91, "Q2": 94, "Q3": 92, "Q4": 95}'::jsonb);

-- Verify the metrics were inserted correctly
SELECT 'Metrics fix completed!' as status;
SELECT COUNT(*) as total_metrics FROM metrics WHERE organization_id = 'demo_org';

-- Show sample of metrics
SELECT 'Sample metrics:' as info;
SELECT node_id, name, type, unit FROM metrics WHERE organization_id = 'demo_org' LIMIT 10;
