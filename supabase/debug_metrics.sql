-- Debug script to check metrics in the database
-- Run this in Supabase SQL Editor to see what's happening with metrics

-- Check if demo_org exists
SELECT 'Organizations:' as info;
SELECT * FROM organizations WHERE id = 'demo_org';

-- Check nodes for demo_org
SELECT 'Nodes count:' as info;
SELECT COUNT(*) as total_nodes FROM nodes WHERE organization_id = 'demo_org';

-- Check metrics for demo_org
SELECT 'Metrics count:' as info;
SELECT COUNT(*) as total_metrics FROM metrics WHERE organization_id = 'demo_org';

-- Check specific metrics
SELECT 'All metrics:' as info;
SELECT * FROM metrics WHERE organization_id = 'demo_org';

-- Check if nodes have metrics linked
SELECT 'Nodes with metrics:' as info;
SELECT 
    n.id,
    n.name,
    COUNT(m.id) as metric_count
FROM nodes n
LEFT JOIN metrics m ON n.id = m.node_id AND n.organization_id = m.organization_id
WHERE n.organization_id = 'demo_org'
GROUP BY n.id, n.name
ORDER BY metric_count DESC;

-- Test the getNodesWithMetrics query
SELECT 'Test getNodesWithMetrics query:' as info;
SELECT 
    n.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', m.id,
                'name', m.name,
                'type', m.type,
                'unit', m.unit,
                'data', m.data
            )
        ) FILTER (WHERE m.id IS NOT NULL),
        '[]'::json
    ) as metrics
FROM nodes n
LEFT JOIN metrics m ON n.id = m.node_id AND n.organization_id = m.organization_id
WHERE n.organization_id = 'demo_org'
GROUP BY n.id
ORDER BY n.name;
