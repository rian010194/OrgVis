# Supabase Database Update Guide

## Overview

The application has been updated to support multiple organizations with a landing page system. This requires updating the Supabase database schema to support the new multi-organization structure.

## What Changed

### Before (Single Organization)
- All data was stored without organization context
- Single set of nodes, metrics, and relations
- No user authentication or organization management

### After (Multi-Organization)
- Each organization has its own isolated data
- Organizations can have passwords and custom branding
- Landing page system for creating and accessing organizations
- Organization-specific data storage

## Database Schema Changes

### New Tables

1. **organizations** - Stores organization information
   - `id` (TEXT PRIMARY KEY) - Unique organization identifier
   - `name` (TEXT) - Organization name
   - `description` (TEXT) - Organization description
   - `type` (TEXT) - Organization type (company, nonprofit, etc.)
   - `password_hash` (TEXT) - Hashed password for organization access
   - `branding` (JSONB) - Custom branding settings (colors, fonts, logo)
   - `created_at` (TIMESTAMP) - Creation timestamp
   - `updated_at` (TIMESTAMP) - Last update timestamp

### Modified Tables

All existing tables now include `organization_id` foreign key:

1. **nodes** - Now includes `organization_id` field
2. **metrics** - Now includes `organization_id` field  
3. **relations** - Now includes `organization_id` field

## How to Update Your Supabase Database

### Option 1: Use the New Multi-Organization Schema (Recommended)

1. **Run the new schema script**:
   ```sql
   -- Copy and paste the contents of supabase/setup_database_multi_org.sql
   -- into your Supabase SQL editor and execute it
   ```

2. **Update your production files**:
   - Replace `js/supabase.js` with `js/supabase-multi-org.js`
   - Replace `js/data-supabase.js` with `js/data-supabase-multi-org.js`
   - Update `index-prod.html` to use the new files

3. **Update script references in index-prod.html**:
   ```html
   <!-- Replace these lines -->
   <script type="module" src="js/supabase.js?v=20241221"></script>
   <script type="module" src="js/data-supabase.js?v=20241221"></script>
   
   <!-- With these -->
   <script type="module" src="js/supabase-multi-org.js?v=20241221"></script>
   <script type="module" src="js/data-supabase-multi-org.js?v=20241221"></script>
   ```

### Option 2: Keep Using Mock Data (Current Setup)

If you want to continue using mock data without Supabase:

1. **Keep the current setup** - Your `index-prod.html` is already configured to use mock data
2. **No database changes needed** - The landing page works with localStorage
3. **Limitations** - Data won't persist across devices/browsers

## Migration Steps

### If You Have Existing Data

If you have existing data in your Supabase database that you want to preserve:

1. **Backup your data**:
   ```sql
   -- Export existing data
   SELECT * FROM nodes;
   SELECT * FROM metrics;
   SELECT * FROM relations;
   ```

2. **Create a migration script**:
   ```sql
   -- Create a default organization for existing data
   INSERT INTO organizations (id, name, description, type) 
   VALUES ('default_org', 'Default Organization', 'Migrated from single-org setup', 'company');
   
   -- Update existing nodes to belong to default organization
   ALTER TABLE nodes ADD COLUMN organization_id TEXT;
   UPDATE nodes SET organization_id = 'default_org';
   ALTER TABLE nodes ALTER COLUMN organization_id SET NOT NULL;
   ALTER TABLE nodes ADD FOREIGN KEY (organization_id) REFERENCES organizations(id);
   
   -- Update existing metrics
   ALTER TABLE metrics ADD COLUMN organization_id TEXT;
   UPDATE metrics SET organization_id = 'default_org';
   ALTER TABLE metrics ALTER COLUMN organization_id SET NOT NULL;
   ALTER TABLE metrics ADD FOREIGN KEY (organization_id) REFERENCES organizations(id);
   
   -- Update existing relations
   ALTER TABLE relations ADD COLUMN organization_id TEXT;
   UPDATE relations SET organization_id = 'default_org';
   ALTER TABLE relations ALTER COLUMN organization_id SET NOT NULL;
   ALTER TABLE relations ADD FOREIGN KEY (organization_id) REFERENCES organizations(id);
   ```

## Testing the Update

### 1. Test Organization Creation
- Visit your site
- Click "Create Organization"
- Fill out the form and create an organization
- Verify it appears in the organizations table

### 2. Test Data Isolation
- Create two different organizations
- Add nodes to each organization
- Verify data is isolated between organizations

### 3. Test Branding
- Create an organization with custom colors/fonts
- Verify branding is applied correctly
- Test logo upload functionality

### 4. Test Password Protection
- Create an organization with a password
- Log out and try to access it
- Verify password prompt appears

## Rollback Plan

If you need to rollback to the single-organization setup:

1. **Revert to old schema**:
   ```sql
   -- Run the original setup_database.sql script
   ```

2. **Update production files**:
   - Revert to original `js/supabase.js` and `js/data-supabase.js`
   - Update `index-prod.html` to use original files

3. **Restore data**:
   - Import your backed-up data

## File Structure

```
supabase/
├── setup_database.sql              # Original single-org schema
├── setup_database_safe.sql         # Safe version of original
├── setup_database_multi_org.sql    # New multi-org schema
└── seed.sql                        # Sample data

js/
├── supabase.js                     # Original Supabase interface
├── supabase-multi-org.js          # New multi-org Supabase interface
├── data-supabase.js               # Original data handling
└── data-supabase-multi-org.js     # New multi-org data handling
```

## Support

If you encounter issues:

1. Check the browser console for errors
2. Verify your Supabase configuration in `js/config.js`
3. Ensure all foreign key constraints are properly set up
4. Test with a fresh database first before migrating existing data

## Next Steps

After updating to the multi-organization schema:

1. **Enable Supabase in production** by updating `index-prod.html`
2. **Test thoroughly** with multiple organizations
3. **Consider adding user authentication** for better security
4. **Implement organization sharing** features if needed
