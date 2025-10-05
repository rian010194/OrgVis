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
  };

  const applyCurrentTransform = () => {
    if (canvasGroup) {
      canvasGroup.attr("transform", currentTransform);
    }
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

    const bounds = container ? container.getBoundingClientRect() : null;
    const width = (bounds && bounds.width) || lastLayout.outerWidth || minInnerWidth + margins.left + margins.right;
    const height = (bounds && bounds.height) || lastLayout.outerHeight || minInnerHeight + margins.top + margins.bottom;

    // Use a more zoomed-out scale to show context of where the node is in the tree
    const contextScale = Math.max(zoomSettings.min, 0.6); // More zoomed out for better context
    const desiredScale = options.scale !== undefined ? options.scale : contextScale;
    const scale = Math.max(zoomSettings.min, Math.min(zoomSettings.max, desiredScale));
    const centerX = width / 2;
    // Adjust centerY to be slightly higher to avoid nodes appearing too far down
    const centerY = height * 0.4; // Center at 40% of height instead of 50%
    const tx = centerX - target.x * scale;
    const ty = centerY - (focusY || target.y) * scale;
    const transform = d3.zoomIdentity.translate(tx, ty).scale(scale);

    currentTransform = transform;
    if (svg && zoomBehavior) {
      const duration = options.duration !== undefined ? options.duration : 450;
      svg.transition().duration(duration).call(zoomBehavior.transform, transform);
    } else if (canvasGroup) {
      canvasGroup.attr("transform", transform);
    }
  };

  const resetView = (options = {}) => {
    currentTransform = d3.zoomIdentity;
    if (svg && zoomBehavior) {
      const duration = options.duration !== undefined ? options.duration : 300;
      svg.transition().duration(duration).call(zoomBehavior.transform, d3.zoomIdentity);
    } else if (canvasGroup) {
      canvasGroup.attr("transform", currentTransform);
    }
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

    unsubscribe = OrgStore.subscribe(() => {
      refresh();
    });

    window.addEventListener("resize", handleResize);
    refresh();
    isInitialised = true;
  };

  const buildHierarchy = (nodes) => {
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
        }
      } else if (!parentId) {
        roots.push(wrapper);
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
      return;
    }
    const nodesWithSupport = layout.nodeData.filter((node) => layout.supportMap.has(node.id));
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
        return;
      }
      const depth = computeDepth(node.id);
      if (Number.isFinite(depth) && depth < 2) {
        state.expanded.add(node.id);
      }
    });
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

  const refresh = () => {
    if (!svg) {
      return;
    }
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
  };

  const handleResize = () => {
    if (!container) {
      return;
    }
    refresh();
  };

  const show = () => {
    init();
    if (!container) {
      return;
    }
    container.classList.remove("hidden");
    refresh();
    requestAnimationFrame(() => {
      if (state.selectedId) {
        focusNode(state.selectedId, { duration: 0 });
      } else {
        resetView({ duration: 0 });
      }
    });
  };

  const hide = () => {
    if (!container) {
      return;
    }
    container.classList.add("hidden");
  };

  const reveal = (nodeId) => {
    if (!isInitialised) {
      init();
    }

    if (!nodeId) {
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
    refresh();
    if (nodeId) {
      requestAnimationFrame(() => {
        focusNode(nodeId, { scale: 0.6 }); // Use context scale for better overview
      });
    }
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
    const lineHeight = 1.1;
    let tspan = textSelection.append("tspan").attr("x", 0).attr("dy", "0em");
    words.forEach((word) => {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width && line.length > 1) {
        line.pop();
        tspan.text(line.join(" "));
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
    textSelection
      .selectAll("tspan")
      .attr("dy", (_, index) => (index - (totalLines - 1) / 2) * lineHeight + "em");
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