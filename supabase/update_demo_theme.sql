-- Update demo organization with logo and new theme system
-- Run this in Supabase SQL Editor

-- Update the demo organization with a logo and current theme
UPDATE organizations 
SET branding = jsonb_build_object(
    'primaryColor', '#ff5a00',
    'secondaryColor', '#e53e3e', 
    'fontFamily', 'system',
    'fontSize', '16',
    'logo', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjZmY1YTAwIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkQ8L3RleHQ+Cjwvc3ZnPg==',
    'backgroundColor', '#f8fafc',
    'textColor', '#1a202c',
    'borderColor', '#e2e8f0',
    'mutedColor', '#718096',
    'nodeBackgroundColor', '#ffffff',
    'buttonBackgroundColor', '#ffffff',
    'accentBackgroundColor', '#ffe6d5',
    'treeItemBackgroundColor', '#fff4ed',
    'hoverColor', '#ff5a00',
    'selectedColor', '#ff5a00',
    'nodeStrokeColor', '#ff5a00'
),
updated_at = NOW()
WHERE id = 'demo_org';

-- Verify the update
SELECT id, name, branding FROM organizations WHERE id = 'demo_org';
