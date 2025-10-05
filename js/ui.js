const OrgUI = (() => {

  const expandState = new Map();

  let selectedNodeId = null;

  let unsubscribe = null;

  let activeAdminTab = "edit";

  const metricPalette = [

    "#ff5a00",

    "#ff8b3d",

    "#ffb266",

    "#ffd6ad",

    "#ffe6d5",

    "#ffc9ae"

  ];

  const getMetricColor = (() => {

    const assigned = new Map();

    let index = 0;

    return (key) => {

      if (!assigned.has(key)) {

        const color = metricPalette[index % metricPalette.length];

        assigned.set(key, color);

        index += 1;

      }

      return assigned.get(key);

    };

  })();

  const elements = {

    treeContainer: null,

    detailPanel: null,

    relationView: null,

    toggleAdmin: null,

    adminPanel: null,

    adminMessage: null,

    createForm: null,

    editForm: null,

    editNodeSelect: null,

    addRelationForm: null,

    removeRelationForm: null,

    deleteNodeButton: null,

    adminParentSelect: null,

    editParentSelect: null,

    appStatus: null,


    visualizationTypeSelect: null,

    visualizationNameInput: null,

    visualizationUnitInput: null,

    existingMetrics: null,

    createTypeSelect: null,

    createResponsibilities: null,


    createOutcomes: null,

    createSupportOffice: null,

    editTypeSelect: null,

    editResponsibilities: null,


    editOutcomes: null,

    editSupportOffice: null,

    adminTabs: [],

    adminPanels: []

  };

  const init = () => {

    cacheElements();

    bindStaticListeners();

    updateAdminTabsUI();

    // Ensure detail panel is visible by default (not in admin mode)
    if (elements.detailPanel && !elements.adminPanel.classList.contains("open")) {
      elements.detailPanel.style.display = "flex";
    }
    
    // Initialize admin button text
    updateAdminButtonText(elements.adminPanel.classList.contains("open"));

    // Set up resize observer for detail panel to sync heights
    setupDetailPanelResizeObserver();

    renderAll();

    unsubscribe = OrgStore.subscribe(renderAll);

  };

  const parseMultiline = (value) => {

    if (value === null || value === undefined) {

      return [];

    }

    return String(value)

      .split(/\r?\n/)

      .map((item) => item.trim())

      .filter(Boolean);

  };

  const formatMultiline = (items) => {

    if (!Array.isArray(items) || !items.length) {

      return "";

    }

    return items.join("\n");

  };

  const appendDetailList = (container, title, items) => {

    if (!container || !Array.isArray(items) || !items.length) {

      return;

    }

    const section = document.createElement("section");

    section.classList.add("detail-section");

    const heading = document.createElement("h3");

    heading.textContent = title;

    section.appendChild(heading);

    const list = document.createElement("ul");

    list.classList.add("detail-list");

    items.forEach((item) => {

      const entry = document.createElement("li");

      entry.textContent = item;

      list.appendChild(entry);

    });

    section.appendChild(list);

    container.appendChild(section);

  };

  const appendTimeSpentPieChart = (container, timeSpentData, chartName = "Time Spent Distribution") => {

    if (!container || !Array.isArray(timeSpentData) || !timeSpentData.length) {

      return;

    }

    const section = document.createElement("section");

    section.classList.add("detail-section");

    const heading = document.createElement("h3");

    heading.textContent = chartName;

    section.appendChild(heading);

    // Create pie chart container
    const chartContainer = document.createElement("div");

    chartContainer.classList.add("pie-chart-container");

    chartContainer.style.cssText = `

      width: 100%;

      height: 300px;

      display: flex;

      align-items: center;

      justify-content: center;

      margin: 10px 0;

    `;

    // Create SVG for pie chart
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    svg.setAttribute("width", "250");

    svg.setAttribute("height", "250");

    svg.style.cssText = `

      transform: rotate(-90deg);

      border-radius: 50%;

    `;

    // Calculate pie chart segments
    let cumulativePercentage = 0;

    const colors = [

      "#ff5a00", "#ff8b3d", "#ffb266", "#ffd6ad", "#ffe6d5", "#ffc9ae",

      "#4a90e2", "#7bb3f0", "#a8d0f0", "#d1e7f0", "#e8f4f8", "#c4e0f0"

    ];

    timeSpentData.forEach((item, index) => {

      const percentage = item.percentage;

      const angle = (percentage / 100) * 360;

      const startAngle = cumulativePercentage * 3.6; // Convert to degrees

      const endAngle = (cumulativePercentage + percentage) * 3.6;

      const radius = 100;

      const centerX = 125;

      const centerY = 125;

      // Calculate arc path
      const startAngleRad = (startAngle * Math.PI) / 180;

      const endAngleRad = (endAngle * Math.PI) / 180;

      const x1 = centerX + radius * Math.cos(startAngleRad);

      const y1 = centerY + radius * Math.sin(startAngleRad);

      const x2 = centerX + radius * Math.cos(endAngleRad);

      const y2 = centerY + radius * Math.sin(endAngleRad);

      const largeArcFlag = percentage > 50 ? 1 : 0;

      const pathData = [

        `M ${centerX} ${centerY}`,

        `L ${x1} ${y1}`,

        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,

        "Z"

      ].join(" ");

      // Create path element
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");

      path.setAttribute("d", pathData);

      path.setAttribute("fill", colors[index % colors.length]);

      path.setAttribute("stroke", "#fff");

      path.setAttribute("stroke-width", "2");

      path.setAttribute("data-activity", item.activity);

      path.setAttribute("data-percentage", percentage);

      path.style.cursor = "pointer";

      svg.appendChild(path);

      cumulativePercentage += percentage;

    });

    chartContainer.appendChild(svg);

    // Create legend
    const legend = document.createElement("div");

    legend.classList.add("pie-chart-legend");

    legend.style.cssText = `

      display: flex;

      flex-wrap: wrap;

      gap: 5px;

      margin-top: 10px;

      justify-content: center;

    `;

    timeSpentData.forEach((item, index) => {

      const legendItem = document.createElement("div");

      legendItem.style.cssText = `

        display: flex;

        align-items: center;

        gap: 4px;

        font-size: 12px;

      `;

      const colorBox = document.createElement("div");

      colorBox.style.cssText = `

        width: 12px;

        height: 12px;

        background-color: ${colors[index % colors.length]};

        border-radius: 2px;

      `;

      const label = document.createElement("span");

      label.textContent = `${item.activity} (${item.percentage}%)`;

      legendItem.appendChild(colorBox);

      legendItem.appendChild(label);

      legend.appendChild(legendItem);

    });

    section.appendChild(chartContainer);

    section.appendChild(legend);

    container.appendChild(section);

  };

  const cacheElements = () => {

    elements.treeContainer = document.getElementById("orgchart");

    elements.detailPanel = document.getElementById("detailPanel");

    elements.relationView = document.getElementById("relationView");

    elements.toggleAdmin = document.getElementById("toggleAdmin");

    elements.adminPanel = document.getElementById("adminPanel");

    elements.adminMessage = document.getElementById("adminMessage");

    elements.createForm = document.getElementById("adminCreateForm");

    elements.editForm = document.getElementById("adminEditForm");

    elements.editNodeSelect = document.getElementById("adminEditNodeSelect");

    elements.addRelationForm = document.getElementById("adminAddRelationForm");

    elements.removeRelationForm = document.getElementById("adminRemoveRelationForm");

    elements.addMetricForm = document.getElementById("adminAddMetricForm");

    elements.removeMetricForm = document.getElementById("adminRemoveMetricForm");

    elements.deleteNodeButton = document.getElementById("adminDeleteNodeButton");

    elements.adminParentSelect = document.getElementById("adminCreateParent");

    elements.editParentSelect = document.getElementById("adminEditParent");

    elements.appStatus = document.getElementById("appStatus");





    elements.createTypeSelect = document.getElementById("adminCreateType");

    elements.createResponsibilities = document.getElementById("adminCreateResponsibilities");


    elements.createOutcomes = document.getElementById("adminCreateOutcomes");

    elements.createSupportOffice = document.getElementById("adminCreateSupportOffice");

    elements.editTypeSelect = document.getElementById("adminEditType");

    elements.editResponsibilities = document.getElementById("adminEditResponsibilities");


    elements.editOutcomes = document.getElementById("adminEditOutcomes");

    elements.editSupportOffice = document.getElementById("adminEditSupportOffice");

    elements.adminTabs = Array.from(document.querySelectorAll('[data-admin-tab]')) || [];

    elements.adminPanels = Array.from(document.querySelectorAll('[data-admin-panel]')) || [];

    elements.clearDataButton = document.getElementById("clearDataButton");
  elements.testStorageButton = document.getElementById("testStorageButton");

  };

  const bindStaticListeners = () => {

    if (elements.toggleAdmin) {

      elements.toggleAdmin.addEventListener("click", toggleAdminPanel);

    }

    if (elements.adminTabs && elements.adminTabs.length) {

      elements.adminTabs.forEach((button) => {

        button.addEventListener("click", () => {

          const targetTab = button.dataset.adminTab;

          if (targetTab) {

            setActiveAdminTab(targetTab);

          }

        });

      });

    }

    if (elements.detailPanel) {

      elements.detailPanel.addEventListener("click", handleDetailPanelClick);

    }

    if (elements.treeContainer) {

      elements.treeContainer.addEventListener("click", handleTreeClick);

    }

    if (elements.createForm) {

      elements.createForm.addEventListener("submit", handleCreateNode);

    }

    if (elements.editForm) {

      elements.editForm.addEventListener("submit", handleEditNode);

    }

    if (elements.editNodeSelect) {

      elements.editNodeSelect.addEventListener("change", populateEditForm);

    }

    if (elements.addRelationForm) {

      elements.addRelationForm.addEventListener("submit", handleAddRelation);

    }

    if (elements.removeRelationForm) {

      elements.removeRelationForm.addEventListener("submit", handleRemoveRelation);

    }

    if (elements.addMetricForm) {

      elements.addMetricForm.addEventListener("submit", handleAddMetric);
      
      // Function to create a value input row (accessible globally for edit functionality)
      window.createValueInput = (index = 0, label = '', value = '') => {
        const valueRow = document.createElement('div');
        valueRow.className = 'value-input-row';
        valueRow.style.cssText = 'display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center;';
        
        valueRow.innerHTML = `
          <input type="text" name="valueLabel_${index}" placeholder="Label (e.g., Q1, Sales, etc.)" value="${label}" style="flex: 1;" />
          <input type="number" name="valueValue_${index}" step="0.01" placeholder="0" value="${value}" style="flex: 1;" />
          <button type="button" class="remove-value-btn" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">×</button>
        `;
        
        // Add remove functionality
        const removeBtn = valueRow.querySelector('.remove-value-btn');
        removeBtn.addEventListener('click', () => {
          valueRow.remove();
        });
        
        return valueRow;
      };
      
      // Handle chart type changes to show/hide values container
      const chartTypeSelect = elements.addMetricForm.querySelector('select[name="metricChartType"]');
      const valuesContainer = document.getElementById('valuesContainer');
      const valuesList = document.getElementById('valuesList');
      const addValueBtn = document.getElementById('addValueBtn');
      
      if (chartTypeSelect && valuesContainer && valuesList && addValueBtn) {
        // Function to add a new value input
        const addValueInput = () => {
          const currentInputs = valuesList.querySelectorAll('.value-input-row');
          const index = currentInputs.length;
          const valueRow = window.createValueInput(index);
          valuesList.appendChild(valueRow);
        };
        
        // Handle chart type changes
        chartTypeSelect.addEventListener('change', (e) => {
          const chartType = e.target.value;
          // Show values container for chart types that need numerical values
          if (['pie', 'doughnut', 'bar', 'line'].includes(chartType)) {
            valuesContainer.style.display = 'block';
            // Initialize with one value input if none exist
            if (valuesList.children.length === 0) {
              addValueInput();
            }
          } else if (chartType === 'table') {
            valuesContainer.style.display = 'none';
          } else {
            valuesContainer.style.display = 'block';
            if (valuesList.children.length === 0) {
              addValueInput();
            }
          }
        });
        
        // Handle add value button
        addValueBtn.addEventListener('click', addValueInput);
        
        // Initialize with one value input for pie charts (most common)
        if (chartTypeSelect.value === 'pie') {
          addValueInput();
        }
      }

    }

    if (elements.removeMetricForm) {

      elements.removeMetricForm.addEventListener("submit", handleRemoveMetric);
      
      // Add listener for node selection to update metrics dropdown
      const nodeSelect = elements.removeMetricForm.querySelector('select[name="removeNodeId"]');
      if (nodeSelect) {
        nodeSelect.addEventListener("change", (e) => {
          updateMetricsOptions(e.target.value);
        });
      }

    }

    if (elements.deleteNodeButton) {

      elements.deleteNodeButton.addEventListener("click", handleDeleteNode);

    }


    if (elements.visualizationTypeSelect) {

      elements.visualizationTypeSelect.addEventListener("change", handleVisualizationTypeChange);

    }

    if (elements.clearDataButton) {

      elements.clearDataButton.addEventListener("click", handleClearData);
    elements.testStorageButton.addEventListener("click", handleTestStorage);

    }

  };

  const renderAll = () => {

    renderOrgChart();

    renderDetailPanel();

    renderRelationView();

    refreshAdminPanel();

  };

  const syncSupportOfficeVisibility = (nodeId) => {
    // Check if the selected node is a support office child
    const node = OrgStore.getNode(nodeId);
    if (!node) {
      return;
    }
    
    // If this is a support office child, show its parent's support box in map view
    if (node.type === "SupportOffice" && node.parent) {
      if (typeof OrgMap !== "undefined" && OrgMap && typeof OrgMap.setSupportVisibility === "function") {
        OrgMap.setSupportVisibility(node.parent, true);
      }
    }
  };

  const renderOrgChart = () => {

    if (!elements.treeContainer) {

      return;

    }

    const roots = OrgStore.getRoots();

    elements.treeContainer.innerHTML = "";

    if (!roots.length) {

      elements.treeContainer.innerHTML = '<p class="empty-state">No organization data loaded.</p>';

      return;

    }

    const list = document.createElement("ul");

    list.classList.add("tree-root");

    roots.forEach((root) => {

      list.appendChild(buildTreeItem(root, 0));

    });

    elements.treeContainer.appendChild(list);

  };

  const buildTreeItem = (node, depth) => {

    const li = document.createElement("li");

    li.classList.add("tree-item");

    li.dataset.nodeId = node.id;

    const header = document.createElement("div");

    header.classList.add("tree-item-header");

    const hasChildren = node.children && node.children.length > 0;

    const expanded = ensureExpandedState(node.id, depth);

    if (hasChildren) {

      const toggleButton = document.createElement("button");

      toggleButton.type = "button";

      toggleButton.classList.add("tree-toggle");

      toggleButton.setAttribute("aria-expanded", String(expanded));

      toggleButton.dataset.action = "toggle";

      toggleButton.dataset.nodeId = node.id;

      toggleButton.textContent = expanded ? "-" : "+";

      header.appendChild(toggleButton);

    } else {

      const spacer = document.createElement("span");

      spacer.classList.add("tree-spacer");

      header.appendChild(spacer);

    }

    const labelButton = document.createElement("button");

    labelButton.type = "button";

    labelButton.classList.add("tree-label");

    labelButton.dataset.action = "select";

    labelButton.dataset.nodeId = node.id;

    labelButton.textContent = node.name;

    header.appendChild(labelButton);

    const typeBadge = document.createElement("span");

    typeBadge.classList.add("tree-badge");

    typeBadge.textContent = node.type;

    header.appendChild(typeBadge);

    li.appendChild(header);

    if (selectedNodeId === node.id) {

      li.classList.add("selected");

    }

    if (hasChildren) {

      const childrenList = document.createElement("ul");

      childrenList.classList.add("tree-children");

      if (!expanded) {

        childrenList.classList.add("collapsed");

      }

      node.children

        .map((childId) => OrgStore.getNode(childId))

        .filter(Boolean)

        .forEach((childNode) => {

          childrenList.appendChild(buildTreeItem(childNode, depth + 1));

        });

      li.appendChild(childrenList);

    }

    return li;

  };

  const ensureExpandedState = (nodeId, depth) => {

    if (!expandState.has(nodeId)) {

      expandState.set(nodeId, depth < 2);

    }

    return expandState.get(nodeId);

  };

  const handleTreeClick = (event) => {

    const target = event.target;

    if (!(target instanceof HTMLElement)) {

      return;

    }

    const action = target.dataset.action;

    const nodeId = target.dataset.nodeId;

    if (!nodeId) {

      return;

    }

    if (action === "toggle") {

      event.stopPropagation();

      toggleNode(nodeId, target);

    } else if (action === "select") {

      event.stopPropagation();

      openNode(nodeId);

    }

  };

  const toggleNode = (nodeId, buttonEl) => {

    const isExpanded = expandState.get(nodeId);

    const nextState = !isExpanded;

    expandState.set(nodeId, nextState);

    if (buttonEl) {

      buttonEl.setAttribute("aria-expanded", String(nextState));

      buttonEl.textContent = nextState ? "-" : "+";

    }

    renderOrgChart();

  };

  const openNode = (nodeId) => {

    selectedNodeId = nodeId;

    // Keep detail panel expanded by default
    // if (elements.detailPanel) {
    //   elements.detailPanel.classList.remove("expanded");
    // }
    // document.body.classList.remove("detail-expanded");

    expandAncestors(nodeId);

    if (elements.editNodeSelect) {

      elements.editNodeSelect.value = nodeId;

      populateEditForm();

    }

    // Update Relations and Metrics dropdowns if admin panel is open
    if (elements.adminPanel && elements.adminPanel.classList.contains("open")) {
      updateFormDropdownsWithSelectedNode();
    }

    setActiveAdminTab("edit");

    if (typeof OrgMap !== "undefined" && OrgMap && typeof OrgMap.reveal === "function") {

      OrgMap.reveal(nodeId);
      
      // If this is a support office child, ensure its parent's support box is visible
      syncSupportOfficeVisibility(nodeId);

    }

    renderOrgChart();

    renderDetailPanel();

  };

  const expandAncestors = (nodeId) => {

    let current = OrgStore.getNode(nodeId);

    const visited = new Set();

    while (current && current.parent && !visited.has(current.parent)) {

      expandState.set(current.parent, true);

      visited.add(current.parent);

      current = OrgStore.getNode(current.parent);

    }

  };

  const renderDetailPanel = () => {

    if (!elements.detailPanel) {

      return;

    }

    elements.detailPanel.innerHTML = "";

    if (!selectedNodeId) {

      elements.detailPanel.classList.remove("active");

      elements.detailPanel.classList.remove("expanded");

      delete elements.detailPanel.dataset.nodeId;

      document.body.classList.remove("detail-expanded");

      elements.detailPanel.innerHTML = '<div class="detail-empty">Select a node in the tree for details.</div>';

      return;

    }

    const node = OrgStore.getNode(selectedNodeId);

    if (!node) {

      selectedNodeId = null;

      renderDetailPanel();

      return;

    }

    if (elements.detailPanel.dataset.nodeId !== node.id) {

      elements.detailPanel.classList.add("expanded");

      document.body.classList.add("detail-expanded");

    }

    elements.detailPanel.dataset.nodeId = node.id;

    const container = document.createElement("div");

    container.classList.add("detail-content");

    const header = document.createElement("div");

    header.classList.add("detail-header");

    const title = document.createElement("h2");

    title.textContent = node.name;

    header.appendChild(title);

    const closeButton = document.createElement("button");

    closeButton.type = "button";

    closeButton.classList.add("detail-close");

    closeButton.setAttribute("aria-label", "Close panel");

    closeButton.dataset.action = "close-panel";

    closeButton.textContent = "";

    header.appendChild(closeButton);

    container.appendChild(header);

    const meta = document.createElement("p");

    meta.classList.add("detail-meta");

    const parent = node.parent ? OrgStore.getNode(node.parent) : null;

    meta.textContent = node.type + (parent ? " - Under " + parent.name : "");

    container.appendChild(meta);

    if (node.role) {

      const role = document.createElement("p");

      role.classList.add("detail-role");

      role.textContent = node.role;

      container.appendChild(role);

    }

    appendDetailList(container, "Macro Responsibilities", node.responsibilities);


    // Add pie chart for time spent if data exists
    if (node.timeSpent && node.timeSpent.length > 0) {
      const chartName = node.timeSpentChartName || "Time Spent Distribution";
      appendTimeSpentPieChart(container, node.timeSpent, chartName);
    }

    appendDetailList(container, "Outcomes", node.outcomes);

    const childNodes = Array.isArray(node.children)

      ? node.children

          .map((childId) => OrgStore.getNode(childId))

          .filter(Boolean)

      : [];

    if (node.name && node.name.toLowerCase().includes("support office") && childNodes.length) {

      const section = document.createElement("section");

      section.classList.add("detail-section");

      const heading = document.createElement("h3");

      heading.textContent = "Support Functions";

      section.appendChild(heading);

      const list = document.createElement("ul");

      list.classList.add("detail-support-list");

      childNodes.forEach((child) => {

        const item = document.createElement("li");

        const button = document.createElement("button");

        button.type = "button";

        button.classList.add("detail-support-link");

        button.dataset.action = "jump";

        button.dataset.nodeId = child.id;

        button.textContent = child.name;

        item.appendChild(button);

        list.appendChild(item);

      });

      section.appendChild(list);

      container.appendChild(section);

    }

    const metricsSection = buildMetricsSection(node);

    if (metricsSection) {

      container.appendChild(metricsSection);

      // Add admin chart buttons only when admin panel is open
      if (elements.adminPanel && elements.adminPanel.classList.contains("open")) {
        const chartTypes = [
          { type: 'pie', label: 'Add Pie Chart' },
          { type: 'bar', label: 'Add Bar Chart' },
          { type: 'line', label: 'Add Line Chart' },
          { type: 'table', label: 'Add Table' }
        ];
        
        const buttonsContainer = document.createElement("div");
        buttonsContainer.style.cssText = "margin-top: 1rem; display: flex; flex-wrap: wrap; gap: 0.5rem;";
        
        chartTypes.forEach(chartType => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "secondary";
          button.textContent = chartType.label;
          button.style.cssText = "font-size: 0.9rem; padding: 0.5rem 1rem;";
          button.addEventListener("click", () => {
            // Pre-fill the chart type in the admin form
            const chartTypeSelect = elements.addMetricForm?.querySelector('select[name="metricChartType"]');
            if (chartTypeSelect) {
              chartTypeSelect.value = chartType.type;
              // Trigger change event to show/hide values container
              chartTypeSelect.dispatchEvent(new Event('change'));
            }
            
            // Switch to metrics tab
            setActiveAdminTab("metrics");
            // Pre-fill the selected node
            const nodeSelect = elements.addMetricForm?.querySelector('select[name="nodeId"]');
            if (nodeSelect && selectedNodeId) {
              nodeSelect.value = selectedNodeId;
            }
          });
          buttonsContainer.appendChild(button);
        });
        
        metricsSection.appendChild(buttonsContainer);
      }
    }

    // Create a container for inputs and outputs to display them side by side
    const inputsOutputsContainer = document.createElement("div");
    inputsOutputsContainer.classList.add("detail-section");
    inputsOutputsContainer.setAttribute("data-section-type", "inputs-outputs");
    
    const inputsSection = buildRelationList("Inputs", node.inputs, "from");
    const outputsSection = buildRelationList("Outputs", node.outputs, "to");
    
    inputsOutputsContainer.appendChild(inputsSection);
    inputsOutputsContainer.appendChild(outputsSection);
    
    container.appendChild(inputsOutputsContainer);

    elements.detailPanel.appendChild(container);

    const toggleButton = document.createElement("button");

    toggleButton.type = "button";

    toggleButton.classList.add("detail-toggle");

    toggleButton.dataset.action = "toggle-detail";

    const isExpanded = elements.detailPanel.classList.contains("expanded");

    toggleButton.textContent = isExpanded ? "Show less" : "Show more";

    elements.detailPanel.appendChild(toggleButton);

    elements.detailPanel.classList.add("active");

  };

  const buildRelationList = (title, relations, key) => {

    const section = document.createElement("section");

    // Don't add detail-section class here since it will be added by the parent container

    const heading = document.createElement("h3");

    heading.textContent = title;

    section.appendChild(heading);

    if (!relations || relations.length === 0) {

      const empty = document.createElement("p");

      empty.classList.add("detail-empty");

      empty.textContent = "No relations";

      section.appendChild(empty);

      return section;

    }

    const list = document.createElement("ul");

    list.classList.add("detail-relations");

    relations.forEach((relation) => {

      const relatedNode = relation[key] ? OrgStore.getNode(relation[key]) : null;

      const li = document.createElement("li");

      li.classList.add("detail-relation-item");

      if (relatedNode) {

        const button = document.createElement("button");

        button.type = "button";

        button.classList.add("relation-link");

        button.dataset.action = "jump";

        button.dataset.nodeId = relatedNode.id;

        button.textContent = relatedNode.name;

        li.appendChild(button);

      } else {

        const span = document.createElement("span");

        span.textContent = relation[key] || "Unknown node";

        li.appendChild(span);

      }

      if (relation.desc) {

        const desc = document.createElement("span");

        desc.classList.add("relation-desc");

        desc.textContent = " → " + relation.desc;

        li.appendChild(desc);

      }

      list.appendChild(li);

    });

    section.appendChild(list);

    return section;

  };

  const handleDetailPanelClick = (event) => {

    const target = event.target;

    if (!(target instanceof HTMLElement)) {

      return;

    }

    const action = target.dataset.action;

    if (action === "close-panel") {

      selectedNodeId = null;

      renderDetailPanel();

      renderOrgChart();

      return;

    }

    if (action === "toggle-detail") {

      const isExpanded = elements.detailPanel.classList.toggle("expanded");

      document.body.classList.toggle("detail-expanded", isExpanded);

      target.textContent = isExpanded ? "Show less" : "Show more";

      // Sync panel heights when detail panel expands/collapses
      syncPanelHeights();

      if (typeof OrgMap !== "undefined" && OrgMap && typeof OrgMap.refresh === "function") {
        // Preserve focus on selected node when detail panel expands/collapses
        const currentSelectedNode = selectedNodeId;
        requestAnimationFrame(() => {
          OrgMap.refresh();
          // Restore focus to the selected node after refresh
          if (currentSelectedNode && typeof OrgMap.reveal === "function") {
            setTimeout(() => {
              OrgMap.reveal(currentSelectedNode);
            }, 100);
          }
        });
      }

      return;

    }

    if (action === "jump") {

      const nodeId = target.dataset.nodeId;

      if (nodeId) {

        openNode(nodeId);
        
        // If we're in map view, ensure proper focus for support offices
        if (typeof OrgMap !== "undefined" && OrgMap && typeof OrgMap.reveal === "function") {
          setTimeout(() => {
            OrgMap.reveal(nodeId);
          }, 100);
        }

      }

    }

  };

  const renderRelationView = () => {

    if (!elements.relationView) {

      return;

    }

    const relations = OrgStore.getRelations();

    elements.relationView.innerHTML = "";

    if (!relations.length) {

      elements.relationView.innerHTML = '<p class="empty-state">No relations to show yet.</p>';

      return;

    }

    relations

      .map((relation) => ({

        from: OrgStore.getNode(relation.from),

        to: OrgStore.getNode(relation.to),

        desc: relation.desc

      }))

      .filter((relation) => relation.from && relation.to)

      .forEach((relation) => {

        const card = document.createElement("div");

        card.classList.add("relation-card");

        const fromButton = document.createElement("button");

        fromButton.type = "button";

        fromButton.classList.add("relation-node");

        fromButton.dataset.nodeId = relation.from.id;

        fromButton.dataset.action = "select";

        fromButton.textContent = relation.from.name;

        card.appendChild(fromButton);

        const arrow = document.createElement("span");

        arrow.classList.add("relation-arrow");

        arrow.textContent = "\u2192";

        card.appendChild(arrow);

        const toButton = document.createElement("button");

        toButton.type = "button";

        toButton.classList.add("relation-node");

        toButton.dataset.nodeId = relation.to.id;

        toButton.dataset.action = "select";

        toButton.textContent = relation.to.name;

        card.appendChild(toButton);

        if (relation.desc) {

          const desc = document.createElement("span");

          desc.classList.add("relation-card-desc");

          desc.textContent = relation.desc;

          card.appendChild(desc);

        }

        elements.relationView.appendChild(card);

      });

    elements.relationView.querySelectorAll("button[data-node-id]").forEach((button) => {

      button.addEventListener("click", () => {

        const nodeId = button.dataset.nodeId;

        if (nodeId) {

          openNode(nodeId);

        }

      });

    });

  };

  const updateAdminButtonText = (isAdminOpen) => {
    const adminTextElement = elements.toggleAdmin?.querySelector('.admin-text');
    const adminIconElement = elements.toggleAdmin?.querySelector('.admin-icon');
    
    if (adminTextElement) {
      if (isAdminOpen) {
        adminTextElement.textContent = 'User Mode';
        if (adminIconElement) {
          adminIconElement.textContent = '👤';
        }
      } else {
        adminTextElement.textContent = 'Admin';
        if (adminIconElement) {
          adminIconElement.textContent = '⚙️';
        }
      }
    }
  };

  const syncPanelHeights = () => {
    const detailPanel = elements.detailPanel;
    const orgSection = document.querySelector('.org-section');
    const treeContainer = document.querySelector('.tree-container');
    const mapView = document.querySelector('.map-view');
    
    if (!detailPanel || !orgSection) {
      return;
    }

    // Wait for layout to update, then sync heights
    requestAnimationFrame(() => {
      if (document.body.classList.contains("detail-expanded")) {
        // Detail panel is expanded - sync heights
        const detailHeight = detailPanel.offsetHeight;
        
        if (detailHeight > 0) {
          // Set org-section to match detail panel height
          orgSection.style.height = `${detailHeight}px`;
          
          // Update tree-container and map-view to fill the height
          if (treeContainer) {
            treeContainer.style.height = '100%';
            treeContainer.style.minHeight = '100%';
          }
          
          if (mapView) {
            mapView.style.height = '100%';
            mapView.style.minHeight = '100%';
            
            // Trigger map resize to adjust to new container size
            if (typeof OrgMap !== "undefined" && OrgMap && typeof OrgMap.refresh === "function") {
              setTimeout(() => {
                OrgMap.refresh();
                // Restore focus to selected node after resize
                if (selectedNodeId && typeof OrgMap.reveal === "function") {
                  setTimeout(() => {
                    OrgMap.reveal(selectedNodeId);
                  }, 100);
                }
              }, 50);
            }
          }
        }
      } else {
        // Detail panel is collapsed - reset heights
        orgSection.style.height = '';
        if (treeContainer) {
          treeContainer.style.height = '';
          treeContainer.style.minHeight = '';
        }
        if (mapView) {
          mapView.style.height = '';
          mapView.style.minHeight = '';
          
          // Trigger map resize when collapsing
          if (typeof OrgMap !== "undefined" && OrgMap && typeof OrgMap.refresh === "function") {
            setTimeout(() => {
              OrgMap.refresh();
              // Restore focus to selected node after resize
              if (selectedNodeId && typeof OrgMap.reveal === "function") {
                setTimeout(() => {
                  OrgMap.reveal(selectedNodeId);
                }, 100);
              }
            }, 50);
          }
        }
      }
    });
  };

  const setupDetailPanelResizeObserver = () => {
    if (!elements.detailPanel || !window.ResizeObserver) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      // Only sync if detail panel is expanded
      if (document.body.classList.contains("detail-expanded")) {
        syncPanelHeights();
      }
    });

    resizeObserver.observe(elements.detailPanel);
  };

  const displayCurrentMetrics = () => {
    if (!selectedNodeId) {
      return;
    }
    
    const node = OrgStore.getNode(selectedNodeId);
    if (!node) {
      return;
    }
    
    // Find or create metrics display area
    let metricsDisplay = document.querySelector('.current-metrics-display');
    if (!metricsDisplay) {
      metricsDisplay = document.createElement('div');
      metricsDisplay.className = 'current-metrics-display';
      metricsDisplay.style.cssText = `
        margin-bottom: 1rem;
        padding: 1rem;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
      `;
      
      // Insert before the first form in metrics panel
      const metricsPanel = document.querySelector('#adminPanel-metrics');
      if (metricsPanel) {
        const firstForm = metricsPanel.querySelector('form');
        if (firstForm) {
          metricsPanel.insertBefore(metricsDisplay, firstForm);
        } else {
          metricsPanel.appendChild(metricsDisplay);
        }
      }
    }
    
    // Clear and populate metrics display
    metricsDisplay.innerHTML = '';
    
    const title = document.createElement('h4');
    title.textContent = `Current Metrics for "${node.name}"`;
    title.style.cssText = 'margin: 0 0 0.75rem 0; color: var(--brand-orange); font-size: 1rem;';
    metricsDisplay.appendChild(title);
    
    if (!node.metrics || node.metrics.length === 0) {
      const noMetrics = document.createElement('p');
      noMetrics.textContent = 'No metrics defined for this node.';
      noMetrics.style.cssText = 'margin: 0; color: var(--muted); font-style: italic;';
      metricsDisplay.appendChild(noMetrics);
    } else {
      const metricsList = document.createElement('div');
      metricsList.style.cssText = 'display: flex; flex-direction: column; gap: 0.5rem;';
      
      node.metrics.forEach((metric, index) => {
        const metricItem = document.createElement('div');
        metricItem.style.cssText = `
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: rgba(255, 90, 0, 0.05);
          border-radius: 4px;
          border-left: 3px solid var(--brand-orange);
        `;
        
        const metricInfo = document.createElement('div');
        let valuesText = '';
        if (metric.values && metric.values.length > 0) {
          valuesText = metric.values.map(v => `${v.label}: ${v.value}${metric.unit || ''}`).join(', ');
        } else if (metric.value !== undefined) {
          // Backward compatibility for old single-value metrics
          valuesText = `${metric.value} ${metric.unit || ''}`;
        }
        
        metricInfo.innerHTML = `
          <strong>${metric.name}</strong><br>
          <span style="color: var(--muted); font-size: 0.9rem;">
            ${valuesText}
          </span><br>
          <span style="color: var(--brand-orange); font-size: 0.8rem; font-weight: 500;">
            ${metric.chartType ? metric.chartType.toUpperCase() + ' CHART' : 'PIE CHART'}
          </span>
        `;
        
        const metricActions = document.createElement('div');
        metricActions.style.cssText = 'display: flex; gap: 0.5rem;';
        
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.type = 'button';
        editBtn.className = 'secondary';
        editBtn.style.cssText = 'font-size: 0.8rem; padding: 0.25rem 0.5rem;';
        editBtn.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          
          console.log('Edit button clicked for metric:', metric);
          
          // Pre-fill the add form with this metric for editing
          const addForm = elements.addMetricForm;
          console.log('Add form found:', !!addForm);
          
          if (addForm) {
            // Clear existing value inputs
            const valuesList = document.getElementById('valuesList');
            if (valuesList) {
              valuesList.innerHTML = '';
            }
            
            // Fill in the form with existing metric data
            addForm.querySelector('select[name="nodeId"]').value = selectedNodeId;
            addForm.querySelector('input[name="metricName"]').value = metric.name;
            addForm.querySelector('input[name="metricUnit"]').value = metric.unit || '';
            addForm.querySelector('select[name="metricChartType"]').value = metric.chartType || 'pie';
            addForm.querySelector('textarea[name="metricDescription"]').value = metric.description || '';
            
            // Show values container and populate with existing values
            const chartType = metric.chartType || 'pie';
            const valuesContainer = document.getElementById('valuesContainer');
            
            if (['pie', 'doughnut', 'bar', 'line'].includes(chartType)) {
              valuesContainer.style.display = 'block';
              
              // Create value input function locally if not available globally
              const createValueInput = (idx = 0, label = '', value = '') => {
                const valueRow = document.createElement('div');
                valueRow.className = 'value-input-row';
                valueRow.style.cssText = 'display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center;';
                
                valueRow.innerHTML = `
                  <input type="text" name="valueLabel_${idx}" placeholder="Label (e.g., Q1, Sales, etc.)" value="${label}" style="flex: 1;" />
                  <input type="number" name="valueValue_${idx}" step="0.01" placeholder="0" value="${value}" style="flex: 1;" />
                  <button type="button" class="remove-value-btn" style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">×</button>
                `;
                
                // Add remove functionality
                const removeBtn = valueRow.querySelector('.remove-value-btn');
                removeBtn.addEventListener('click', () => {
                  valueRow.remove();
                });
                
                return valueRow;
              };
              
              // Add existing values
              console.log('Metric data for editing:', metric);
              console.log('Metric values:', metric.values);
              console.log('Metric value (single):', metric.value);
              console.log('Metric data (old format):', metric.data);
              
              if (metric.values && Array.isArray(metric.values) && metric.values.length > 0) {
                console.log('Using new values format');
                metric.values.forEach((valueData, idx) => {
                  console.log(`Adding value ${idx}:`, valueData);
                  const valueRow = createValueInput(idx, valueData.label || '', valueData.value || '');
                  valuesList.appendChild(valueRow);
                });
              } else if (metric.data && typeof metric.data === 'object') {
                console.log('Using old data format');
                let idx = 0;
                Object.entries(metric.data).forEach(([label, value]) => {
                  console.log(`Adding data ${idx}: ${label} = ${value}`);
                  const valueRow = createValueInput(idx, label, value);
                  valuesList.appendChild(valueRow);
                  idx++;
                });
              } else if (metric.value !== undefined) {
                console.log('Using single value format');
                // Backward compatibility for old single-value metrics
                const valueRow = createValueInput(0, metric.name || 'Value', metric.value);
                valuesList.appendChild(valueRow);
              } else {
                console.log('No existing values found, adding empty input');
                // Add one empty value input
                const valueRow = createValueInput(0);
                valuesList.appendChild(valueRow);
              }
            } else if (chartType === 'table') {
              valuesContainer.style.display = 'none';
            }
            
            // Switch to metrics tab to show the form
            setActiveAdminTab("metrics");
            
            // Store the metric to be edited globally for the form submission
            window.editingMetric = {
              originalIndex: index,
              nodeId: selectedNodeId,
              metric: { ...metric }
            };
            
            // Change submit button text to "Save Metric"
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
              submitBtn.textContent = "Save Metric";
              submitBtn.style.backgroundColor = "#28a745"; // Green color for save
            }
            
            // Show success message with clear instructions
            displayAdminMessage(`Editing metric "${metric.name}". Make your changes and click "Save Metric" to update.`, "info");
            
            // Add a cancel button to the form
            const cancelBtn = document.createElement("button");
            cancelBtn.textContent = "Cancel Edit";
            cancelBtn.type = "button";
            cancelBtn.className = "secondary";
            cancelBtn.style.cssText = "margin-left: 1rem;";
            cancelBtn.addEventListener("click", () => {
              window.editingMetric = null;
              form.reset();
              // Reset submit button text
              if (submitBtn) {
                submitBtn.textContent = "Add Metric";
                submitBtn.style.backgroundColor = "";
              }
              displayAdminMessage("Edit cancelled.", "info");
            });
            
            // Add cancel button next to submit button
            if (submitBtn) {
              submitBtn.parentNode.insertBefore(cancelBtn, submitBtn.nextSibling);
            }
          }
        });
        
        metricActions.appendChild(editBtn);
        metricItem.appendChild(metricInfo);
        metricItem.appendChild(metricActions);
        metricsList.appendChild(metricItem);
      });
      
      metricsDisplay.appendChild(metricsList);
    }
  };

  const updateAdminTabsUI = () => {

    if (!elements.adminTabs || !elements.adminPanels) {

      return;

    }

    elements.adminTabs.forEach((button) => {

      const tab = button.dataset.adminTab;

      const isActive = tab === activeAdminTab;

      button.setAttribute("aria-selected", String(isActive));

      button.classList.toggle("is-active", isActive);

      button.tabIndex = isActive ? 0 : -1;

    });

    elements.adminPanels.forEach((panel) => {

      const panelTab = panel.dataset.adminPanel;

      const isActive = panelTab === activeAdminTab;

      panel.hidden = !isActive;

      panel.setAttribute("aria-hidden", String(!isActive));

    });

  };

  const setActiveAdminTab = (tab) => {

    if (!tab) {

      return;

    }

    if (activeAdminTab === tab) {

      updateAdminTabsUI();

      return;

    }

    activeAdminTab = tab;

    updateAdminTabsUI();

    // Update dropdowns when switching to Relations or Metrics tabs
    if (tab === "relations" || tab === "metrics") {
      updateFormDropdownsWithSelectedNode();
    }
    
    // Show current metrics when switching to Metrics tab
    if (tab === "metrics") {
      displayCurrentMetrics();
    }

  };

  const toggleAdminPanel = () => {

    if (!elements.adminPanel || !elements.detailPanel) {

      return;

    }

    const willOpen = !elements.adminPanel.classList.contains("open");

    // Toggle admin panel visibility
    elements.adminPanel.classList.toggle("open", willOpen);

    // Hide/show detail panel based on admin mode
    if (willOpen) {
      // Admin mode ON: hide detail panel
      elements.detailPanel.style.display = "none";
    } else {
      // Admin mode OFF: show detail panel (restore original flex display)
      elements.detailPanel.style.display = "flex";
    }

    if (elements.toggleAdmin) {

      elements.toggleAdmin.classList.toggle("active", willOpen);

      elements.toggleAdmin.setAttribute("aria-pressed", String(willOpen));
      
      // Update button text based on admin state
      updateAdminButtonText(willOpen);

    }

    if (willOpen) {

      updateAdminTabsUI();

    } else {

      // When admin panel closes, refresh detail panel to remove admin buttons
      if (selectedNodeId) {
        renderDetailPanel();
      }

    }

  };

  const refreshAdminPanel = () => {

    if (!elements.adminPanel) {

      return;

    }

    populateNodeOptions(elements.adminParentSelect, { includeEmpty: true });

    populateNodeOptions(elements.editNodeSelect, { includeEmpty: true });

    populateNodeOptions(elements.editParentSelect, { includeEmpty: true });

    populateNodeOptions(elements.addRelationForm?.querySelector("select[name='from']"), { includeEmpty: true });

    populateNodeOptions(elements.addRelationForm?.querySelector("select[name='to']"), { includeEmpty: true });

    populateNodeOptions(elements.removeRelationForm?.querySelector("select[name='from']"), { includeEmpty: true });

    populateNodeOptions(elements.removeRelationForm?.querySelector("select[name='to']"), { includeEmpty: true });

    populateEditForm();

    populateMetricsOptions();

    updateAdminTabsUI();

  };

  const populateNodeOptions = (selectElement, { includeEmpty } = {}) => {

    if (!selectElement) {

      return;

    }

    const previousValue = selectElement.value;

    selectElement.innerHTML = "";

    if (includeEmpty) {

      const option = document.createElement("option");

      option.value = "";

      option.textContent = "→";

      selectElement.appendChild(option);

    }

    const nodes = OrgStore.getAll().sort((a, b) => a.name.localeCompare(b.name, "sv"));

    nodes.forEach((node) => {

      const option = document.createElement("option");

      option.value = node.id;

            option.textContent = node.name + " (" + node.type + ")";

      selectElement.appendChild(option);

    });

    if (previousValue) {

      selectElement.value = previousValue;

    }

  };

  const populateMetricsOptions = () => {
    // Populate node dropdowns for Add Metric form
    const nodeSelect = elements.addMetricForm?.querySelector('select[name="nodeId"]');
    if (nodeSelect) {
      populateNodeOptions(nodeSelect, { includeEmpty: true });
      nodeSelect.querySelector('option[value=""]').textContent = "Select a node...";
    }
    
    // Populate node dropdown for Remove Metric form
    const removeNodeSelect = elements.removeMetricForm?.querySelector('select[name="removeNodeId"]');
    if (removeNodeSelect) {
      populateNodeOptions(removeNodeSelect, { includeEmpty: true });
      removeNodeSelect.querySelector('option[value=""]').textContent = "Select a node...";
    }
  };

  const updateMetricsOptions = (nodeId) => {
    // Update metrics dropdown when node is selected in Remove Metric form
    const metricSelect = elements.removeMetricForm?.querySelector('select[name="metricToRemove"]');
    if (!metricSelect || !nodeId) {
      return;
    }
    
    const node = OrgStore.getNode(nodeId);
    
    metricSelect.innerHTML = "";
    
    if (!node || !node.metrics || node.metrics.length === 0) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No metrics found";
      metricSelect.appendChild(option);
      return;
    }
    
    // Add empty option
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "Select a metric...";
    metricSelect.appendChild(emptyOption);
    
    // Add metric options
    node.metrics.forEach((metric, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = `${metric.name}: ${metric.value} ${metric.unit}`;
      metricSelect.appendChild(option);
    });
  };

  const updateFormDropdownsWithSelectedNode = () => {
    // Update Relations form dropdowns
    if (elements.addRelationForm) {
      const fromSelect = elements.addRelationForm.querySelector('select[name="from"]');
      const toSelect = elements.addRelationForm.querySelector('select[name="to"]');
      
      if (fromSelect && selectedNodeId) {
        fromSelect.value = selectedNodeId;
      }
    }
    
    if (elements.removeRelationForm) {
      const fromSelect = elements.removeRelationForm.querySelector('select[name="from"]');
      const toSelect = elements.removeRelationForm.querySelector('select[name="to"]');
      
      if (fromSelect && selectedNodeId) {
        fromSelect.value = selectedNodeId;
      }
    }
    
    // Update Metrics form dropdowns
    if (elements.addMetricForm) {
      const nodeSelect = elements.addMetricForm.querySelector('select[name="nodeId"]');
      
      if (nodeSelect && selectedNodeId) {
        nodeSelect.value = selectedNodeId;
      }
    }
    
    if (elements.removeMetricForm) {
      const nodeSelect = elements.removeMetricForm.querySelector('select[name="removeNodeId"]');
      
      if (nodeSelect && selectedNodeId) {
        nodeSelect.value = selectedNodeId;
        // Also update the metrics dropdown
        updateMetricsOptions(selectedNodeId);
      }
    }
  };

  const populateEditForm = () => {

    if (!elements.editForm || !elements.editNodeSelect) {

      return;

    }

    const nodeId = elements.editNodeSelect.value;

    const nameInput = elements.editForm.querySelector("input[name='name']");

    const typeSelect = elements.editTypeSelect || elements.editForm.querySelector("select[name='type']");

    const roleInput = elements.editForm.querySelector("textarea[name='role']");

    const responsibilitiesInput = elements.editResponsibilities || elements.editForm.querySelector("textarea[name='responsibilities']");


    const outcomesInput = elements.editOutcomes || elements.editForm.querySelector("textarea[name='outcomes']");

    const supportOfficeInput = elements.editSupportOffice || elements.editForm.querySelector("input[name='supportOffice']");

    if (!nodeId) {

      if (nameInput) nameInput.value = "";

      if (typeSelect) typeSelect.value = "Unit";

      if (roleInput) roleInput.value = "";

      if (responsibilitiesInput) responsibilitiesInput.value = "";


      if (outcomesInput) outcomesInput.value = "";

      if (supportOfficeInput) supportOfficeInput.value = "";

      if (elements.editParentSelect) {

        elements.editParentSelect.value = "";

      }


      return;

    }

    const node = OrgStore.getNode(nodeId);

    if (!node) {

      displayAdminMessage("Kunde inte hitta vald nod.", "error");

      return;

    }

    if (nameInput) nameInput.value = node.name;

    if (typeSelect) {

      const typeValue = node.type || "Unit";

      if (typeSelect && !Array.from(typeSelect.options).some((option) => option.value === typeValue)) {

        const option = document.createElement("option");

        option.value = typeValue;

        option.textContent = typeValue;

        typeSelect.appendChild(option);

      }

      typeSelect.value = typeValue;

    }

    if (roleInput) roleInput.value = node.role || "";

    if (responsibilitiesInput) responsibilitiesInput.value = formatMultiline(node.responsibilities);


    if (outcomesInput) outcomesInput.value = formatMultiline(node.outcomes);

    if (supportOfficeInput) supportOfficeInput.value = node.supportOffice || "";

    if (elements.editParentSelect) {

      elements.editParentSelect.value = node.parent || "";

    }


    // Clear visualization type, name and unit for new metrics
    if (elements.visualizationTypeSelect) {
      elements.visualizationTypeSelect.value = "";
    }
    if (elements.visualizationNameInput) {
      elements.visualizationNameInput.value = "";
    }
    if (elements.visualizationUnitInput) {
      elements.visualizationUnitInput.value = "";
    }


  };

  const handleCreateNode = (event) => {

    event.preventDefault();

    const form = event.currentTarget;

    const data = new FormData(form);

    const id = (data.get("id") || "").trim();

    const name = (data.get("name") || "").trim();

    const type = (data.get("type") || "Unit").trim() || "Unit";

    const parent = data.get("parent") || null;

    const role = data.get("role") || "";

    const supportOffice = (data.get("supportOffice") || "").trim() || null;

    const responsibilities = parseMultiline(data.get("responsibilities"));


    const outcomes = parseMultiline(data.get("outcomes"));

    if (!id || !name) {

      displayAdminMessage("ID and name must be specified for a new node.", "error");

      return;

    }

    try {

      OrgStore.addNode({ id, name, type, parent, role, supportOffice, responsibilities, outcomes });

      form.reset();

      if (elements.createTypeSelect) {

        elements.createTypeSelect.value = "Unit";

      }

      if (elements.createSupportOffice) {

        elements.createSupportOffice.value = "";

      }

      displayAdminMessage("Node " + name + " created.", "success");

    } catch (error) {

      displayAdminMessage(error.message, "error");

    }

  };

  const handleEditNode = (event) => {

    event.preventDefault();

    const form = event.currentTarget;

    const data = new FormData(form);

    const id = data.get("nodeId");

    if (!id) {

      displayAdminMessage("Select a node to update.", "error");

      return;

    }

    const nameValue = (data.get("name") || "").trim();

    const updates = {

      name: nameValue || undefined,

      type: (data.get("type") || "").trim() || undefined,

      role: typeof data.get("role") === "string" ? data.get("role") : undefined,

      parent: data.get("parent") || null,

      supportOffice: (data.get("supportOffice") || "").trim(),

      responsibilities: parseMultiline(data.get("responsibilities")),


      outcomes: parseMultiline(data.get("outcomes"))

    };

    try {

      OrgStore.updateNode(id, updates);

      displayAdminMessage("Node updated.", "success");

      openNode(id);

    } catch (error) {

      displayAdminMessage(error.message, "error");

    }

  };

  const handleAddRelation = (event) => {

    event.preventDefault();

    const form = event.currentTarget;

    const data = new FormData(form);

    const from = data.get("from");

    const to = data.get("to");

    const desc = data.get("desc") || "";

    if (!from || !to) {

      displayAdminMessage("Select both from and to nodes.", "error");

      return;

    }

    if (from === to) {

      displayAdminMessage("Relations must go between two different nodes.", "error");

      return;

    }

    try {

      OrgStore.addLink({ from, to, desc });

      form.reset();

      displayAdminMessage("Relation added.", "success");

    } catch (error) {

      displayAdminMessage(error.message, "error");

    }

  };

  const handleRemoveRelation = (event) => {

    event.preventDefault();

    const form = event.currentTarget;

    const data = new FormData(form);

    const from = data.get("from");

    const to = data.get("to");

    if (!from || !to) {

      displayAdminMessage("Select both from and to nodes to remove the relation.", "error");

      return;

    }

    try {

      OrgStore.removeLink({ from, to });

      displayAdminMessage("Relation removed.", "success");

    } catch (error) {

      displayAdminMessage(error.message, "error");

    }

  };

  const handleAddMetric = (event) => {
    event.preventDefault();
    
    const form = event.currentTarget;
    const data = new FormData(form);
    
    const nodeId = data.get("nodeId");
    const metricName = data.get("metricName");
    const metricUnit = data.get("metricUnit") || "";
    const metricChartType = data.get("metricChartType") || "pie";
    const metricDescription = data.get("metricDescription") || "";
    
    // Collect all value inputs
    const values = [];
    const valueInputs = form.querySelectorAll('.value-input-row');
    valueInputs.forEach((row, index) => {
      const labelInput = row.querySelector(`input[name="valueLabel_${index}"]`);
      const valueInput = row.querySelector(`input[name="valueValue_${index}"]`);
      if (labelInput && valueInput && labelInput.value.trim() && valueInput.value.trim()) {
        values.push({
          label: labelInput.value.trim(),
          value: parseFloat(valueInput.value)
        });
      }
    });
    
    if (!nodeId || !metricName || !metricChartType) {
      displayAdminMessage("Please fill in all required fields (Node, Metric Name, Chart Type).", "error");
      return;
    }
    
    // Only require values for chart types that need numerical values
    if (['pie', 'doughnut', 'bar', 'line'].includes(metricChartType) && values.length === 0) {
      displayAdminMessage("Please provide at least one data point for this chart type.", "error");
      return;
    }
    
    try {
      // Get current node data
      const node = OrgStore.getNode(nodeId);
      
      if (!node) {
        displayAdminMessage("Selected node not found.", "error");
        return;
      }
      
      // Add metric to node
      const newMetric = {
        name: metricName,
        values: values,
        unit: metricUnit,
        chartType: metricChartType,
        description: metricDescription
      };
      
      // Check if we're editing an existing metric
      let updatedMetrics;
      if (window.editingMetric && window.editingMetric.nodeId === nodeId) {
        // Replace the existing metric
        updatedMetrics = [...(node.metrics || [])];
        updatedMetrics[window.editingMetric.originalIndex] = newMetric;
        
        // Clear the editing state
        window.editingMetric = null;
        
        displayAdminMessage("Metric updated successfully.", "success");
      } else {
        // Add new metric
        updatedMetrics = [...(node.metrics || []), newMetric];
        displayAdminMessage("Metric added successfully.", "success");
      }
      
      OrgStore.updateNode(nodeId, { metrics: updatedMetrics });
      
      // Reset submit button text if we were editing
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = "Add Metric";
        submitBtn.style.backgroundColor = "";
      }
      
      form.reset();
      
      // Update current metrics display
      displayCurrentMetrics();
      
    } catch (error) {
      displayAdminMessage("Failed to add metric: " + error.message, "error");
    }
  };

  const handleRemoveMetric = (event) => {
    event.preventDefault();
    
    const form = event.currentTarget;
    const data = new FormData(form);
    
    const nodeId = data.get("removeNodeId");
    const metricToRemove = data.get("metricToRemove");
    
    if (!nodeId || !metricToRemove) {
      displayAdminMessage("Please select both node and metric to remove.", "error");
      return;
    }
    
    try {
      // Get current node data
      const node = OrgStore.getNode(nodeId);
      
      if (!node || !node.metrics) {
        displayAdminMessage("Selected node or metric not found.", "error");
        return;
      }
      
      // Remove metric from node
      const updatedMetrics = node.metrics.filter((_, index) => index.toString() !== metricToRemove);
      OrgStore.updateNode(nodeId, { metrics: updatedMetrics });
      
      displayAdminMessage("Metric removed successfully.", "success");
      
      // Update current metrics display
      displayCurrentMetrics();
      
    } catch (error) {
      displayAdminMessage("Failed to remove metric: " + error.message, "error");
    }
  };

  const handleDeleteNode = (event) => {

    event.preventDefault();

    if (!elements.editNodeSelect || !elements.editNodeSelect.value) {

      displayAdminMessage("Select a node to delete.", "error");

      return;

    }

    const nodeId = elements.editNodeSelect.value;

    const node = OrgStore.getNode(nodeId);

    if (!node) {

      displayAdminMessage("Noden hittades inte.", "error");

      return;

    }

        const confirmed = window.confirm("Are you sure you want to delete " + node.name + "?");

    if (!confirmed) {

      return;

    }

    try {

      OrgStore.removeNode(nodeId);

      if (selectedNodeId === nodeId) {

        selectedNodeId = null;

      }

      displayAdminMessage("Node deleted.", "success");

      elements.editNodeSelect.value = "";

      populateEditForm();

      renderDetailPanel();

    } catch (error) {

      displayAdminMessage(error.message, "error");

    }

  };













  function buildMetricsSection(node) {

    const section = document.createElement("section");

    section.classList.add("detail-section", "detail-metrics");

    const heading = document.createElement("h3");

    heading.textContent = "Metrics";

    section.appendChild(heading);

    const body = document.createElement("div");

    body.classList.add("detail-metrics-body");

    section.appendChild(body);

    const metrics = node.metrics || [];

    if (!metrics.length) {

      const empty = document.createElement("p");

      empty.classList.add("detail-empty");

      empty.textContent = "Inga metrics definierade ännu.";

      body.appendChild(empty);

      // Admin chart buttons are now added in renderDetailPanel

      return section;

    }

    // Create a container for each metric
    metrics.forEach((metric, index) => {
      const metricContainer = document.createElement("div");
      metricContainer.classList.add("metric-container");
      
      const metricHeading = document.createElement("h4");
      metricHeading.textContent = metric.name || "Time spent on:";
      metricContainer.appendChild(metricHeading);

      const chartContainer = document.createElement("div");
      chartContainer.classList.add("detail-metrics-chart");
      metricContainer.appendChild(chartContainer);

      // Handle both new multi-value format and old single-value format
      let entries = [];
      if (metric.values && Array.isArray(metric.values)) {
        // New multi-value format
        entries = metric.values
          .filter(v => v.label && !isNaN(v.value))
          .map(v => ({ key: v.label, value: Number(v.value) || 0 }));
      } else if (metric.value !== undefined) {
        // Old single-value format - create a single entry
        entries = [{ key: metric.name || "Value", value: Number(metric.value) || 0 }];
      } else if (metric.data) {
        // Legacy data format
        entries = Object.entries(metric.data || {})
          .map(([key, value]) => ({ key, value: Number(value) || 0 }))
          .filter((entry) => entry.value > 0);
      }

      if (entries.length > 0) {
        const total = entries.reduce((sum, entry) => sum + entry.value, 0);
        console.log('Rendering metric:', metric.name, 'entries:', entries, 'total:', total);

        const legend = document.createElement("ul");
        legend.classList.add("detail-metrics-legend");

        entries.forEach((entry) => {
          const item = document.createElement("li");

          const swatch = document.createElement("span");
          swatch.classList.add("detail-metrics-swatch");
          swatch.style.backgroundColor = getMetricColor(entry.key);

          const label = document.createElement("span");
          label.textContent = entry.key;

          const value = document.createElement("span");
          value.classList.add("detail-metrics-value");

          const unit = metric.unit || "%";
          const percent = total > 0 ? Math.round((entry.value / total) * 100) : 0;
          value.textContent = entry.value + " " + unit + " (" + percent + "%)";

          item.appendChild(swatch);
          item.appendChild(label);
          item.appendChild(value);
          legend.appendChild(item);
        });

        metricContainer.appendChild(legend);

        requestAnimationFrame(() => {
          if (typeof ChartRenderer !== "undefined") {
            console.log('Calling ChartRenderer.renderChart with:', entries, total, metric.chartType);
            ChartRenderer.renderChart(chartContainer, entries, total, metric.chartType || "pie", metric.name || "Time spent on:", metric.unit || "%");
          } else {
            console.log('ChartRenderer not available, using fallback');
            renderMetricsChart(chartContainer, entries, total);
          }
        });
      } else {
        console.log('No entries found for metric:', metric.name, 'metric:', metric);
        chartContainer.innerHTML = '<p class="chart-empty">No data available</p>';
      }

      body.appendChild(metricContainer);
    });

    // Admin chart buttons are now added in renderDetailPanel

    return section;

  }

  function renderMetricsChart(container, entries, total) {

    if (!container) {

      return;

    }

    // Use new ChartRenderer if available, otherwise fallback to old implementation
    if (typeof ChartRenderer !== "undefined") {
      ChartRenderer.renderChart(container, entries, total, "pie", "Time spent on:", "%");
      return;
    }

    if (typeof d3 === "undefined" || !d3.pie) {

      container.textContent = "Enable D3.js to show the diagram.";

      return;

    }

    const width = container.clientWidth || 240;

    const height = container.clientHeight || 240;

    const size = Math.max(Math.min(width, height), 200);

    const radius = size / 2;

    const root = d3.select(container);

    root.selectAll("*").remove();

    const svg = root

      .append("svg")

      .attr("viewBox", "0 0 " + size + " " + size)

      .attr("preserveAspectRatio", "xMidYMid meet");

    const group = svg

      .append("g")

      .attr("transform", "translate(" + (size / 2) + ", " + (size / 2) + ")");

    const pie = d3.pie().sort(null).value((d) => d.value);

    const arc = d3.arc().innerRadius(radius * 0.45).outerRadius(radius * 0.85);

    group

      .selectAll("path")

      .data(pie(entries))

      .enter()

      .append("path")

      .attr("d", arc)

      .attr("fill", (d) => getMetricColor(d.data.key))

      .attr("stroke", "#fff")

      .attr("stroke-width", 2);

    if (total > 0) {

      group

        .append("text")

        .attr("class", "detail-metrics-total")

        .attr("text-anchor", "middle")

        .attr("dy", "0.35em")

        .text("100%");

    }

  };

  const handleClearData = () => {
    if (!confirm("Are you sure you want to reset all changes and return to the original data? This cannot be undone.")) {
      return;
    }

    try {
      OrgStore.clearSavedData();
      displayAdminMessage("Data reset to original. Reloading...", "success");
      
      // Reload the page after a short delay to show the message
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      displayAdminMessage("Failed to reset data: " + error.message, "error");
    }
  };

  const handleTestStorage = () => {
    try {
      const result = OrgStore.testLocalStorage();
      if (result) {
        displayAdminMessage("localStorage test: PASSED ✓", "success");
      } else {
        displayAdminMessage("localStorage test: FAILED ✗", "error");
      }
    } catch (error) {
      displayAdminMessage("localStorage test error: " + error.message, "error");
    }
  };

  const displayAdminMessage = (message, type) => {

    if (!elements.adminMessage) {

      return;

    }

    elements.adminMessage.textContent = message;

    elements.adminMessage.className = "admin-message";

    if (type) {

      elements.adminMessage.classList.add(type);

    }

  };

  return {

    init,

    openNode,

    getSelectedNodeId: () => selectedNodeId

  };

})();

window.OrgUI = OrgUI;
