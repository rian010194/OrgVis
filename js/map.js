const OrgMap = (() => {
  const margins = { top: 80, right: 220, bottom: 80, left: 220 };
  const minInnerWidth = 720;
  const minInnerHeight = 520;
  const NODE_WIDTH = 160;
  const NODE_HEIGHT = 56;
  const HORIZONTAL_GAP = 80;
  const VERTICAL_GAP = 120;
  const SUPPORT_TOGGLE_WIDTH = 172;
  const SUPPORT_TOGGLE_HEIGHT = 32;
  const SUPPORT_TOGGLE_OFFSET = 10;
  const SUPPORT_BOX_COLUMNS = 4;
  const SUPPORT_BOX_ITEM_WIDTH = 140;
  const SUPPORT_BOX_ITEM_HEIGHT = 52;
  const SUPPORT_BOX_GAP = 12;
  const SUPPORT_BOX_PADDING = 16;
  const SUPPORT_BOX_TITLE_HEIGHT = 28;
  const SUPPORT_BOX_WIDTH = SUPPORT_BOX_COLUMNS * SUPPORT_BOX_ITEM_WIDTH + (SUPPORT_BOX_COLUMNS - 1) * SUPPORT_BOX_GAP + SUPPORT_BOX_PADDING * 2;
  const SUPPORT_BOX_ROWS = 2;
  const SUPPORT_BOX_HEIGHT = SUPPORT_BOX_TITLE_HEIGHT + SUPPORT_BOX_ROWS * SUPPORT_BOX_ITEM_HEIGHT + (SUPPORT_BOX_ROWS - 1) * SUPPORT_BOX_GAP + SUPPORT_BOX_PADDING * 2;
  const SUPPORT_BOX_OFFSET = 20;

  const state = {
    expanded: new Set(),
    selectedId: null
  };
  const zoomSettings = { min: 0.3, max: 2.5, focusScale: 0.6 }; // More zoomed out for better context
  const supportVisibility = new Set();

  let container = null;
  let svg = null;
  let canvasGroup = null;
  let linkGroup = null;
  let nodeGroup = null;
  let supportToggleGroup = null;
  let supportBoxGroup = null;
  let unsubscribe = null;
  let zoomBehavior = null;
  let currentTransform = d3.zoomIdentity;
  let lastUserZoomTime = 0;
  let lastLayout = null;
  let isInitialised = false;

  // Original D3 linkVertical generator for curved lines
  const linkGenerator = d3
    .linkVertical()
    .x((point) => point.x)
    .y((point) => point.y);

  const handleZoom = (event) => {
    currentTransform = event.transform;
    if (canvasGroup) {
      canvasGroup.attr("transform", currentTransform);
    }
    lastUserZoomTime = Date.now();
  };

  const applyCurrentTransform = () => {
    if (canvasGroup) {
      canvasGroup.attr("transform", currentTransform);
    }
  };

  // Wait for stable, non-zero container dimensions before proceeding
  const waitForStableDimensions = (timeoutMs = 800, intervalMs = 50) => {
    return new Promise((resolve) => {
      const start = performance.now();
      let prev = null;
      const check = () => {
        if (!container) container = document.getElementById("mapView");
        const rect = container ? container.getBoundingClientRect() : null;
        const w = rect ? rect.width : 0;
        const h = rect ? rect.height : 0;
        const now = performance.now();
        if (w > 0 && h > 0) {
          if (prev && Math.abs(prev.w - w) < 1 && Math.abs(prev.h - h) < 1) {
            return resolve({ width: w, height: h });
          }
          prev = { w, h };
        }
        if (now - start >= timeoutMs) return resolve({ width: w, height: h });
        setTimeout(check, intervalMs);
      };
      check();
    });
  };

  const ensureTransformConsistency = () => {
    // Ensure the current transform is properly applied to all canvas elements
    if (canvasGroup && currentTransform) {
      canvasGroup.attr("transform", currentTransform);
    }
  };

  const focusNode = (nodeId, options = {}) => {
    if (!lastLayout || !Array.isArray(lastLayout.nodeData) || !nodeId) {
      return;
    }
    
    // Skip focus if admin panel transition is in progress
    if (window._adminPanelTransition) {
      console.log('focusNode - skipping focus due to admin panel transition');
      return;
    }
    
    // Ensure dimensions are stable after UI changes (e.g., detail panel opens)
    if (options && options.ensureStable !== false) {
      waitForStableDimensions().then(() => {
        focusNode(nodeId, Object.assign({}, options, { ensureStable: false }));
      });
      return;
    }
    
    // First try to find the node in regular nodes
    let target = lastLayout.nodeData.find((node) => node.id === nodeId);
    let focusY = target ? target.y : null;
    
    // If not found in regular nodes, check if it's a support office child
    if (!target && lastLayout.supportMap) {
      for (const [parentId, supportEntry] of lastLayout.supportMap) {
        const supportChild = supportEntry.children.find(child => child.id === nodeId);
        if (supportChild) {
          // Find the parent node to focus on
          const parentNode = lastLayout.nodeData.find(node => node.id === parentId);
          if (parentNode) {
            target = parentNode;
            // Adjust focus to account for support box position
            focusY = parentNode.y + NODE_HEIGHT / 2 + SUPPORT_TOGGLE_OFFSET + SUPPORT_TOGGLE_HEIGHT + SUPPORT_BOX_OFFSET + SUPPORT_BOX_HEIGHT / 2;
            break;
          }
        }
      }
    }
    
    if (!target) {
      console.warn('OrgMap: Node not found for focus:', nodeId);
      return;
    }

    // Prefer actual SVG dimensions for accurate centering, fallback to container
    let width = 0;
    let height = 0;
    if (svg && typeof svg.node === 'function') {
      const svgEl = svg.node();
      width = svgEl && (svgEl.clientWidth || svgEl.getBoundingClientRect().width || 0);
      height = svgEl && (svgEl.clientHeight || svgEl.getBoundingClientRect().height || 0);
      if ((!width || !height) && svgEl) {
        // Fallback to attributes if present
        const attrW = parseFloat(svgEl.getAttribute('width'));
        const attrH = parseFloat(svgEl.getAttribute('height'));
        if (!isNaN(attrW)) width = width || attrW;
        if (!isNaN(attrH)) height = height || attrH;
      }
    }
    if (!width || !height) {
      const bounds = container ? container.getBoundingClientRect() : null;
      width = bounds && bounds.width ? bounds.width : (container ? container.clientWidth : 0);
      height = bounds && bounds.height ? bounds.height : (container ? container.clientHeight : 0);
    }
    // last resort fallbacks to avoid zeros
    if (!width || width < 10) width = window.innerWidth || 1024;
    if (!height || height < 10) height = Math.min(window.innerHeight || 768, 700);
    if (!width) width = (lastLayout ? lastLayout.outerWidth : 0) || minInnerWidth + margins.left + margins.right;
    if (!height) height = (lastLayout ? lastLayout.outerHeight : 0) || minInnerHeight + margins.top + margins.bottom;
    
    // In fullscreen mode, use viewport dimensions for better centering
    if (document.body.classList.contains('detail-expanded')) {
      width = Math.max(width, window.innerWidth * 0.8); // Use 80% of viewport width
      height = Math.max(height, window.innerHeight * 0.8); // Use 80% of viewport height
      console.log('focusNode - fullscreen mode detected, using viewport dimensions:', { width, height, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight });
    }

    // Respect current zoom if no scale is specified; otherwise use provided scale.
    // If the user interacted very recently, keep their scale unless caller overrides.
    const currentScale = currentTransform && typeof currentTransform.k === 'number' ? currentTransform.k : 1;
    const userInteractedRecently = Date.now() - lastUserZoomTime < 1500; // 1.5s window
    const desiredScale = options.scale !== undefined
      ? options.scale
      : (userInteractedRecently ? currentScale : currentScale);
    const scale = Math.max(zoomSettings.min, Math.min(zoomSettings.max, desiredScale));
    // Center horizontally in the actual rendered area
    const centerX = width / 2;
    // Center at 50% of height for better centering
    const centerY = height / 2;
    
    // Node coordinates are already in screen space (include margins), so we need to account for that
    // Simple and correct transform: translate so node appears at center
    const tx = centerX - target.x * scale;
    const ty = centerY - (focusY || target.y) * scale;
    const transform = d3.zoomIdentity.translate(tx, ty).scale(scale);
    
    console.log('=== FOCUS DEBUG ===');
    console.log('Node:', nodeId, 'at position:', target.x, target.y);
    console.log('Container/SVG size used for centering:', width, 'x', height);
    console.log('Center point:', centerX, centerY);
    console.log('Scale:', scale);
    console.log('Transform calculation:');
    console.log('  tx = centerX - target.x * scale =', centerX, '-', target.x, '*', scale, '=', tx);
    console.log('  ty = centerY - target.y * scale =', centerY, '-', (focusY || target.y), '*', scale, '=', ty);
    console.log('Final transform:', transform.toString());
    console.log('==================');
    
    // Add visual debug indicator (only when DEBUG_MAP enabled)
    const DEBUG_MAP = (typeof window !== 'undefined' && (window.DEBUG_MAP || localStorage.getItem('debugMap') === '1'));
    if (svg && DEBUG_MAP) {
      // Remove any existing debug indicators
      svg.selectAll('.debug-center').remove();
      
      // Add center point indicator
      svg.append('circle')
        .attr('class', 'debug-center')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', 10)
        .attr('fill', 'red')
        .attr('opacity', 0.7)
        .attr('stroke', 'white')
        .attr('stroke-width', 2);
      
      // Add node position indicator
      svg.append('circle')
        .attr('class', 'debug-center')
        .attr('cx', target.x)
        .attr('cy', focusY || target.y)
        .attr('r', 8)
        .attr('fill', 'blue')
        .attr('opacity', 0.7)
        .attr('stroke', 'white')
        .attr('stroke-width', 2);
    }

    currentTransform = transform;
    if (svg && zoomBehavior) {
      const duration = options.duration !== undefined ? options.duration : 450;
      svg.transition().duration(duration).call(zoomBehavior.transform, transform);
    } else if (canvasGroup) {
      canvasGroup.attr("transform", transform);
    }
  };

  const resetView = (options = {}) => {
    if (!lastLayout || !svg || !zoomBehavior) {
      currentTransform = d3.zoomIdentity;
      if (canvasGroup) {
        canvasGroup.attr("transform", currentTransform);
      }
      return;
    }
    
    // Skip reset if admin panel transition is in progress
    if (window._adminPanelTransition) {
      console.log('resetView - skipping reset due to admin panel transition');
      return;
    }

    // Calculate bounds of all nodes to center the view
    const nodes = lastLayout.nodeData;
    if (!nodes || nodes.length === 0) {
      currentTransform = d3.zoomIdentity;
      if (canvasGroup) {
        canvasGroup.attr("transform", currentTransform);
      }
      return;
    }

    // Find bounds of all nodes
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(node => {
      minX = Math.min(minX, node.x - NODE_WIDTH / 2);
      maxX = Math.max(maxX, node.x + NODE_WIDTH / 2);
      minY = Math.min(minY, node.y - NODE_HEIGHT / 2);
      maxY = Math.max(maxY, node.y + NODE_HEIGHT / 2);
    });

    // Add some padding
    const padding = 100;
    minX -= padding;
    maxX += padding;
    minY -= padding;
    maxY += padding;

    // Calculate center and scale
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Get SVG dimensions - use container dimensions for better mobile support
    const containerRect = container.getBoundingClientRect();
    let svgWidth = containerRect.width;
    let svgHeight = containerRect.height;
    
    // Fallback to client dimensions if getBoundingClientRect returns 0 or invalid values
    if (!svgWidth || svgWidth <= 0) {
      svgWidth = container.clientWidth || 800;
    }
    if (!svgHeight || svgHeight <= 0) {
      svgHeight = container.clientHeight || 600;
    }
    
    // Additional fallback for mobile
    if (svgWidth < 300) svgWidth = 800;
    if (svgHeight < 300) svgHeight = 600;
    
    // In fullscreen mode, use viewport dimensions for better centering
    if (document.body.classList.contains('detail-expanded')) {
      svgWidth = Math.max(svgWidth, window.innerWidth * 0.8); // Use 80% of viewport width
      svgHeight = Math.max(svgHeight, window.innerHeight * 0.8); // Use 80% of viewport height
    }

    // Calculate scale to fit content with some margin
    const scaleX = svgWidth / contentWidth;
    const scaleY = svgHeight / contentHeight;
    const scale = Math.min(scaleX, scaleY, zoomSettings.max) * 0.8; // 80% to add margin

    // Calculate translation to center the content
    // Compose transform: center content point, then scale
    const transform = d3.zoomIdentity
      .translate(svgWidth / 2, svgHeight / 2)
      .scale(scale)
      .translate(-centerX, -centerY);
    currentTransform = transform;

    const duration = options.duration !== undefined ? options.duration : 300;
    svg.transition().duration(duration).call(zoomBehavior.transform, transform);
  };

  // Keep tree centered while preserving current zoom level
  const recenterPreservingScale = (options = {}) => {
    if (!lastLayout || !svg || !zoomBehavior || !container) {
      return;
    }
    const nodes = lastLayout.nodeData;
    if (!nodes || nodes.length === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(n => {
      minX = Math.min(minX, n.x - NODE_WIDTH / 2);
      maxX = Math.max(maxX, n.x + NODE_WIDTH / 2);
      minY = Math.min(minY, n.y - NODE_HEIGHT / 2);
      maxY = Math.max(maxY, n.y + NODE_HEIGHT / 2);
    });
    if (!isFinite(minX) || !isFinite(minY)) return;

    const contentCenterX = (minX + maxX) / 2;
    const contentCenterY = (minY + maxY) / 2;

    let viewW = 0, viewH = 0;
    if (svg && typeof svg.node === 'function') {
      const el = svg.node();
      viewW = el && (el.clientWidth || el.getBoundingClientRect().width || parseFloat(el.getAttribute('width')) || 0);
      viewH = el && (el.clientHeight || el.getBoundingClientRect().height || parseFloat(el.getAttribute('height')) || 0);
    }
    if (!viewW || !viewH) {
      const rect = container.getBoundingClientRect();
      viewW = rect.width || container.clientWidth || 800;
      viewH = rect.height || container.clientHeight || 600;
    }

    const scale = currentTransform && typeof currentTransform.k === 'number' ? currentTransform.k : 1;
    const transform = d3.zoomIdentity
      .translate(viewW / 2, viewH / 2)
      .scale(scale)
      .translate(-contentCenterX, -contentCenterY);
    currentTransform = transform;
    const duration = options.duration !== undefined ? options.duration : 200;
    svg.transition().duration(duration).call(zoomBehavior.transform, transform);
  };

  const init = () => {
    if (isInitialised) {
      return;
    }

    if (typeof d3 === "undefined") {
      console.warn("OrgMap: D3.js är inte laddad. Kartvy kommer inte att fungera.");
      return;
    }

    container = document.getElementById("mapView");
    if (!container) {
      console.warn("OrgMap: mapView-elementet saknas.");
      return;
    }

    svg = d3.select(container).append("svg").attr("class", "map-svg");
    canvasGroup = svg.append("g").attr("class", "map-canvas");
    linkGroup = canvasGroup.append("g").attr("class", "map-links");
    nodeGroup = canvasGroup.append("g").attr("class", "map-nodes");
    supportToggleGroup = canvasGroup.append("g").attr("class", "map-support-toggles");
    supportBoxGroup = canvasGroup.append("g").attr("class", "map-support-boxes");

    zoomBehavior = d3.zoom().scaleExtent([zoomSettings.min, zoomSettings.max]).on("zoom", handleZoom);
    svg.call(zoomBehavior);
    svg.call(zoomBehavior.transform, currentTransform);
    // Ensure initial transform is applied
    applyCurrentTransform();

    // Prevent multiple subscriptions
    if (unsubscribe) {
      unsubscribe();
    }
    
    unsubscribe = OrgStore.subscribe(() => {
      refresh();
    });

    window.addEventListener("resize", handleResize);
    refresh();
    isInitialised = true;
  };

  const buildHierarchy = (nodes) => {
    console.log('buildHierarchy called with nodes:', nodes.map(n => ({ id: n.id, name: n.name, parent: n.parent, children: n.children })));
    
    const wrappers = new Map();
    nodes.forEach((node) => {
      wrappers.set(node.id, { node, children: [] });
    });

    // Build parent-child relationships based on parent property
    const roots = [];
    wrappers.forEach((wrapper) => {
      const currentNode = wrapper.node;
      if (currentNode.type === "SupportOffice") {
        return;
      }
      const parentId = currentNode.parent;
      if (parentId && wrappers.has(parentId)) {
        const parentWrapper = wrappers.get(parentId);
        if (parentWrapper.node.type !== "SupportOffice") {
          parentWrapper.children.push(wrapper);
          console.log(`Added ${currentNode.id} as child of ${parentId}`);
        }
      } else if (!parentId) {
        roots.push(wrapper);
        console.log(`Added ${currentNode.id} as root`);
      }
    });

    const virtualRoot = { node: { id: "__root__", name: "Organisation" }, children: roots };

    return d3.hierarchy(virtualRoot, (wrapper) => {
      if (!wrapper.children || wrapper.children.length === 0) {
        return [];
      }
      if (!wrapper.node || wrapper.node.id === "__root__") {
        return wrapper.children;
      }
      // Only show children if the node is expanded
      const isExpanded = state.expanded.has(wrapper.node.id);
      const childrenToShow = isExpanded ? wrapper.children : [];
      console.log(`Node ${wrapper.node.id}: expanded=${isExpanded}, children=${wrapper.children.length}, showing=${childrenToShow.length}`);
      return childrenToShow;
    });
  };

  const computeLayout = (nodes) => {
    if (!container) {
      return null;
    }

    const bounds = container.getBoundingClientRect();
    const baseOuterWidth = Math.max(Math.max(bounds.width, container.clientWidth) || 0, 0);

    const nodesById = new Map(nodes.map((node) => [node.id, node]));
    const hierarchyRoot = buildHierarchy(nodes);
    const horizontalSpacing = NODE_WIDTH + HORIZONTAL_GAP;

    d3
      .tree()
      .nodeSize([horizontalSpacing, 1])
      .separation((a, b) => (a.parent === b.parent ? 1.2 : 1.6))(hierarchyRoot);

    let minX = Infinity;
    let maxX = -Infinity;
    hierarchyRoot.each((node) => {
      if (!node.data || !node.data.node) {
        return;
      }
      if (node.x < minX) {
        minX = node.x;
      }
      if (node.x > maxX) {
        maxX = node.x;
      }
    });

    if (!Number.isFinite(minX)) {
      minX = 0;
      maxX = 0;
    }

    const actualNodes = hierarchyRoot
      .descendants()
      .filter((node) => node.data && node.data.node && node.data.node.id !== "__root__");
    
    console.log('computeLayout - actualNodes to render:', actualNodes.map(n => ({ 
      id: n.data.node.id, 
      name: n.data.node.name, 
      depth: n.depth,
      hasChildren: n.children && n.children.length > 0,
      childrenCount: n.children ? n.children.length : 0
    })));

    const maxDepth = actualNodes.length
      ? d3.max(actualNodes, (node) => Math.max(node.depth - 1, 0))
      : 0;

    const rawContentWidth = maxX - minX;
    const contentWidth = Math.max(rawContentWidth, NODE_WIDTH);
    const computedInnerWidth = Math.max(contentWidth, minInnerWidth);
    const minOuterWidth = computedInnerWidth + margins.left + margins.right;
    const outerWidth = Math.max(minOuterWidth, baseOuterWidth, minInnerWidth + margins.left + margins.right);
    const innerWidth = outerWidth - margins.left - margins.right;
    const offsetX = Math.max((innerWidth - contentWidth) / 2, 0);

    const verticalStep = NODE_HEIGHT + VERTICAL_GAP;
    const requiredInnerHeight = NODE_HEIGHT + maxDepth * verticalStep;
    const innerHeight = Math.max(minInnerHeight, requiredInnerHeight);
    const outerHeight = innerHeight + margins.top + margins.bottom;

    svg.attr("width", outerWidth).attr("height", outerHeight);

    const bottomY = margins.top + innerHeight - NODE_HEIGHT / 2;
    const topY = margins.top + NODE_HEIGHT / 2;
    const levelGap = maxDepth > 0 ? verticalStep : 0;

    hierarchyRoot.each((node) => {
      const relativeX = node.x - minX;
      const tentativeX = margins.left + relativeX + offsetX;
      const minAllowedX = margins.left + NODE_WIDTH / 2;
      const maxAllowedX = outerWidth - margins.right - NODE_WIDTH / 2;
      node.layoutX = Math.max(minAllowedX, Math.min(maxAllowedX, tentativeX));

      const depth = Math.max(node.depth - 1, 0);
      const layoutY = bottomY - depth * levelGap;
      node.layoutY = Math.max(topY, Math.min(bottomY, layoutY));
    });

    const nodeData = [];
    const supportMap = new Map();
    hierarchyRoot.each((node) => {
      if (!node.data || !node.data.node || node.data.node.id === "__root__") {
        return;
      }
      const wrapper = node.data;
      const actual = wrapper.node;
      const depth = Math.max(node.depth - 1, 0);
      const parentId =
        node.parent &&
        node.parent.data &&
        node.parent.data.node &&
        node.parent.data.node.id !== "__root__"
          ? node.parent.data.node.id
          : null;

      // Check if node has children by looking at the actual data structure
      const hasChildren = actual.children && actual.children.length > 0;
      
      nodeData.push({
        id: actual.id,
        name: actual.name,
        type: actual.type,
        role: actual.role,
        hasChildren: hasChildren,
        isExpanded: state.expanded.has(actual.id),
        depth,
        parentId,
        x: node.layoutX,
        y: node.layoutY,
        raw: actual
      });
    });

    const nodeLookup = new Map(nodeData.map((node) => [node.id, node]));

    nodes.forEach((raw) => {
      if (raw.type === "SupportOffice") {
        const parentId = raw.parent || null;
        const children = Array.isArray(raw.children)
          ? raw.children.map((childId) => nodesById.get(childId)).filter(Boolean)
          : [];
        console.log('Creating supportMap entry for:', raw.name, 'parent:', parentId, 'children:', children.length);
        supportMap.set(parentId, { office: raw, children });
      }
    });

    const linkData = nodeData
      .filter((node) => node.parentId && nodeLookup.has(node.parentId))
      .map((node) => {
        const parent = nodeLookup.get(node.parentId);
        return {
          id: `${node.parentId}->${node.id}`,
          source: { x: parent.x, y: parent.y - NODE_HEIGHT / 2 },
          target: { x: node.x, y: node.y + NODE_HEIGHT / 2 }
        };
      });

    return { nodeData, linkData, supportMap, nodeLookup, outerWidth, outerHeight };
  };

  const renderLinks = (links) => {
    const selection = linkGroup.selectAll("path.map-link").data(links, (link) => link.id);
    selection.exit().remove();
    selection
      .enter()
      .append("path")
      .attr("class", "map-link")
      .merge(selection)
      .attr("d", (link) => linkGenerator({ source: link.source, target: link.target }));
  };

  const renderNodes = (nodes) => {
    const selection = nodeGroup.selectAll("g.map-node").data(nodes, (node) => node.id);
    selection.exit().remove();

    const entered = selection
      .enter()
      .append("g")
      .attr("class", "map-node")
      .on("click", (_event, node) => {
        if (typeof OrgUI !== "undefined" && OrgUI && typeof OrgUI.openNode === "function") {
          OrgUI.openNode(node.id);
        }
        // Do not change pan/zoom when selecting a node
      })
      .on("dblclick", (event, node) => {
        event.stopPropagation();
        toggleNode(node);
      });

    entered
      .append("rect")
      .attr("class", "map-node-rect")
      .attr("rx", 14)
      .attr("ry", 14);

    entered
      .append("text")
      .attr("class", "map-node-label")
      .attr("text-anchor", "middle");

    entered
      .append("text")
      .attr("class", "map-node-type")
      .attr("text-anchor", "middle");

    const merged = entered.merge(selection);

    // Update positions with smooth transition for better UX
    merged
      .transition()
      .duration(300)
      .ease(d3.easeCubicInOut)
      .attr("transform", (node) => "translate(" + node.x + "," + node.y + ")")
      .style("opacity", 1); // Ensure consistent opacity
    
    // Update classes immediately (no transition needed)
    merged
      .attr("data-depth", (node) => node.depth)
      .classed("is-selected", (node) => state.selectedId === node.id)
      .classed("has-children", (node) => node.hasChildren)
      .classed("is-expanded", (node) => node.isExpanded);

    merged
      .select("rect.map-node-rect")
      .attr("x", -NODE_WIDTH / 2)
      .attr("y", -NODE_HEIGHT / 2)
      .attr("width", NODE_WIDTH)
      .attr("height", NODE_HEIGHT);

    merged.select("text.map-node-label").each(function (node) {
      const label = node.name || node.id;
      const textSelection = d3.select(this);
      textSelection.attr("y", -NODE_HEIGHT / 2 + 20);
      wrapText(textSelection, NODE_WIDTH - 28, label);
    });

    merged
      .select("text.map-node-type")
      .attr("y", NODE_HEIGHT / 2 - 14)
      .text((node) => node.type || "")
      .attr("opacity", (node) => (node.type ? 1 : 0));

    const toggles = merged.selectAll("g.map-node-toggle").data(
      (node) => (node.hasChildren ? [node] : []),
      (node) => node.id
    );

    toggles.exit().remove();

    const togglesEnter = toggles
      .enter()
      .append("g")
      .attr("class", "map-node-toggle")
      .on("click", (event, node) => {
        event.stopPropagation();
        toggleNode(node);
      });

    togglesEnter
      .append("rect")
      .attr("class", "map-node-toggle-box")
      .attr("x", -8)
      .attr("y", -8)
      .attr("width", 16)
      .attr("height", 16)
      .attr("rx", 3)
      .attr("ry", 3);

    togglesEnter
      .append("line")
      .attr("class", "map-node-toggle-line horiz")
      .attr("x1", -5)
      .attr("x2", 5)
      .attr("y1", 0)
      .attr("y2", 0);

    togglesEnter
      .append("line")
      .attr("class", "map-node-toggle-line vert")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", -5)
      .attr("y2", 5);

    const togglesMerged = togglesEnter.merge(toggles);

    togglesMerged
      .attr("transform", (node) => "translate(" + (-NODE_WIDTH / 2 - 22) + "," + (-NODE_HEIGHT / 2 + 16) + ")")
      .classed("expanded", (node) => state.expanded.has(node.id));

    togglesMerged
      .select(".map-node-toggle-line.vert")
      .attr("visibility", (node) => (state.expanded.has(node.id) ? "hidden" : "visible"));
  };

  const pruneSupportVisibility = (supportMap) => {
    if (!supportMap || typeof supportMap.keys !== 'function') {
      return;
    }
    const validParents = new Set(supportMap.keys());
    Array.from(supportVisibility).forEach((parentId) => {
      if (!validParents.has(parentId)) {
        supportVisibility.delete(parentId);
      }
    });
  };

  const toggleSupportVisibility = (parentId) => {
    console.log('toggleSupportVisibility called with parentId:', parentId);
    if (supportVisibility.has(parentId)) {
      // Close the current support office
      supportVisibility.delete(parentId);
      console.log('Removed from supportVisibility');
      
      // When closing support offices, ensure focus is maintained on selected node
      if (state.selectedId) {
        setTimeout(() => {
          focusNode(state.selectedId, { duration: 200 });
        }, 100);
      }
    } else {
      // Close all other support offices first (only allow one open at a time)
      supportVisibility.clear();
      // Open the new support office
      supportVisibility.add(parentId);
      console.log('Cleared all and added new to supportVisibility');
      
      // Zoom out a bit to accommodate support boxes
      if (svg && zoomBehavior) {
        const currentScale = currentTransform.k;
        const newScale = Math.max(zoomSettings.min, currentScale * 0.7); // Zoom out to 70% of current scale
        const newTransform = d3.zoomIdentity.translate(currentTransform.x, currentTransform.y).scale(newScale);
        
        svg.transition()
          .duration(300)
          .ease(d3.easeCubicInOut)
          .call(zoomBehavior.transform, newTransform)
          .on('end', () => {
            // After zoom animation, focus on the selected node if any
            if (state.selectedId) {
              setTimeout(() => {
                focusNode(state.selectedId, { duration: 200, scale: 0.6 });
              }, 50);
            }
          });
      }
    }
    console.log('Current supportVisibility:', Array.from(supportVisibility));
    console.log('lastLayout exists:', !!lastLayout);
    if (lastLayout) {
      console.log('lastLayout.supportMap exists:', !!lastLayout.supportMap);
      renderSupportToggles(lastLayout);
      renderSupportBoxes(lastLayout);
    }
  };

  const renderSupportToggles = (layout) => {
    if (!supportToggleGroup || !layout || !layout.supportMap) {
      console.log('renderSupportToggles: Missing requirements', {
        supportToggleGroup: !!supportToggleGroup,
        layout: !!layout,
        supportMap: !!(layout && layout.supportMap)
      });
      return;
    }
    const nodesWithSupport = layout.nodeData.filter((node) => layout.supportMap.has(node.id));
    console.log('renderSupportToggles: nodesWithSupport', nodesWithSupport.length, nodesWithSupport.map(n => n.id));
    
    const selection = supportToggleGroup
      .selectAll('foreignObject.support-toggle-fo')
      .data(nodesWithSupport, (node) => node.id);

    selection.exit().remove();

    const entered = selection
      .enter()
      .append('foreignObject')
      .attr('class', 'support-toggle-fo')
      .attr('width', SUPPORT_TOGGLE_WIDTH)
      .attr('height', SUPPORT_TOGGLE_HEIGHT);

    entered
      .append('xhtml:button')
      .attr('type', 'button')
      .attr('class', 'support-toggle-button');

    const merged = entered.merge(selection);

    merged
      .attr('x', (node) => node.x - SUPPORT_TOGGLE_WIDTH / 2)
      .attr('y', (node) => node.y + NODE_HEIGHT / 2 + SUPPORT_TOGGLE_OFFSET);

    merged.select('button.support-toggle-button')
      .text((node) => (supportVisibility.has(node.id) ? 'Hide Support Office' : 'Show Support Office'))
      .on('click', (event, node) => {
        event.stopPropagation();
        toggleSupportVisibility(node.id);
      });
  };

  
  const renderSupportBoxes = (layout) => {
    console.log('renderSupportBoxes called with layout:', layout);
    console.log('supportBoxGroup exists:', !!supportBoxGroup);
    console.log('layout exists:', !!layout);
    console.log('layout.supportMap exists:', !!(layout && layout.supportMap));
    
    if (!supportBoxGroup || !layout || !layout.supportMap) {
      console.log('renderSupportBoxes returning early');
      return;
    }
    const nodeLookup = layout.nodeLookup || new Map();
    const data = [];
    console.log('supportVisibility:', Array.from(supportVisibility));
    console.log('layout.supportMap keys:', Array.from(layout.supportMap.keys()));
    console.log('nodeLookup keys:', Array.from(nodeLookup.keys()));
    
    layout.supportMap.forEach((entry, parentId) => {
      console.log('Processing supportMap entry for parentId:', parentId);
      if (!parentId) {
        console.log('Skipping - no parentId');
        return;
      }
      if (!supportVisibility.has(parentId)) {
        console.log('Skipping - not in supportVisibility:', parentId);
        return;
      }
      const parentNode = nodeLookup.get(parentId);
      if (!parentNode) {
        console.log('Skipping - parentNode not found:', parentId);
        return;
      }
      console.log('Adding to data:', parentId, 'with children:', entry.children.length);
      data.push({ parent: parentNode, office: entry.office, children: entry.children || [], parentId });
    });
    
    console.log('Final data array length:', data.length);

    const selection = supportBoxGroup
      .selectAll('foreignObject.support-box-fo')
      .data(data, (d) => d.parentId);

    selection.exit().remove();

    const entered = selection
      .enter()
      .append('foreignObject')
      .attr('class', 'support-box-fo')
      .attr('width', SUPPORT_BOX_WIDTH)
      .attr('height', SUPPORT_BOX_HEIGHT);

    entered
      .append('xhtml:div')
      .attr('class', 'support-box');

    const merged = entered.merge(selection);

    merged
      .attr('x', (d) => d.parent.x - SUPPORT_BOX_WIDTH / 2)
      .attr('y', (d) => d.parent.y + NODE_HEIGHT / 2 + SUPPORT_TOGGLE_OFFSET + SUPPORT_TOGGLE_HEIGHT + SUPPORT_BOX_OFFSET);

    merged.select('div.support-box').each(function (d) {
      const div = d3.select(this);
      div.selectAll('*').remove();
      const title = div.append('div').attr('class', 'support-box-title');
      const officeName = d.office && d.office.name ? d.office.name : 'Support Office';
      title.text(officeName);
      
      console.log('Rendering support box for:', officeName, 'with children:', d.children);
      
      if (d.children && d.children.length > 0) {
        d.children.forEach((child) => {
          const button = div
            .append('button')
            .attr('type', 'button')
            .attr('class', 'support-box-item')
            .attr('data-node-id', child.id)
            .text(child && child.name ? child.name : child && child.id ? child.id : '');
          button.on('click', (event) => {
            event.stopPropagation();
            if (child && child.id && typeof OrgUI !== 'undefined' && OrgUI && typeof OrgUI.openNode === 'function') {
              OrgUI.openNode(child.id);
            }
          });
        });
      } else {
        console.log('No children found for support office:', officeName);
        div.append('div').attr('class', 'support-box-item').text('Inga barn hittades');
      }
      
      // Update selection state for support items
      updateSupportItemsSelection(div);
    });
  };

  const updateSupportItemsSelection = (supportBoxDiv) => {
    if (!supportBoxDiv || !state.selectedId) {
      return;
    }
    
    supportBoxDiv.selectAll('.support-box-item').each(function() {
      const button = d3.select(this);
      const nodeId = button.attr('data-node-id');
      
      if (nodeId === state.selectedId) {
        button.classed('selected', true);
      } else {
        button.classed('selected', false);
      }
    });
  };

  const setSupportVisibility = (parentId, isVisible) => {
    if (!parentId) {
      return;
    }
    
    if (isVisible) {
      // Close all other support offices first (only allow one open at a time)
      supportVisibility.clear();
      // Open the new support office
      supportVisibility.add(parentId);
      
      // Zoom out a bit when opening support offices
      if (svg && zoomBehavior) {
        const currentScale = currentTransform.k;
        const newScale = Math.max(zoomSettings.min, currentScale * 0.7); // Zoom out to 70% of current scale
        const newTransform = d3.zoomIdentity.translate(currentTransform.x, currentTransform.y).scale(newScale);
        
        svg.transition()
          .duration(300)
          .ease(d3.easeCubicInOut)
          .call(zoomBehavior.transform, newTransform)
          .on('end', () => {
            // After zoom animation, focus on the selected node if any
            if (state.selectedId) {
              setTimeout(() => {
                focusNode(state.selectedId, { duration: 200, scale: 0.6 });
              }, 50);
            }
          });
      }
    } else {
      supportVisibility.delete(parentId);
      
      // When closing support offices, ensure focus is maintained on selected node
      if (state.selectedId) {
        setTimeout(() => {
          focusNode(state.selectedId, { duration: 200 });
        }, 100);
      }
    }
    
    // Re-render support toggles and boxes
    if (lastLayout) {
      renderSupportToggles(lastLayout);
      renderSupportBoxes(lastLayout);
    }
  };

  const toggleNode = (node) => {
    if (!node || !node.hasChildren) {
      console.log('ToggleNode: Node has no children or is invalid:', node?.id, node?.hasChildren);
      return;
    }
    if (state.expanded.has(node.id)) {
      console.log('Collapsing node:', node.id);
      collapseDescendants(node.id);
      state.expanded.delete(node.id);
    } else {
      console.log('Expanding node:', node.id);
      state.expanded.add(node.id);
    }
    console.log('Current expanded state:', Array.from(state.expanded));
    refresh();
  };

  const collapseDescendants = (nodeId) => {
    const childrenByParent = buildChildrenMap();
    const queue = [...(childrenByParent.get(nodeId) || [])];
    while (queue.length) {
      const current = queue.shift();
      state.expanded.delete(current);
      const children = childrenByParent.get(current);
      if (children && children.length) {
        queue.push(...children);
      }
    }
  };

  const buildChildrenMap = () => {
    const map = new Map();
    OrgStore.getAll().forEach((node) => {
      const parentId = node.parent || null;
      if (!map.has(parentId)) {
        map.set(parentId, []);
      }
      map.get(parentId).push(node.id);
    });
    return map;
  };

  const ensureDefaultExpansion = (nodes) => {
    if (state.expanded.size) {
      return;
    }
    const nodesById = new Map();
    nodes.forEach((node) => {
      nodesById.set(node.id, node);
    });

    const depthCache = new Map();
    const computeDepth = (nodeId) => {
      if (depthCache.has(nodeId)) {
        return depthCache.get(nodeId);
      }
      let depth = 0;
      let current = nodesById.get(nodeId);
      const visited = new Set([nodeId]);
      while (current && current.parent) {
        if (visited.has(current.parent)) {
          depth = Infinity;
          break;
        }
        visited.add(current.parent);
        depth += 1;
        current = nodesById.get(current.parent);
      }
      depthCache.set(nodeId, depth);
      return depth;
    };

    nodes.forEach((node) => {
      if (!node || !node.children || node.children.length === 0) {
        console.log(`Node ${node?.id} has no children, skipping expansion`);
        return;
      }
      const depth = computeDepth(node.id);
      console.log(`Node ${node.id} depth: ${depth}, children: ${node.children.length}`);
      if (Number.isFinite(depth) && depth < 2) {
        state.expanded.add(node.id);
        console.log(`Expanded node ${node.id}`);
      } else {
        console.log(`Did not expand node ${node.id} (depth: ${depth})`);
      }
    });
    
    console.log('Final expanded state:', Array.from(state.expanded));
  };

  const pruneExpanded = (validIds) => {
    const validSet = new Set(validIds);
    const toDelete = [];
    state.expanded.forEach((id) => {
      if (!validSet.has(id)) {
        toDelete.push(id);
      }
    });
    toDelete.forEach((id) => state.expanded.delete(id));
  };

  let refreshTimeout = null;
  let isRefreshing = false;
  let refreshCallCount = 0;
  let lastRefreshTime = 0;
  const MIN_REFRESH_INTERVAL = 250; // Minimum 250ms between refreshes
  
  const refresh = () => {
    refreshCallCount++;
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;
    
    console.log(`Refresh called #${refreshCallCount}, isRefreshing: ${isRefreshing}, svg: ${!!svg}, timeSinceLastRefresh: ${timeSinceLastRefresh}ms`);
    
    if (!svg || isRefreshing) {
      console.log('Refresh skipped - svg missing or already refreshing');
      return;
    }
    
    // If we're calling refresh too frequently, skip it
    if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL) {
      console.log(`Refresh skipped - too frequent (${timeSinceLastRefresh}ms < ${MIN_REFRESH_INTERVAL}ms)`);
      return;
    }
    
    // Clear any existing timeout
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    
    // Use a longer debounce delay to prevent rapid successive calls
    refreshTimeout = setTimeout(() => {
      isRefreshing = true;
      lastRefreshTime = Date.now();
      console.log(`Starting refresh execution #${refreshCallCount}`);
      
      try {
        // Preserve current transform state during refresh
        const preservedTransform = currentTransform;
        
        const nodes = OrgStore.getAll();
        pruneExpanded(nodes.map((node) => node.id));
        ensureDefaultExpansion(nodes);
        const layout = computeLayout(nodes);
        if (!layout) {
          return;
        }
        pruneSupportVisibility(layout.supportMap);
        lastLayout = layout;
        renderLinks(layout.linkData);
        renderNodes(layout.nodeData);
        renderSupportToggles(layout);
        renderSupportBoxes(layout);
        
        // Update selection state for all support items
        if (state.selectedId) {
          supportBoxGroup.selectAll('.support-box-fo').each(function() {
            const fo = d3.select(this);
            const supportBox = fo.select('div.support-box');
            updateSupportItemsSelection(supportBox);
          });
        }
        
        // Restore and apply the preserved transform
        currentTransform = preservedTransform;
        ensureTransformConsistency();
        // Keep user's current pan without forcing recenter on every refresh
        
        console.log(`Refresh execution completed #${refreshCallCount}`);
      } catch (error) {
        console.error('Error during refresh:', error);
      } finally {
        isRefreshing = false;
      }
    }, 150); // Increased debounce delay to 150ms
  };

  const handleResize = () => {
    if (!container) {
      return;
    }
    refresh();
    
    // After resize, do not pan to selected node; just reset fit
    setTimeout(() => {
      resetView({ duration: 200 });
    }, 100);
  };

  const show = () => {
    init();
    if (!container) {
      return;
    }
    container.classList.remove("hidden");
    refresh();
    
    // Use a longer delay to ensure container dimensions are properly updated
    setTimeout(() => {
      // Do not pan/zoom to selected node automatically
      resetView({ duration: 0 });
    }, 100); // 100ms delay to ensure dimensions are updated
  };

  const hide = () => {
    if (!container) {
      return;
    }
    container.classList.add("hidden");
    
    // Clean up subscriptions and timeouts when hiding
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      refreshTimeout = null;
    }
  };

  const reveal = (nodeId) => {
    if (!isInitialised) {
      init();
    }

    if (!nodeId) {
      return;
    }
    
    // Skip reveal if admin panel transition is in progress
    if (window._adminPanelTransition) {
      console.log('reveal - skipping reveal due to admin panel transition');
      return;
    }
    
    // Check if this is a support office child
    const allNodes = OrgStore.getAll();
    const supportChild = allNodes.find(node => node.id === nodeId && node.type === "SupportOffice");
    
    if (supportChild) {
      // For support office children, show their parent's support box
      const parentId = supportChild.parent;
      if (parentId) {
        supportVisibility.add(parentId);
      }
    }
    
    const parentByChild = new Map();
    allNodes.forEach((node) => {
      parentByChild.set(node.id, node.parent || null);
    });
    let current = parentByChild.get(nodeId);
    while (current) {
      state.expanded.add(current);
      current = parentByChild.get(current) || null;
    }
    state.selectedId = nodeId;
    if (!container) {
      return;
    }
    // Only ensure the node's ancestors are expanded and selection is set;
    // do not change pan/zoom automatically on reveal.
    refresh();
  };

  const teardown = () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    window.removeEventListener("resize", handleResize);
    if (svg) {
      svg.remove();
      svg = null;
      canvasGroup = null;
      linkGroup = null;
      nodeGroup = null;
      supportToggleGroup = null;
      supportBoxGroup = null;
    }
    state.expanded.clear();
    state.selectedId = null;
    supportVisibility.clear();
    zoomBehavior = null;
    currentTransform = d3.zoomIdentity;
    lastLayout = null;
    isInitialised = false;
  };

  const wrapText = (textSelection, width, label) => {
    const words = (label || "").split(/\s+/).filter(Boolean);
    textSelection.text(null);
    if (!words.length) {
      return;
    }
    
    let line = [];
    let lineNumber = 0;
    const lineHeight = 1.2; // Increased line height for better spacing
    const maxLines = 2; // Limit to 2 lines to prevent overflow
    
    let tspan = textSelection.append("tspan").attr("x", 0).attr("dy", "0em");
    
    words.forEach((word) => {
      // Check if single word is too long and needs to be broken
      tspan.text(word);
      if (tspan.node().getComputedTextLength() > width) {
        // Break long words by characters
        const chars = word.split('');
        let currentWord = '';
        for (const char of chars) {
          const testWord = currentWord + char;
          tspan.text(testWord);
          if (tspan.node().getComputedTextLength() > width && currentWord.length > 0) {
            line.push(currentWord);
            tspan.text(line.join(" "));
            if (lineNumber >= maxLines - 1) {
              tspan.text(line.join(" ") + "...");
              return; // Stop processing if we hit max lines
            }
            line = [];
            lineNumber += 1;
            tspan = textSelection
              .append("tspan")
              .attr("x", 0)
              .attr("dy", lineHeight + "em");
            currentWord = char;
          } else {
            currentWord = testWord;
          }
        }
        line.push(currentWord);
      } else {
        line.push(word);
      }
      
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width && line.length > 1) {
        line.pop();
        tspan.text(line.join(" "));
        if (lineNumber >= maxLines - 1) {
          tspan.text(line.join(" ") + "...");
          return; // Stop processing if we hit max lines
        }
        line = [word];
        lineNumber += 1;
        tspan = textSelection
          .append("tspan")
          .attr("x", 0)
          .attr("dy", lineHeight + "em")
          .text(word);
      }
    });
    
    const totalLines = lineNumber + 1;
    
    // Center the text vertically within the node
    textSelection
      .selectAll("tspan")
      .attr("dy", (_, index) => {
        const offset = (index - (totalLines - 1) / 2) * lineHeight;
        return index === 0 ? offset + "em" : lineHeight + "em";
      });
  };

  return {
    init,
    show,
    hide,
    refresh,
    reveal,
    resetView,
    teardown,
    setSupportVisibility
  };
})();

window.OrgMap = OrgMap;