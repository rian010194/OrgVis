-- User Management System for Large Organizations (1000+ employees)
-- Extends the existing multi-organization database with scalable user management

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create departments table for better organization
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL, -- Short code like "HR", "IT", "FIN"
    parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    manager_user_id UUID, -- Will be set after users are created
    description TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, code)
);

-- Create users table with enhanced fields for large organizations
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL, -- Employee number/ID
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    position TEXT DEFAULT '', -- Job title
    level INTEGER DEFAULT 1, -- Organizational level (1=CEO, 2=VP, etc.)
    role TEXT NOT NULL DEFAULT 'member', -- 'super_admin', 'org_admin', 'department_admin', 'team_lead', 'member'
    manager_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    permissions JSONB DEFAULT '{}'::jsonb, -- Specific permissions per user
    profile_data JSONB DEFAULT '{}'::jsonb, -- Profile information, phone, etc.
    employment_data JSONB DEFAULT '{}'::jsonb, -- Start date, contract type, etc.
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, employee_id)
);

-- Create bulk import jobs table for tracking imports
CREATE TABLE IF NOT EXISTS bulk_import_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    total_rows INTEGER NOT NULL,
    processed_rows INTEGER DEFAULT 0,
    successful_rows INTEGER DEFAULT 0,
    failed_rows INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    errors JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_activities table (audit log)
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'view', 'edit', 'create', 'delete', 'import', 'export'
    resource_type TEXT NOT NULL, -- 'node', 'metric', 'relation', 'user', 'department'
    resource_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_node_permissions table (hierarchical permissions)
CREATE TABLE IF NOT EXISTS user_node_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    node_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    permission_type TEXT NOT NULL DEFAULT 'view', -- 'view', 'edit', 'admin', 'inherit'
    include_children BOOLEAN DEFAULT true, -- If permissions apply to child nodes
    can_manage_children BOOLEAN DEFAULT false, -- If user can manage child nodes
    can_create_children BOOLEAN DEFAULT false, -- If user can create new child nodes
    can_delete_children BOOLEAN DEFAULT false, -- If user can delete child nodes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, node_id)
);

-- Create indexes for better performance with large datasets
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_departments_organization_id ON departments(organization_id);
CREATE INDEX IF NOT EXISTS idx_departments_parent_id ON departments(parent_department_id);
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_organization_id ON user_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);

CREATE INDEX IF NOT EXISTS idx_user_node_permissions_user_id ON user_node_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_node_permissions_node_id ON user_node_permissions(node_id);
CREATE INDEX IF NOT EXISTS idx_user_node_permissions_organization_id ON user_node_permissions(organization_id);

CREATE INDEX IF NOT EXISTS idx_bulk_import_jobs_organization_id ON bulk_import_jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_bulk_import_jobs_status ON bulk_import_jobs(status);

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_node_permissions_updated_at ON user_node_permissions;
CREATE TRIGGER update_user_node_permissions_updated_at BEFORE UPDATE ON user_node_permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_node_permissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Admins can manage users in their organization" ON users;
DROP POLICY IF EXISTS "Users can view departments in their organization" ON departments;
DROP POLICY IF EXISTS "Admins can manage departments" ON departments;
DROP POLICY IF EXISTS "Users can view their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can view their own activities" ON user_activities;
DROP POLICY IF EXISTS "Users can view their own node permissions" ON user_node_permissions;
DROP POLICY IF EXISTS "Admins can manage node permissions" ON user_node_permissions;

-- Create RLS policies
-- Users can view their own data and users in their organization (for admins)
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (
        id = auth.uid()::text::uuid OR 
        (organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()::text::uuid AND role IN ('org_admin', 'super_admin')
        ))
    );

-- Users can update their own profile data
CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (id = auth.uid()::text::uuid);

-- Admins can manage users in their organization
CREATE POLICY "Admins can manage users in their organization" ON users
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()::text::uuid 
            AND role IN ('org_admin', 'super_admin')
        )
    );

-- Department policies
CREATE POLICY "Users can view departments in their organization" ON departments
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()::text::uuid
        )
    );

CREATE POLICY "Admins can manage departments" ON departments
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()::text::uuid 
            AND role IN ('org_admin', 'super_admin')
        )
    );

-- Session policies
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (user_id = auth.uid()::text::uuid);

-- Activity policies
CREATE POLICY "Users can view their own activities" ON user_activities
    FOR SELECT USING (
        user_id = auth.uid()::text::uuid OR
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()::text::uuid 
            AND role IN ('org_admin', 'super_admin')
        )
    );

