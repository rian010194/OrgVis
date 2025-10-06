// Supabase-powered OrgStore with Multi-Organization Support
// Note: orgDb is made globally available by supabase-multi-org.js

const OrgStore = (() => {
  const state = {
    nodesById: new Map(),
    rootIds: [],
    isLoaded: false,
    loadPromise: null,
    lastError: null,
    currentOrganizationId: null
  };
  const subscribers = new Set();

  const clone = (value) => JSON.parse(JSON.stringify(value));

  const normaliseRelation = (relation, directionKey) => {
    if (!relation) {
      return null;
    }
    const nodeId = relation[directionKey];
    if (!nodeId) {
      return null;
    }
    return {
      [directionKey]: String(nodeId),
      desc: relation.desc ? String(relation.desc) : ""
    };
  };

  const normaliseMetrics = (metrics) => {
    if (!metrics) {
      return [];
    }
    
    // Handle both old format (single metrics object) and new format (array of metrics)
    if (Array.isArray(metrics)) {
      return metrics.map(metric => {
        if (!metric || typeof metric !== "object") {
          return null;
        }
        // Handle both Supabase format (type) and frontend format (chartType)
        const chartType = metric.type || metric.chartType || "pie";
        
        const result = {
          id: metric.id || Date.now() + Math.random(),
          name: metric.name || "Time spent on:",
          type: chartType,
          chartType: chartType, // Keep both for compatibility
          unit: metric.unit || "%",
          data: {},
          values: [] // Keep values array for frontend compatibility
        };
        
        // Handle Supabase data format (object with key-value pairs)
        if (metric.data && typeof metric.data === "object") {
          Object.entries(metric.data).forEach(([key, value]) => {
            if (key === undefined || key === null) {
              return;
            }
            const numeric = Number(value);
            if (Number.isFinite(numeric)) {
              result.data[String(key)] = numeric;
              // Also create values array for frontend compatibility
              result.values.push({
                label: String(key),
                value: numeric
              });
            }
          });
        }
        // Handle frontend values format (array of {label, value} objects)
        else if (metric.values && Array.isArray(metric.values)) {
          metric.values.forEach(item => {
            if (item && item.label && item.value !== undefined) {
              const numeric = Number(item.value);
              if (Number.isFinite(numeric)) {
                result.data[String(item.label)] = numeric;
                result.values.push({
                  label: String(item.label),
                  value: numeric
                });
              }
            }
          });
        }
        // Handle case where metric is the data object itself (old format)
        else if (typeof metric === "object" && !metric.data && !metric.values) {
          Object.entries(metric).forEach(([key, value]) => {
            if (key === "id" || key === "name" || key === "type" || key === "chartType" || key === "unit") {
              return;
            }
            const numeric = Number(value);
            if (Number.isFinite(numeric)) {
              result.data[String(key)] = numeric;
              result.values.push({
                label: String(key),
                value: numeric
              });
            }
          });
        }
        
        return Object.keys(result.data).length ? result : null;
      }).filter(Boolean);
    }
    
    // Convert old format to new format
    if (typeof metrics === "object") {
      const result = {
        id: Date.now() + Math.random(),
        name: "Time spent on:",
        type: "pie",
        chartType: "pie",
        unit: "%",
        data: {},
        values: []
      };
      
      Object.entries(metrics).forEach(([key, value]) => {
        if (key === undefined || key === null) {
          return;
        }
        const numeric = Number(value);
        if (Number.isFinite(numeric)) {
          result.data[String(key)] = numeric;
          result.values.push({
            label: String(key),
            value: numeric
          });
        }
      });
      
      return Object.keys(result.data).length ? [result] : [];
    }
    
    return [];
  };

  const normaliseStringList = (value) => {
    if (value === null || value === undefined) {
      return [];
    }
    let list;
    if (Array.isArray(value)) {
      list = value;
    } else if (typeof value === "string") {
      list = value.split(/\r?\n/);
    } else {
      return [];
    }
    return list
      .map((item) => String(item).trim())
      .filter(Boolean);
  };

  const normaliseNode = (rawNode) => {
    const node = {
      id: String(rawNode.id),
      name: rawNode.name ? String(rawNode.name) : String(rawNode.id),
      type: rawNode.type ? String(rawNode.type) : "Unit",
      role: rawNode.role ? String(rawNode.role) : "",
      parent: rawNode.parent === null || rawNode.parent === undefined || rawNode.parent === "" ? null : String(rawNode.parent),
      children: Array.isArray(rawNode.children)
        ? Array.from(new Set(rawNode.children.map((childId) => String(childId))))
        : [],
      inputs: Array.isArray(rawNode.inputs)
        ? rawNode.inputs
            .map((relation) => normaliseRelation(relation, "from"))
            .filter(Boolean)
        : [],
      outputs: Array.isArray(rawNode.outputs)
        ? rawNode.outputs
            .map((relation) => normaliseRelation(relation, "to"))
            .filter(Boolean)
        : []
    };

    // Handle metrics from Supabase
    if (rawNode.metrics && Array.isArray(rawNode.metrics)) {
      node.metrics = normaliseMetrics(rawNode.metrics);
    } else {
      node.metrics = [];
    }

    node.responsibilities = normaliseStringList(rawNode.responsibilities);
    node.outcomes = normaliseStringList(rawNode.outcomes);
    node.supportOffice = rawNode.supportOffice ? String(rawNode.supportOffice) : null;

    return node;
  };

  const rebuildIndexes = () => {
    const childSets = new Map();
    state.nodesById.forEach((node) => {
      const set = new Set();
      node.children.forEach((childId) => {
        if (state.nodesById.has(childId)) {
          set.add(childId);
        }
      });
      childSets.set(node.id, set);
    });

    state.rootIds = [];
    state.nodesById.forEach((node) => {
      const parentId = node.parent;
      if (parentId && state.nodesById.has(parentId)) {
        childSets.get(parentId).add(node.id);
      } else {
        node.parent = null;
        state.rootIds.push(node.id);
      }
    });

    state.nodesById.forEach((node) => {
      node.children = Array.from(childSets.get(node.id));
    });
  };

  const notify = () => {
    subscribers.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error("OrgStore subscriber failed", err);
      }
    });
  };

  const ensureLoaded = async () => {
    if (state.isLoaded && state.currentOrganizationId) {
      return;
    }
    if (state.loadPromise) {
      await state.loadPromise;
      return;
    }
    await load();
  };

  const ensureOrganizationExists = async (organizationId) => {
    try {
      console.log('Checking if organization exists:', organizationId);
      
      // Try to get organization data from localStorage first
      const orgData = JSON.parse(localStorage.getItem(`org_${organizationId}`) || '{}');
      
      if (orgData.id && orgData.name) {
        console.log('Organization data found in localStorage:', orgData);
        
        // Try to create the organization in Supabase
        try {
          await window.orgDb.createOrganization({
            id: organizationId,
            name: orgData.name,
            description: orgData.description || `${orgData.name} organization`,
            type: orgData.type || 'company',
            password_hash: orgData.password_hash || null
          });
          console.log('Organization created in Supabase:', organizationId);
        } catch (createError) {
          // Check for various duplicate key error formats
          const isDuplicateError = createError.message && (
            createError.message.includes('already exists') ||
            createError.message.includes('duplicate key') ||
            createError.message.includes('violates unique constraint') ||
            createError.code === '23505' // PostgreSQL unique violation code
          );
          
          if (isDuplicateError) {
            console.log('Organization already exists in Supabase:', organizationId);
          } else {
            console.error('Error creating organization in Supabase:', createError);
            // Don't throw here - let the load continue with local-only mode
          }
        }
      } else {
        console.log('No organization data found in localStorage for:', organizationId);
        // Create a basic organization entry
        try {
          await window.orgDb.createOrganization({
            id: organizationId,
            name: `Organization ${organizationId}`,
            description: `Auto-created organization`,
            type: 'company',
            password_hash: null
          });
          console.log('Basic organization created in Supabase:', organizationId);
        } catch (createError) {
          // Check for various duplicate key error formats
          const isDuplicateError = createError.message && (
            createError.message.includes('already exists') ||
            createError.message.includes('duplicate key') ||
            createError.message.includes('violates unique constraint') ||
            createError.code === '23505' // PostgreSQL unique violation code
          );
          
          if (isDuplicateError) {
            console.log('Basic organization already exists in Supabase:', organizationId);
          } else {
            console.error('Error creating basic organization in Supabase:', createError);
            // Don't throw here - let the load continue with local-only mode
          }
        }
      }
    } catch (error) {
      console.error('Error ensuring organization exists:', error);
      // Don't throw here - let the load continue with local-only mode
    }
  };

  const load = async (organizationId = null) => {
    // If no organization ID provided, try to get from localStorage
    if (!organizationId) {
      organizationId = localStorage.getItem('current_organization_id');
    }

    if (!organizationId) {
      throw new Error('No organization selected');
    }

    // If already loaded for this organization, return cached data
    if (state.isLoaded && state.currentOrganizationId === organizationId) {
      return getSnapshot();
    }

    if (state.loadPromise) {
      return state.loadPromise;
    }

    state.loadPromise = (async () => {
      try {
        console.log('Loading data for organization:', organizationId);
        
        // First, ensure the organization exists in the database
        await ensureOrganizationExists(organizationId);
        
        // Load nodes with metrics from Supabase for specific organization
        const supabaseData = await window.orgDb.getNodesWithMetrics(organizationId);
        
        console.log('Loaded from Supabase:', supabaseData.length, 'nodes');
        console.log('Raw Supabase data:', supabaseData);
        
        state.nodesById.clear();
        supabaseData.forEach((rawNode) => {
          const node = normaliseNode(window.convertSupabaseToFrontend(rawNode));
          state.nodesById.set(node.id, node);
        });

        // Load relations from Supabase for specific organization
        const relations = await window.orgDb.getRelations(organizationId);
        
        // Add relations to nodes
        relations.forEach((relation) => {
          const fromNode = state.nodesById.get(relation.from_node_id);
          const toNode = state.nodesById.get(relation.to_node_id);
          
          if (fromNode && toNode) {
            fromNode.outputs.push({
              to: relation.to_node_id,
              desc: relation.description || ""
            });
            toNode.inputs.push({
              from: relation.from_node_id,
              desc: relation.description || ""
            });
          }
        });

        rebuildIndexes();
        state.isLoaded = true;
        state.currentOrganizationId = organizationId;
        state.lastError = null;
        
        console.log('Load completed. Final state:', {
          nodesCount: state.nodesById.size,
          rootIds: state.rootIds,
          nodes: Array.from(state.nodesById.values()).map(n => ({ id: n.id, name: n.name, parent: n.parent, children: n.children }))
        });
        
        notify();
        return getSnapshot();
      } catch (error) {
        state.lastError = error;
        console.error("OrgStore kunde inte ladda data från Supabase", error);
        
        // Fallback to mock data if Supabase fails
        console.log("Falling back to mock data...");
        try {
          const response = await fetch('mock/org.json');
          if (!response.ok) {
            throw new Error(`Kunde inte ladda mock data: ${response.status}`);
          }
          const payload = await response.json();
          
          if (!Array.isArray(payload.nodes)) {
            throw new Error("Ogiltigt mock data: nodes saknas");
          }
          
          state.nodesById.clear();
          payload.nodes.forEach((rawNode) => {
            const node = normaliseNode(rawNode);
            state.nodesById.set(node.id, node);
          });
          
          rebuildIndexes();
          state.isLoaded = true;
          state.currentOrganizationId = organizationId;
          state.lastError = null;
          notify();
          return getSnapshot();
        } catch (fallbackError) {
          console.error("Fallback to mock data failed", fallbackError);
          throw error; // Throw original Supabase error
        }
      } finally {
        state.loadPromise = null;
      }
    })();

    return state.loadPromise;
  };

  const getSnapshot = () => ({
    nodes: Array.from(state.nodesById.values()).map((node) => clone(node)),
    roots: state.rootIds.map((id) => clone(state.nodesById.get(id)))
  });

  const getNode = (id) => {
    const node = state.nodesById.get(id);
    return node ? clone(node) : null;
  };

  const getChildren = (id) => {
    const node = state.nodesById.get(id);
    if (!node) {
      return [];
    }
    return node.children
      .map((childId) => state.nodesById.get(childId))
      .filter(Boolean)
      .map((child) => clone(child));
  };

  const getRoots = () => state.rootIds.map((id) => clone(state.nodesById.get(id)));

  const getAll = () => Array.from(state.nodesById.values()).map((node) => clone(node));

  const setParent = (nodeId, parentId) => {
    const node = state.nodesById.get(nodeId);
    if (!node) {
      throw new Error(`Nod med id ${nodeId} saknas`);
    }
    if (node.parent === parentId) {
      return;
    }
    if (parentId === nodeId) {
      throw new Error("En nod kan inte vara sin egen parent");
    }
    if (parentId && !state.nodesById.has(parentId)) {
      throw new Error(`Parent-nod ${parentId} finns inte`);
    }
    if (parentId && isDescendant(parentId, nodeId)) {
      throw new Error("Kan inte flytta noden under en av dess barn");
    }

    if (node.parent) {
      const currentParent = state.nodesById.get(node.parent);
      if (currentParent) {
        currentParent.children = currentParent.children.filter((childId) => childId !== nodeId);
      }
    }

    node.parent = parentId || null;
    if (node.parent) {
      const newParent = state.nodesById.get(node.parent);
      newParent.children = Array.from(new Set([...newParent.children, nodeId]));
      state.rootIds = state.rootIds.filter((id) => id !== nodeId);
    } else if (!state.rootIds.includes(nodeId)) {
      state.rootIds.push(nodeId);
    }
  };

  const isDescendant = (potentialParentId, nodeId) => {
    const queue = [...(state.nodesById.get(nodeId)?.children || [])];
    while (queue.length) {
      const current = queue.shift();
      if (current === potentialParentId) {
        return true;
      }
      const child = state.nodesById.get(current);
      if (child) {
        queue.push(...child.children);
      }
    }
    return false;
  };

  const addNode = async (nodeInput) => {
    const node = normaliseNode(nodeInput);
    
    console.log('Supabase addNode called:', { 
      id: node.id, 
      name: node.name, 
      parent: node.parent, 
      organizationId: state.currentOrganizationId 
    });
    
    try {
      if (state.nodesById.has(node.id)) {
        throw new Error(`Nod med id ${node.id} finns redan`);
      }
      
      node.children = [];
      node.inputs = node.inputs || [];
      node.outputs = node.outputs || [];
      node.metrics = normaliseMetrics(node.metrics) || [];
      node.responsibilities = node.responsibilities || [];
      node.outcomes = node.outcomes || [];
      node.supportOffice = node.supportOffice ? String(node.supportOffice) : null;

      // Save to Supabase with organization ID
      const supabaseData = window.convertFrontendToSupabase(node);
      supabaseData.organization_id = state.currentOrganizationId;
      
      console.log('Saving to Supabase:', supabaseData);
      const result = await window.orgDb.createNode(supabaseData);
      console.log('Supabase createNode result:', result);

      state.nodesById.set(node.id, node);
      if (node.parent) {
        setParent(node.id, node.parent);
      } else {
        state.rootIds.push(node.id);
      }
      
      console.log('Node added successfully to local store. Total nodes:', state.nodesById.size);
      notify();
      return clone(node);
    } catch (error) {
      console.error("Kunde inte skapa nod i Supabase", error);
      console.log('Falling back to local-only mode');
      
      // In memory-only mode, still add the node locally
      state.nodesById.set(node.id, node);
      if (node.parent) {
        setParent(node.id, node.parent);
      } else {
        state.rootIds.push(node.id);
      }
      notify();
      return clone(node);
    }
  };

  const updateNode = async (id, updates) => {
    try {
      const node = state.nodesById.get(id);
      if (!node) {
        throw new Error(`Nod med id ${id} saknas`);
      }

      // Update local state
      if (updates.name !== undefined) {
        node.name = String(updates.name);
      }
      if (updates.type !== undefined) {
        node.type = String(updates.type);
      }
      if (updates.role !== undefined) {
        node.role = String(updates.role);
      }
      if (updates.metrics !== undefined) {
        node.metrics = normaliseMetrics(updates.metrics) || [];
        
        // Save metrics to Supabase
        await this.saveMetricsToSupabase(nodeId, node.metrics);
      }
      if (updates.responsibilities !== undefined) {
        node.responsibilities = normaliseStringList(updates.responsibilities);
      }
      if (updates.outcomes !== undefined) {
        node.outcomes = normaliseStringList(updates.outcomes);
      }
      if (updates.supportOffice !== undefined) {
        const value = updates.supportOffice;
        node.supportOffice = value === null || value === undefined || value === "" ? null : String(value);
      }
      if (updates.parent !== undefined) {
        setParent(id, updates.parent ? String(updates.parent) : null);
      }

      // Update in Supabase
      const supabaseData = window.convertFrontendToSupabase(node);
      supabaseData.organization_id = state.currentOrganizationId;
      await window.orgDb.updateNode(id, supabaseData);

      notify();
      return clone(node);
    } catch (error) {
      console.error("Kunde inte uppdatera nod i Supabase", error);
      // In memory-only mode, still update the node locally
      notify();
      return clone(node);
    }
  };

  const removeNode = async (id) => {
    try {
      const node = state.nodesById.get(id);
      if (!node) {
        throw new Error(`Nod med id ${id} saknas`);
      }
      if (node.children.length > 0) {
        throw new Error("Ta bort eller flytta barnnoder först");
      }

      // Remove from Supabase
      await window.orgDb.deleteNode(id);

      if (node.parent) {
        const parent = state.nodesById.get(node.parent);
        if (parent) {
          parent.children = parent.children.filter((childId) => childId !== id);
        }
      }

      state.nodesById.delete(id);
      state.rootIds = state.rootIds.filter((rootId) => rootId !== id);

      state.nodesById.forEach((otherNode) => {
        otherNode.inputs = otherNode.inputs.filter((relation) => relation.from !== id);
        otherNode.outputs = otherNode.outputs.filter((relation) => relation.to !== id);
      });

      notify();
    } catch (error) {
      console.error("Kunde inte ta bort nod från Supabase", error);
      // In memory-only mode, still remove the node locally
      if (node.parent) {
        const parent = state.nodesById.get(node.parent);
        if (parent) {
          parent.children = parent.children.filter((childId) => childId !== id);
        }
      }

      state.nodesById.delete(id);
      state.rootIds = state.rootIds.filter((rootId) => rootId !== id);

      state.nodesById.forEach((otherNode) => {
        otherNode.inputs = otherNode.inputs.filter((relation) => relation.from !== id);
        otherNode.outputs = otherNode.outputs.filter((relation) => relation.to !== id);
      });

      notify();
    }
  };

  const addLink = async ({ from, to, desc }) => {
    try {
      if (!from || !to) {
        throw new Error("Både from och to måste anges");
      }
      if (!state.nodesById.has(from) || !state.nodesById.has(to)) {
        throw new Error("Relationen refererar till okänd nod");
      }

      // Add to Supabase with organization ID
      await window.orgDb.createRelation({
        organization_id: state.currentOrganizationId,
        from_node_id: from,
        to_node_id: to,
        description: desc || ""
      });

      const fromNode = state.nodesById.get(from);
      const toNode = state.nodesById.get(to);

      if (!fromNode.outputs.some((relation) => relation.to === to && relation.desc === desc)) {
        fromNode.outputs.push({ to, desc: desc || "" });
      }

      if (!toNode.inputs.some((relation) => relation.from === from && relation.desc === desc)) {
        toNode.inputs.push({ from, desc: desc || "" });
      }
      
      notify();
    } catch (error) {
      console.error("Kunde inte skapa relation i Supabase", error);
      // In memory-only mode, still add the relation locally
      const fromNode = state.nodesById.get(from);
      const toNode = state.nodesById.get(to);

      if (!fromNode.outputs.some((relation) => relation.to === to && relation.desc === desc)) {
        fromNode.outputs.push({ to, desc: desc || "" });
      }

      if (!toNode.inputs.some((relation) => relation.from === from && relation.desc === desc)) {
        toNode.inputs.push({ from, desc: desc || "" });
      }
      
      notify();
    }
  };

  const removeLink = async ({ from, to }) => {
    try {
      if (!from || !to) {
        throw new Error("Både from och to måste anges för att ta bort relationen");
      }

      // Remove from Supabase
      await window.orgDb.deleteRelation(from, to);

      const fromNode = state.nodesById.get(from);
      const toNode = state.nodesById.get(to);
      if (!fromNode || !toNode) {
        throw new Error("Relationen refererar till okänd nod");
      }
      fromNode.outputs = fromNode.outputs.filter((relation) => relation.to !== to);
      toNode.inputs = toNode.inputs.filter((relation) => relation.from !== from);
      
      notify();
    } catch (error) {
      console.error("Kunde inte ta bort relation från Supabase", error);
      // In memory-only mode, still remove the relation locally
      const fromNode = state.nodesById.get(from);
      const toNode = state.nodesById.get(to);
      if (!fromNode || !toNode) {
        throw new Error("Relationen refererar till okänd nod");
      }
      fromNode.outputs = fromNode.outputs.filter((relation) => relation.to !== to);
      toNode.inputs = toNode.inputs.filter((relation) => relation.from !== from);
      
      notify();
    }
  };

  const getRelations = () => {
    const seen = new Set();
    const relations = [];
    state.nodesById.forEach((node) => {
      node.outputs.forEach((relation) => {
        const key = `${node.id}->${relation.to}::${relation.desc}`;
        if (!seen.has(key)) {
          seen.add(key);
          relations.push({ from: node.id, to: relation.to, desc: relation.desc || "" });
        }
      });
    });
    return relations.map((relation) => clone(relation));
  };

  const subscribe = (listener) => {
    if (typeof listener !== "function") {
      throw new Error("Listener måste vara en funktion");
    }
    subscribers.add(listener);
    return () => subscribers.delete(listener);
  };

  const getState = () => ({
    isLoaded: state.isLoaded,
    lastError: state.lastError ? String(state.lastError) : null,
    currentOrganizationId: state.currentOrganizationId
  });

  // Save metrics to Supabase
  const saveMetricsToSupabase = async (nodeId, metrics) => {
    try {
      // First, delete existing metrics for this node
      await window.orgDb.deleteMetricsForNode(nodeId);
      
      // Then insert new metrics
      for (const metric of metrics) {
        if (metric && (Object.keys(metric.data || {}).length > 0 || (metric.values && metric.values.length > 0))) {
          const supabaseMetric = window.convertFrontendMetricToSupabase(metric, state.currentOrganizationId, nodeId);
          if (supabaseMetric && Object.keys(supabaseMetric.data || {}).length > 0) {
            await window.orgDb.createMetric(supabaseMetric);
          }
        }
      }
    } catch (error) {
      console.error('Error saving metrics to Supabase:', error);
    }
  };

  // Setup real-time subscriptions
  const setupRealtimeSubscriptions = () => {
    if (!state.currentOrganizationId) return;

    // Subscribe to node changes for current organization
    window.orgDb.subscribeToNodes((payload) => {
      console.log('Node changed:', payload);
      // Reload data when nodes change
      load(state.currentOrganizationId);
    }, state.currentOrganizationId);

    // Subscribe to metrics changes for current organization
    window.orgDb.subscribeToMetrics((payload) => {
      console.log('Metric changed:', payload);
      // Reload data when metrics change
      load(state.currentOrganizationId);
    }, state.currentOrganizationId);

    // Subscribe to relations changes for current organization
    window.orgDb.subscribeToRelations((payload) => {
      console.log('Relation changed:', payload);
      // Reload data when relations change
      load(state.currentOrganizationId);
    }, state.currentOrganizationId);
  };

  // Initialize real-time subscriptions when store is first loaded
  let subscriptionsInitialized = false;
  const originalLoad = load;
  const loadWithSubscriptions = async (...args) => {
    const result = await originalLoad(...args);
    if (!subscriptionsInitialized && state.isLoaded && state.currentOrganizationId) {
      setupRealtimeSubscriptions();
      subscriptionsInitialized = true;
    }
    return result;
  };

  return {
    load: loadWithSubscriptions,
    ensureLoaded,
    getSnapshot,
    getNode,
    getChildren,
    getRoots,
    getAll,
    addNode,
    updateNode,
    removeNode,
    addLink,
    removeLink,
    getRelations,
    subscribe,
    getState
  };
})();

// Make OrgStore globally available for compatibility
window.OrgStore = OrgStore;

// Make conversion functions globally available (they're already available from supabase-multi-org.js)
// No need to redefine them here

export default OrgStore;
