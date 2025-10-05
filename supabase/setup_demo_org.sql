-- Create Demo Organization with Test branding
-- This script creates a demo organization that matches the localStorage setup

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

-- Insert demo nodes for the Test organization
INSERT INTO nodes (id, organization_id, name, type, role, parent_id, support_office_id, responsibilities, outcomes) VALUES
('demo_root', 'demo_org', 'Test', 'Unit', 'Demo organization showcasing organizational structure and management', NULL, NULL, 
 '["Strategic leadership and vision", "Digital transformation initiatives", "Organizational development"]'::jsonb,
 '["Strategic plans", "Digital roadmap", "Organizational improvements"]'::jsonb),

('demo_leadership', 'demo_org', 'Leadership Team', 'Unit', 'Executive leadership and strategic direction', 'demo_root', NULL,
 '["Define strategic priorities", "Allocate resources", "Set organizational direction"]'::jsonb,
 '["Strategic plans", "Resource allocation", "Organizational direction"]'::jsonb),

('demo_ceo', 'demo_org', 'CEO', 'Individual', 'Chief Executive Officer', 'demo_leadership', NULL,
 '["Strategic vision", "External relations", "Board management"]'::jsonb,
 '["Strategic vision", "External partnerships", "Board reports"]'::jsonb),

('demo_operations', 'demo_org', 'Operations', 'Department', 'Daily operations and process management', 'demo_root', NULL,
 '["Process optimization", "Quality management", "Operational efficiency"]'::jsonb,
 '["Optimized processes", "Quality metrics", "Efficiency reports"]'::jsonb)

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

-- Clear existing metrics for demo_org first
DELETE FROM metrics WHERE organization_id = 'demo_org';

-- Insert demo metrics
INSERT INTO metrics (organization_id, node_id, name, type, unit, data) VALUES
('demo_org', 'demo_root', 'Time spent on:', 'pie', '%', 
 '{"Strategic planning": 40, "Operations": 30, "Leadership": 20, "Development": 10}'::jsonb),

('demo_org', 'demo_leadership', 'Time spent on:', 'pie', '%', 
 '{"Strategic meetings": 35, "Decision making": 25, "Team management": 25, "External relations": 15}'::jsonb),

('demo_org', 'demo_operations', 'Time spent on:', 'pie', '%', 
 '{"Process management": 40, "Quality control": 30, "Team coordination": 20, "Reporting": 10}'::jsonb);

-- Insert demo relations
INSERT INTO relations (organization_id, from_node_id, to_node_id, description) VALUES
('demo_org', 'demo_leadership', 'demo_ceo', 'Strategic direction'),
('demo_org', 'demo_operations', 'demo_leadership', 'Operational reports'),
('demo_org', 'demo_ceo', 'demo_operations', 'Strategic guidance')

ON CONFLICT (organization_id, from_node_id, to_node_id, description) DO NOTHING;

-- Verify the demo organization setup
SELECT 'Demo organization setup completed successfully!' as status;
SELECT * FROM organizations WHERE id = 'demo_org';
SELECT COUNT(*) as demo_nodes FROM nodes WHERE organization_id = 'demo_org';
SELECT COUNT(*) as demo_metrics FROM metrics WHERE organization_id = 'demo_org';