-- Node permissions policies
CREATE POLICY "Users can view their own node permissions" ON user_node_permissions
    FOR SELECT USING (
        user_id = auth.uid()::text::uuid OR
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()::text::uuid 
            AND role IN ('org_admin', 'super_admin', 'department_admin')
        )
    );

CREATE POLICY "Admins can manage node permissions" ON user_node_permissions
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()::text::uuid 
            AND role IN ('org_admin', 'super_admin', 'department_admin')
        )
    );

-- Bulk import jobs policies
CREATE POLICY "Users can view import jobs in their organization" ON bulk_import_jobs
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()::text::uuid
        )
    );

CREATE POLICY "Admins can manage import jobs" ON bulk_import_jobs
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM users 
            WHERE id = auth.uid()::text::uuid 
            AND role IN ('org_admin', 'super_admin')
        )
    );

-- Function to automatically assign role based on organizational level
CREATE OR REPLACE FUNCTION auto_assign_role_by_level(user_level INTEGER)
RETURNS TEXT AS $$
BEGIN
    CASE 
        WHEN user_level <= 1 THEN RETURN 'org_admin';
        WHEN user_level <= 3 THEN RETURN 'department_admin';
        WHEN user_level <= 5 THEN RETURN 'team_lead';
        ELSE RETURN 'member';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to get user permissions for a specific node (including inherited permissions)
CREATE OR REPLACE FUNCTION get_user_node_permissions(user_id_param UUID, node_id_param TEXT, org_id_param TEXT)
RETURNS JSONB AS $$
DECLARE
    user_role TEXT;
    user_permissions JSONB;
    user_level INTEGER;
    node_permission RECORD;
    parent_node_id TEXT;
    inherited_permission JSONB;
BEGIN
    -- Get user role, permissions, and level
    SELECT role, permissions, level INTO user_role, user_permissions, user_level
    FROM users 
    WHERE id = user_id_param AND organization_id = org_id_param AND is_active = true;
    
    IF user_role IS NULL THEN
        RETURN '{"access": false}'::jsonb;
    END IF;
    
    -- Check for specific node permission
    SELECT * INTO node_permission
    FROM user_node_permissions 
    WHERE user_id = user_id_param 
    AND node_id = node_id_param 
    AND organization_id = org_id_param;
    
    -- If specific permission exists, return it
    IF node_permission IS NOT NULL THEN
        RETURN jsonb_build_object(
            'access', true,
            'permission_type', node_permission.permission_type,
            'include_children', node_permission.include_children,
            'can_manage_children', node_permission.can_manage_children,
            'can_create_children', node_permission.can_create_children,
            'can_delete_children', node_permission.can_delete_children,
            'source', 'direct'
        );
    END IF;
    
    -- Check for inherited permissions from parent nodes
    SELECT parent_id INTO parent_node_id
    FROM nodes 
    WHERE id = node_id_param AND organization_id = org_id_param;
    
    -- If parent exists, check for inherited permission
    IF parent_node_id IS NOT NULL THEN
        SELECT * INTO node_permission
        FROM user_node_permissions 
        WHERE user_id = user_id_param 
        AND node_id = parent_node_id 
        AND organization_id = org_id_param
        AND include_children = true;
        
        IF node_permission IS NOT NULL THEN
            RETURN jsonb_build_object(
                'access', true,
                'permission_type', node_permission.permission_type,
                'include_children', node_permission.include_children,
                'can_manage_children', node_permission.can_manage_children,
                'can_create_children', node_permission.can_create_children,
                'can_delete_children', node_permission.can_delete_children,
                'source', 'inherited',
                'inherited_from', parent_node_id
            );
        END IF;
    END IF;
    
    -- Fall back to role-based permissions with level consideration
    CASE user_role
        WHEN 'super_admin' THEN
            RETURN jsonb_build_object(
                'access', true,
                'permission_type', 'admin',
                'include_children', true,
                'can_manage_children', true,
                'can_create_children', true,
                'can_delete_children', true,
                'source', 'role'
            );
        WHEN 'org_admin' THEN
            RETURN jsonb_build_object(
                'access', true,
                'permission_type', 'admin',
                'include_children', true,
                'can_manage_children', true,
                'can_create_children', true,
                'can_delete_children', user_level <= 2,
                'source', 'role'
            );
        WHEN 'department_admin' THEN
            RETURN jsonb_build_object(
                'access', true,
                'permission_type', 'edit',
                'include_children', true,
                'can_manage_children', true,
                'can_create_children', true,
                'can_delete_children', false,
                'source', 'role'
            );
        WHEN 'team_lead' THEN
            RETURN jsonb_build_object(
                'access', true,
                'permission_type', 'edit',
                'include_children', true,
                'can_manage_children', true,
                'can_create_children', false,
                'can_delete_children', false,
                'source', 'role'
            );
        WHEN 'member' THEN
            RETURN jsonb_build_object(
                'access', true,
                'permission_type', 'view',
                'include_children', false,
                'can_manage_children', false,
                'can_create_children', false,
                'can_delete_children', false,
                'source', 'role'
            );
        ELSE
            RETURN '{"access": false}'::jsonb;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to bulk create users from CSV data
