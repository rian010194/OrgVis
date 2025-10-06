const OrgStore = (() => {
  const state = {
    nodesById: new Map(),
    rootIds: [],
    isLoaded: false,
    loadPromise: null,
    lastError: null
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
        const result = {
          id: metric.id || Date.now() + Math.random(),
          name: metric.name || "Time spent on:",
          type: metric.chartType || metric.type || "pie",
          chartType: metric.chartType || metric.type || "pie",
          unit: metric.unit || "%",
          description: metric.description || "",
          data: {}
        };
        
        // Handle new values format (multi-value metrics)
        if (metric.values && Array.isArray(metric.values)) {
          result.values = metric.values.filter(v => v && v.label && !isNaN(v.value));
          // Also create data for backward compatibility
          metric.values.forEach(v => {
            if (v && v.label && !isNaN(v.value)) {
              result.data[String(v.label)] = Number(v.value);
            }
          });
        }
        // Handle old data format
        else if (metric.data && typeof metric.data === "object") {
          Object.entries(metric.data).forEach(([key, value]) => {
            if (key === undefined || key === null) {
              return;
            }
            const numeric = Number(value);
            if (Number.isFinite(numeric)) {
              result.data[String(key)] = numeric;
            }
          });
        } 
        // Handle single value format
        else if (metric.value !== undefined) {
          result.value = Number(metric.value);
          result.data[result.name || "Value"] = Number(metric.value);
        }
        // Handle case where metric is the data object itself (old format)
        else if (typeof metric === "object" && !metric.data) {
          Object.entries(metric).forEach(([key, value]) => {
            if (key === "id" || key === "name" || key === "type" || key === "chartType" || key === "unit" || key === "values" || key === "value" || key === "description") {
              return;
            }
            const numeric = Number(value);
            if (Number.isFinite(numeric)) {
              result.data[String(key)] = numeric;
            }
          });
        }
        
        // Return result if it has either data or values
        return (Object.keys(result.data).length > 0 || (result.values && result.values.length > 0)) ? result : null;
      }).filter(Boolean);
    }
    
    // Convert old format to new format
    if (typeof metrics === "object") {
      const result = {
        id: Date.now() + Math.random(),
        name: "Time spent on:",
        type: "pie",
        unit: "%",
        data: {}
      };
      
      Object.entries(metrics).forEach(([key, value]) => {
        if (key === undefined || key === null) {
          return;
        }
        const numeric = Number(value);
        if (Number.isFinite(numeric)) {
          result.data[String(key)] = numeric;
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
    // Handle old format with metricsName and metricsType
    if (rawNode.metricsName || rawNode.metricsType) {
      const oldMetrics = rawNode.metrics || {};
      const newMetrics = [{
        id: Date.now() + Math.random(),
        name: rawNode.metricsName || "Time spent on:",
        type: rawNode.metricsType || "pie",
        unit: "%",
        data: oldMetrics
      }];
      node.metrics = normaliseMetrics(newMetrics);
    } else if (rawNode.metrics && typeof rawNode.metrics === "object" && !Array.isArray(rawNode.metrics)) {
      // Handle old format without metricsName/metricsType
      const newMetrics = [{
        id: Date.now() + Math.random(),
        name: "Time spent on:",
        type: "pie",
        unit: "%",
        data: rawNode.metrics
      }];
      node.metrics = normaliseMetrics(newMetrics);
    } else {
      node.metrics = normaliseMetrics(rawNode.metrics);
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
    if (state.isLoaded) {
      return;
    }
    if (state.loadPromise) {
      await state.loadPromise;
      return;
    }
    await load();
  };
  const load = async (url = "mock/org.json") => {
    if (state.isLoaded) {
      return getSnapshot();
    }
    if (state.loadPromise) {
      return state.loadPromise;
    }

    // First try to load from localStorage (saved changes)
    if (typeof(Storage) !== "undefined") {
      const savedData = localStorage.getItem('orgvis-data');
      if (savedData) {
        try {
          const payload = JSON.parse(savedData);
          console.log('Found saved data in localStorage:', {
            nodesCount: payload.nodes ? payload.nodes.length : 0,
            rootsCount: payload.roots ? payload.roots.length : 0
          });
          if (Array.isArray(payload.nodes)) {
            state.nodesById.clear();
            payload.nodes.forEach((rawNode) => {
              const node = normaliseNode(rawNode);
              state.nodesById.set(node.id, node);
            });
            rebuildIndexes();
            state.isLoaded = true;
            state.lastError = null;
            notify();
            return getSnapshot();
          }
        } catch (error) {
          console.warn('Failed to load saved data, falling back to mock data:', error);
          localStorage.removeItem('orgvis-data');
        }
      } else {
        console.log('No saved data found in localStorage, loading mock data');
      }
    } else {
      console.warn('localStorage not available, loading mock data');
    }

    // Fallback to original mock data
    state.loadPromise = fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Kunde inte ladda organisationsdata: ${response.status}`);
        }
        return response.json();
      })
      .then((payload) => {
        if (!Array.isArray(payload.nodes)) {
          throw new Error("Ogiltigt svar: nodes saknas");
        }
        state.nodesById.clear();
        payload.nodes.forEach((rawNode) => {
          const node = normaliseNode(rawNode);
          state.nodesById.set(node.id, node);
        });
        rebuildIndexes();
        state.isLoaded = true;
        state.lastError = null;
        notify();
        return getSnapshot();
      })
      .catch((error) => {
        state.lastError = error;
        console.error("OrgStore kunde inte ladda data", error);
        throw error;
      })
      .finally(() => {
        state.loadPromise = null;
      });

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
    console.log(`setParent called: nodeId=${nodeId}, parentId=${parentId}`);
    
    const node = state.nodesById.get(nodeId);
    if (!node) {
      throw new Error(`Nod med id ${nodeId} saknas`);
    }
    if (node.parent === parentId) {
      console.log(`Node ${nodeId} already has parent ${parentId}, returning`);
      return;
    }
    if (parentId === nodeId) {
      throw new Error("En nod kan inte vara sin egen parent");
    }
    if (parentId && !state.nodesById.has(parentId)) {
      console.error(`Parent node ${parentId} not found in nodesById. Available nodes:`, Array.from(state.nodesById.keys()));
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
      console.log(`Node ${nodeId} set as child of ${node.parent}. Parent now has children:`, newParent.children);
    } else if (!state.rootIds.includes(nodeId)) {
      state.rootIds.push(nodeId);
      console.log(`Node ${nodeId} added to rootIds. Root nodes now:`, state.rootIds);
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
  const addNode = (nodeInput) => {
    const node = normaliseNode(nodeInput);
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

    state.nodesById.set(node.id, node);
    if (node.parent) {
      setParent(node.id, node.parent);
    } else {
      state.rootIds.push(node.id);
    }
    notify();
    saveToLocalStorage(); // Auto-save changes
    return clone(node);
  };
  const saveToLocalStorage = () => {
    try {
      // Check if localStorage is available
      if (typeof(Storage) === "undefined") {
        console.warn('localStorage not available');
        return;
      }
      
      const snapshot = getSnapshot();
      const dataString = JSON.stringify(snapshot);
      localStorage.setItem('orgvis-data', dataString);
      console.log('Data saved to localStorage:', {
        nodesCount: snapshot.nodes.length,
        rootsCount: snapshot.roots.length,
        dataSize: dataString.length + ' characters'
      });
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
    }
  };

  const updateNode = (id, updates) => {
    const node = state.nodesById.get(id);
    if (!node) {
      throw new Error(`Nod med id ${id} saknas`);
    }
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
    notify();
    saveToLocalStorage(); // Auto-save changes
    return clone(node);
  };
  const removeNode = (id) => {
    const node = state.nodesById.get(id);
    if (!node) {
      throw new Error(`Nod med id ${id} saknas`);
    }
    if (node.children.length > 0) {
      throw new Error("Ta bort eller flytta barnnoder först");
    }

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
    saveToLocalStorage(); // Auto-save changes
  };
  const addLink = ({ from, to, desc }) => {
    if (!from || !to) {
      throw new Error("Både from och to måste anges");
    }
    if (!state.nodesById.has(from) || !state.nodesById.has(to)) {
      throw new Error("Relationen refererar till okänd nod");
    }
    const fromNode = state.nodesById.get(from);
    const toNode = state.nodesById.get(to);

    if (!fromNode.outputs.some((relation) => relation.to === to && relation.desc === desc)) {
      fromNode.outputs.push({ to, desc: desc || "" });
    }

    if (!toNode.inputs.some((relation) => relation.from === from && relation.desc === desc)) {
      toNode.inputs.push({ from, desc: desc || "" });
    }
    notify();
    saveToLocalStorage(); // Auto-save changes
  };
  const removeLink = ({ from, to }) => {
    if (!from || !to) {
      throw new Error("Både from och to måste anges för att ta bort relationen");
    }
    const fromNode = state.nodesById.get(from);
    const toNode = state.nodesById.get(to);
    if (!fromNode || !toNode) {
      throw new Error("Relationen refererar till okänd nod");
    }
    fromNode.outputs = fromNode.outputs.filter((relation) => relation.to !== to);
    toNode.inputs = toNode.inputs.filter((relation) => relation.from !== from);
    notify();
    saveToLocalStorage(); // Auto-save changes
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
    lastError: state.lastError ? String(state.lastError) : null
  });

  const clearSavedData = () => {
    if (typeof(Storage) !== "undefined") {
      localStorage.removeItem('orgvis-data');
      console.log('Saved data cleared');
    } else {
      console.warn('localStorage not available');
    }
  };

  const testLocalStorage = () => {
    if (typeof(Storage) !== "undefined") {
      try {
        const testKey = 'orgvis-test';
        const testValue = 'test-data';
        localStorage.setItem(testKey, testValue);
        const retrieved = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        
        if (retrieved === testValue) {
          console.log('localStorage test: PASSED');
          return true;
        } else {
          console.error('localStorage test: FAILED - data mismatch');
          return false;
        }
      } catch (error) {
        console.error('localStorage test: FAILED - error:', error);
        return false;
      }
    } else {
      console.warn('localStorage test: FAILED - not available');
      return false;
    }
  };

  return {
    load,
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
    getState,
    saveToLocalStorage,
    clearSavedData,
    testLocalStorage
  };
})();





