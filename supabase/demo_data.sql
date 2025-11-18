-- Create Demo Organization with Generic Company Structure
-- This script creates a demo organization with a typical corporate structure:
-- - CEO at the top
-- - Standard departments: HR, Finance, IT, Sales, Marketing, Operations, Product Development

-- Insert demo organization
INSERT INTO organizations (id, name, description, type, password_hash, branding) VALUES
('demo_org', 'Demo', 'Demo organization with sample data and structure', 'company', 
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

-- Insert generic organization structure
INSERT INTO nodes (id, organization_id, name, type, role, parent_id, support_office_id, responsibilities, outcomes) VALUES
('demo_ceo', 'demo_org', 'CEO', 'Individual', 'Chief Executive Officer - Leading the organization and setting strategic direction', NULL, NULL, 
 '["Strategic planning and vision", "Executive leadership", "Stakeholder management", "Organizational growth"]'::jsonb,
 '["Strategic goals achieved", "Organizational growth", "Strong stakeholder relationships", "Market leadership"]'::jsonb),

('demo_hr', 'demo_org', 'Human Resources', 'Department', 'Managing talent acquisition, development, and employee relations', 'demo_ceo', NULL,
 '["Recruitment and hiring", "Employee development", "Performance management", "Compensation and benefits"]'::jsonb,
 '["High employee satisfaction", "Strong talent pipeline", "Effective performance reviews", "Competitive compensation packages"]'::jsonb),

('demo_finance', 'demo_org', 'Finance', 'Department', 'Managing financial planning, accounting, and reporting', 'demo_ceo', NULL,
 '["Budget planning and control", "Financial reporting", "Cash flow management", "Financial analysis"]'::jsonb,
 '["Accurate financial reports", "Effective budget management", "Strong financial health", "Informed financial decisions"]'::jsonb),

('demo_it', 'demo_org', 'IT & Technology', 'Department', 'Managing technology infrastructure and digital solutions', 'demo_ceo', NULL,
 '["IT infrastructure management", "Software development", "Cybersecurity", "Technical support"]'::jsonb,
 '["Reliable IT systems", "Secure technology environment", "Efficient technical support", "Innovative digital solutions"]'::jsonb),

('demo_sales', 'demo_org', 'Sales', 'Department', 'Driving revenue through customer acquisition and relationship management', 'demo_ceo', NULL,
 '["Customer acquisition", "Sales pipeline management", "Client relationship management", "Revenue growth"]'::jsonb,
 '["Revenue targets achieved", "Growing customer base", "Strong client relationships", "Market expansion"]'::jsonb),

('demo_marketing', 'demo_org', 'Marketing', 'Department', 'Building brand awareness and driving customer engagement', 'demo_ceo', NULL,
 '["Brand management", "Marketing campaigns", "Digital marketing", "Market research"]'::jsonb,
 '["Increased brand awareness", "Effective marketing campaigns", "Lead generation", "Market insights"]'::jsonb),

('demo_operations', 'demo_org', 'Operations', 'Department', 'Ensuring efficient day-to-day business operations', 'demo_ceo', NULL,
 '["Process optimization", "Quality assurance", "Supply chain management", "Operational efficiency"]'::jsonb,
 '["Streamlined processes", "High quality standards", "Cost efficiency", "Operational excellence"]'::jsonb),

('demo_product', 'demo_org', 'Product Development', 'Department', 'Developing and managing products and services', 'demo_ceo', NULL,
 '["Product strategy", "Product development", "Product lifecycle management", "Innovation"]'::jsonb,
 '["Successful product launches", "Innovative products", "Product roadmap execution", "Customer satisfaction with products"]'::jsonb)

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

-- Insert metrics for the demo organization
INSERT INTO metrics (organization_id, node_id, name, type, unit, data) VALUES
('demo_org', 'demo_ceo', 'Revenue Growth', 'line', '%', 
 '{"Q1 2024": 5, "Q2 2024": 8, "Q3 2024": 12, "Q4 2024": 15}'::jsonb),

('demo_org', 'demo_ceo', 'Employee Satisfaction', 'pie', '%', 
 '{"Very Satisfied": 60, "Satisfied": 28, "Neutral": 10, "Dissatisfied": 2}'::jsonb),

('demo_org', 'demo_sales', 'Sales Performance', 'bar', 'units', 
 '{"Q1": 120, "Q2": 145, "Q3": 160, "Q4": 180}'::jsonb),

('demo_org', 'demo_marketing', 'Marketing Budget Allocation', 'pie', '%', 
 '{"Digital Marketing": 40, "Content Creation": 25, "Events & Sponsorships": 20, "Market Research": 15}'::jsonb),

('demo_org', 'demo_finance', 'Budget Distribution', 'bar', '%', 
 '{"HR": 25, "IT": 20, "Sales": 20, "Marketing": 15, "Operations": 12, "Product": 8}'::jsonb),

('demo_org', 'demo_hr', 'Time Allocation', 'pie', '%', 
 '{"Recruitment": 30, "Training": 25, "Performance Management": 20, "Compensation": 15, "Employee Relations": 10}'::jsonb)

ON CONFLICT (organization_id, node_id, name) DO UPDATE SET
    type = EXCLUDED.type,
    unit = EXCLUDED.unit,
    data = EXCLUDED.data,
    updated_at = NOW();

-- Insert relations for the demo organization
INSERT INTO relations (organization_id, from_node_id, to_node_id, description) VALUES
('demo_org', 'demo_it', 'demo_operations', 'Provides IT infrastructure and technical support'),
('demo_org', 'demo_marketing', 'demo_sales', 'Generates leads and supports sales efforts'),
('demo_org', 'demo_product', 'demo_sales', 'Provides products for sales team'),
('demo_org', 'demo_finance', 'demo_operations', 'Provides financial planning and budget oversight'),
('demo_org', 'demo_hr', 'demo_operations', 'Provides HR support and employee services'),
('demo_org', 'demo_it', 'demo_marketing', 'Provides technical infrastructure for marketing campaigns'),
('demo_org', 'demo_product', 'demo_marketing', 'Provides product information for marketing materials')

ON CONFLICT (organization_id, from_node_id, to_node_id, description) DO NOTHING;

-- Verify the demo organization setup
SELECT 'Demo organization setup completed successfully!' as status;
SELECT * FROM organizations WHERE id = 'demo_org';
SELECT COUNT(*) as total_nodes FROM nodes WHERE organization_id = 'demo_org';
SELECT COUNT(*) as total_metrics FROM metrics WHERE organization_id = 'demo_org';
SELECT COUNT(*) as total_relations FROM relations WHERE organization_id = 'demo_org';