CREATE OR REPLACE FUNCTION bulk_create_users(
    org_id_param TEXT,
    created_by_param UUID,
    users_data JSONB
)
RETURNS JSONB AS $$
DECLARE
    user_data JSONB;
    new_user_id UUID;
    success_count INTEGER := 0;
    error_count INTEGER := 0;
    errors JSONB := '[]'::jsonb;
    error_detail JSONB;
    auto_role TEXT;
BEGIN
    -- Loop through each user in the data
    FOR user_data IN SELECT * FROM jsonb_array_elements(users_data)
    LOOP
        BEGIN
            -- Auto-assign role based on level if not specified
            IF user_data->>'role' IS NULL OR user_data->>'role' = '' THEN
                auto_role := auto_assign_role_by_level((user_data->>'level')::INTEGER);
            ELSE
                auto_role := user_data->>'role';
            END IF;
            
            -- Create user
            INSERT INTO users (
                organization_id, employee_id, email, name, first_name, last_name,
                password_hash, department_id, position, level, role, manager_user_id,
                permissions, profile_data, employment_data
            ) VALUES (
                org_id_param,
                user_data->>'employee_id',
                user_data->>'email',
                user_data->>'name',
                user_data->>'first_name',
                user_data->>'last_name',
                user_data->>'password_hash', -- Should be pre-hashed
                (user_data->>'department_id')::UUID,
                user_data->>'position',
                (user_data->>'level')::INTEGER,
                auto_role,
                (user_data->>'manager_user_id')::UUID,
                COALESCE(user_data->'permissions', '{}'::jsonb),
                COALESCE(user_data->'profile_data', '{}'::jsonb),
                COALESCE(user_data->'employment_data', '{}'::jsonb)
            ) RETURNING id INTO new_user_id;
            
            success_count := success_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            error_detail := jsonb_build_object(
                'employee_id', user_data->>'employee_id',
                'email', user_data->>'email',
                'error', SQLERRM
            );
            errors := errors || error_detail;
        END;
    END LOOP;
    
    -- Log the bulk import activity
    PERFORM log_user_activity(
        created_by_param,
        org_id_param,
        'bulk_import',
        'users',
        NULL,
        jsonb_build_object(
            'total_users', jsonb_array_length(users_data),
            'successful', success_count,
            'failed', error_count,
            'errors', errors
        )
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'total_users', jsonb_array_length(users_data),
        'successful', success_count,
        'failed', error_count,
        'errors', errors
    );
END;
$$ LANGUAGE plpgsql;

