-- Migration to add organizations table and organization_id columns
-- This updates the existing schema to support multi-organization functionality

-- First, create the organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    type TEXT NOT NULL DEFAULT 'company',
    password_hash TEXT DEFAULT NULL, -- NULL means no password protection
    branding JSONB DEFAULT '{}'::jsonb, -- Store logo, colors, fonts, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add organization_id column to existing nodes table
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Add organization_id column to existing metrics table  
ALTER TABLE metrics ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Add organization_id column to existing relations table
ALTER TABLE relations ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Create foreign key constraints (only if they don't exist)
DO $$
BEGIN
    -- Add foreign key constraint for nodes.organization_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'nodes_organization_id_fkey'
    ) THEN
        ALTER TABLE nodes ADD CONSTRAINT nodes_organization_id_fkey 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key constraint for metrics.organization_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'metrics_organization_id_fkey'
    ) THEN
        ALTER TABLE metrics ADD CONSTRAINT metrics_organization_id_fkey 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key constraint for relations.organization_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'relations_organization_id_fkey'
    ) THEN
        ALTER TABLE relations ADD CONSTRAINT relations_organization_id_fkey 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);
CREATE INDEX IF NOT EXISTS idx_nodes_organization_id ON nodes(organization_id);
CREATE INDEX IF NOT EXISTS idx_metrics_organization_id ON metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_relations_organization_id ON relations(organization_id);

-- Create trigger for organizations table (drop first if exists)
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security for organizations table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Create policy for organizations table (drop first if exists)
DROP POLICY IF EXISTS "Allow all operations on organizations" ON organizations;
CREATE POLICY "Allow all operations on organizations" ON organizations
    FOR ALL USING (true);

-- Insert JumpYard demo organization
INSERT INTO organizations (id, name, description, type, password_hash, branding) VALUES
('jumpyard', 'JumpYard', 'Demo organization showcasing the platform capabilities', 'company', 
 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', -- hash of 'jumpyard'
 '{"primaryColor": "#ff5a00", "secondaryColor": "#e53e3e", "fontFamily": "inter", "fontSize": 16, "logo": null}'::jsonb)

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    type = EXCLUDED.type,
    password_hash = EXCLUDED.password_hash,
    branding = EXCLUDED.branding,
    updated_at = NOW();

-- Update existing nodes to belong to jumpyard organization
UPDATE nodes SET organization_id = 'jumpyard' WHERE organization_id IS NULL;

-- Update existing metrics to belong to jumpyard organization
UPDATE metrics SET organization_id = 'jumpyard' WHERE organization_id IS NULL;

-- Update existing relations to belong to jumpyard organization
UPDATE relations SET organization_id = 'jumpyard' WHERE organization_id IS NULL;

-- Make organization_id columns NOT NULL after setting default values
-- Only do this if the columns don't already have NOT NULL constraints
DO $$
BEGIN
    -- Check and set NOT NULL for nodes.organization_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'nodes' AND column_name = 'organization_id' AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE nodes ALTER COLUMN organization_id SET NOT NULL;
    END IF;
    
    -- Check and set NOT NULL for metrics.organization_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'metrics' AND column_name = 'organization_id' AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE metrics ALTER COLUMN organization_id SET NOT NULL;
    END IF;
    
    -- Check and set NOT NULL for relations.organization_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'relations' AND column_name = 'organization_id' AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE relations ALTER COLUMN organization_id SET NOT NULL;
    END IF;
END $$;

-- Verify the migration
SELECT 'Migration completed successfully!' as status;
SELECT COUNT(*) as total_organizations FROM organizations;
SELECT COUNT(*) as total_nodes_with_org FROM nodes WHERE organization_id IS NOT NULL;
SELECT COUNT(*) as total_metrics_with_org FROM metrics WHERE organization_id IS NOT NULL;
SELECT COUNT(*) as total_relations_with_org FROM relations WHERE organization_id IS NOT NULL;
