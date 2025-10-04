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
    if (!metrics || typeof metrics !== "object") {
      return null;
    }
    const result = {};
    Object.entries(metrics).forEach(([key, value]) => {
      if (key === undefined || key === null) {
        return;
      }
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        return;
      }
      result[String(key)] = numeric;
    });
    return Object.keys(result).length ? result : null;
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
    node.metrics = normaliseMetrics(rawNode.metrics);
    node.responsibilities = normaliseStringList(rawNode.responsibilities);
    node.activities = normaliseStringList(rawNode.activities);
    node.outcomes = normaliseStringList(rawNode.outcomes);
    node.supportOffice = rawNode.supportOffice ? String(rawNode.supportOffice) : null;
    node.metricsType = rawNode.metricsType ? String(rawNode.metricsType) : null;
    node.metricsName = rawNode.metricsName ? String(rawNode.metricsName) : null;

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
  const addNode = (nodeInput) => {
    const node = normaliseNode(nodeInput);
    if (state.nodesById.has(node.id)) {
      throw new Error(`Nod med id ${node.id} finns redan`);
    }
    node.children = [];
    node.inputs = node.inputs || [];
    node.outputs = node.outputs || [];
    node.metrics = normaliseMetrics(node.metrics) || null;
    node.responsibilities = node.responsibilities || [];
    node.activities = node.activities || [];
    node.outcomes = node.outcomes || [];
    node.supportOffice = node.supportOffice ? String(node.supportOffice) : null;
    node.metricsType = node.metricsType ? String(node.metricsType) : null;
    node.metricsName = node.metricsName ? String(node.metricsName) : null;

    state.nodesById.set(node.id, node);
    if (node.parent) {
      setParent(node.id, node.parent);
    } else {
      state.rootIds.push(node.id);
    }
    notify();
    return clone(node);
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
      node.metrics = normaliseMetrics(updates.metrics) || null;
    }
    if (updates.responsibilities !== undefined) {
      node.responsibilities = normaliseStringList(updates.responsibilities);
    }
    if (updates.activities !== undefined) {
      node.activities = normaliseStringList(updates.activities);
    }
    if (updates.outcomes !== undefined) {
      node.outcomes = normaliseStringList(updates.outcomes);
    }
    if (updates.supportOffice !== undefined) {
      const value = updates.supportOffice;
      node.supportOffice = value === null || value === undefined || value === "" ? null : String(value);
    }
    if (updates.metricsType !== undefined) {
      node.metricsType = updates.metricsType ? String(updates.metricsType) : null;
    }
    if (updates.metricsName !== undefined) {
      node.metricsName = updates.metricsName ? String(updates.metricsName) : null;
    }
    if (updates.parent !== undefined) {
      setParent(id, updates.parent ? String(updates.parent) : null);
    }
    notify();
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
    getState
  };
})();