-- Function to create a new user
CREATE OR REPLACE FUNCTION create_user(
    user_employee_id TEXT,
    user_email TEXT,
    user_name TEXT,
    user_first_name TEXT,
    user_last_name TEXT,
    user_password_hash TEXT,
    user_org_id TEXT,
    user_department_id UUID DEFAULT NULL,
    user_position TEXT DEFAULT '',
    user_level INTEGER DEFAULT 5,
    user_role TEXT DEFAULT NULL,
    user_manager_id UUID DEFAULT NULL,
    user_permissions JSONB DEFAULT '{}'::jsonb,
    user_profile_data JSONB DEFAULT '{}'::jsonb,
    user_employment_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
    auto_role TEXT;
BEGIN
    -- Auto-assign role if not specified
    IF user_role IS NULL OR user_role = '' THEN
        auto_role := auto_assign_role_by_level(user_level);
    ELSE
        auto_role := user_role;
    END IF;
    
    INSERT INTO users (
        organization_id, employee_id, email, name, first_name, last_name,
        password_hash, department_id, position, level, role, manager_user_id,
        permissions, profile_data, employment_data
    ) VALUES (
        user_org_id, user_employee_id, user_email, user_name, user_first_name, user_last_name,
        user_password_hash, user_department_id, user_position, user_level, auto_role, user_manager_id,
        user_permissions, user_profile_data, user_employment_data
    ) RETURNING id INTO new_user_id;
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to assign node permissions to a user
CREATE OR REPLACE FUNCTION assign_node_permission(
    user_id_param UUID,
    node_id_param TEXT,
    org_id_param TEXT,
    permission_type_param TEXT,
    include_children_param BOOLEAN DEFAULT true,
    can_manage_children_param BOOLEAN DEFAULT false,
    can_create_children_param BOOLEAN DEFAULT false,
    can_delete_children_param BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    permission_id UUID;
BEGIN
    INSERT INTO user_node_permissions (
        user_id, node_id, organization_id, permission_type,
        include_children, can_manage_children, can_create_children, can_delete_children
    ) VALUES (
        user_id_param, node_id_param, org_id_param, permission_type_param,
        include_children_param, can_manage_children_param, can_create_children_param, can_delete_children_param
    ) 
    ON CONFLICT (user_id, node_id) 
    DO UPDATE SET
        permission_type = EXCLUDED.permission_type,
        include_children = EXCLUDED.include_children,
        can_manage_children = EXCLUDED.can_manage_children,
        can_create_children = EXCLUDED.can_create_children,
        can_delete_children = EXCLUDED.can_delete_children,
        updated_at = NOW()
    RETURNING id INTO permission_id;
    
    RETURN permission_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
    user_id_param UUID,
    org_id_param TEXT,
    action_param TEXT,
    resource_type_param TEXT,
    resource_id_param TEXT DEFAULT NULL,
    details_param JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO user_activities (
        user_id, organization_id, action, resource_type, resource_id, details
    ) VALUES (
        user_id_param, org_id_param, action_param, resource_type_param, resource_id_param, details_param
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get organization statistics
CREATE OR REPLACE FUNCTION get_organization_stats(org_id_param TEXT)
RETURNS JSONB AS $$
DECLARE
    total_users INTEGER;
    active_users INTEGER;
    total_departments INTEGER;
    users_by_role JSONB;
    users_by_level JSONB;
BEGIN
    -- Get total users
    SELECT COUNT(*) INTO total_users FROM users WHERE organization_id = org_id_param;
    
    -- Get active users
    SELECT COUNT(*) INTO active_users FROM users WHERE organization_id = org_id_param AND is_active = true;
    
    -- Get total departments
    SELECT COUNT(*) INTO total_departments FROM departments WHERE organization_id = org_id_param AND is_active = true;
    
    -- Get users by role
    SELECT jsonb_object_agg(role, count) INTO users_by_role
    FROM (
        SELECT role, COUNT(*) as count
        FROM users 
        WHERE organization_id = org_id_param AND is_active = true
        GROUP BY role
    ) role_counts;
    
    -- Get users by level
    SELECT jsonb_object_agg(level::text, count) INTO users_by_level
    FROM (
        SELECT level, COUNT(*) as count
        FROM users 
        WHERE organization_id = org_id_param AND is_active = true
        GROUP BY level
        ORDER BY level
    ) level_counts;
    
    RETURN jsonb_build_object(
        'total_users', total_users,
        'active_users', active_users,
        'total_departments', total_departments,
        'users_by_role', users_by_role,
        'users_by_level', users_by_level
    );
END;
$$ LANGUAGE plpgsql;

-- Insert sample departments for Demo organization
INSERT INTO departments (organization_id, name, code, description) VALUES       
('demo', 'Executive Leadership', 'EXEC', 'Executive leadership team'),      
('demo', 'Global Operations', 'OPS', 'Global operations and regional management'),
('demo', 'Support Office', 'SUPPORT', 'Global support office and standards'),
('demo', 'Human Resources', 'HR', 'Human resources and talent management'), 
('demo', 'Information Technology', 'IT', 'IT infrastructure and systems'),  
('demo', 'Finance', 'FIN', 'Financial management and reporting'),
('demo', 'Marketing', 'MKT', 'Marketing and brand management'),
('demo', 'Regional Management', 'REGION', 'Regional operations management') 

ON CONFLICT (organization_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Insert sample admin user for Demo organization (no password required)
INSERT INTO users (
    organization_id, employee_id, email, name, first_name, last_name, password_hash,
    department_id, position, level, role, permissions, profile_data
) VALUES (
    'demo',
    'EMP001',
    'admin@demo.com',
    'Demo Admin',
    'Demo',
    'Admin',
    '', -- No password required
    (SELECT id FROM departments WHERE organization_id = 'demo' AND code = 'EXEC'),
    'Organization Administrator',
    1,
    'org_admin',
    '{"can_manage_branding": true, "can_invite_users": true, "can_bulk_import": true}'::jsonb,
    '{"title": "Organization Administrator", "phone": "+46 123 456 789", "department": "Executive"}'::jsonb
) ON CONFLICT (organization_id, employee_id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions,
    profile_data = EXCLUDED.profile_data,
    updated_at = NOW();

-- Verify the setup
SELECT 'User management system for large organizations setup completed successfully!' as status;
SELECT COUNT(*) as total_departments FROM departments;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_user_node_permissions FROM user_node_permissions;
