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

    metricsSection: null,

    metricsList: null,

    metricsAddButton: null,

    metricsCreateButton: null,

    metricsSaveButton: null,

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

    elements.metricsSection = document.getElementById("adminMetricsSection");

    elements.metricsList = document.getElementById("adminMetricsList");

    elements.metricsAddButton = document.getElementById("adminAddMetricButton");

    elements.metricsCreateButton = document.getElementById("adminCreatePieButton");

    elements.metricsSaveButton = document.getElementById("adminSaveMetricsButton");

    elements.visualizationTypeSelect = document.getElementById("adminVisualizationType");

    elements.visualizationNameInput = document.getElementById("adminVisualizationName");

    elements.visualizationUnitInput = document.getElementById("adminVisualizationUnit");

    elements.existingMetrics = document.getElementById("adminExistingMetrics");

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

    if (elements.metricsCreateButton) {

      elements.metricsCreateButton.addEventListener("click", handleCreatePieChart);

    }

    if (elements.metricsAddButton) {

      elements.metricsAddButton.addEventListener("click", handleAddMetricRow);

    }

    if (elements.metricsSaveButton) {

      elements.metricsSaveButton.addEventListener("click", handleSaveMetrics);

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

      if (typeof OrgMap !== "undefined" && OrgMap && typeof OrgMap.refresh === "function") {

        requestAnimationFrame(() => OrgMap.refresh());

      }

      return;

    }

    if (action === "jump") {

      const nodeId = target.dataset.nodeId;

      if (nodeId) {

        openNode(nodeId);

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

    }

    if (willOpen) {

      updateAdminTabsUI();

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
    
    const snapshot = OrgStore.getSnapshot();
    const node = snapshot.nodesById[nodeId];
    
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

      renderMetricsEditor(null);

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

    // Clear editing state when switching nodes
    if (elements.metricsList) {
      delete elements.metricsList.dataset.editingIndex;
    }
    if (elements.metricsSection) {
      elements.metricsSection.classList.remove("editing-metric");
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

    renderMetricsEditor(node);

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
    const metricValue = parseFloat(data.get("metricValue"));
    const metricUnit = data.get("metricUnit") || "";
    const metricDescription = data.get("metricDescription") || "";
    
    if (!nodeId || !metricName || isNaN(metricValue)) {
      displayAdminMessage("Please fill in all required fields (Node, Metric Name, Value).", "error");
      return;
    }
    
    try {
      // Get current node data
      const snapshot = OrgStore.getSnapshot();
      const node = snapshot.nodesById[nodeId];
      
      if (!node) {
        displayAdminMessage("Selected node not found.", "error");
        return;
      }
      
      // Add metric to node
      const newMetric = {
        name: metricName,
        value: metricValue,
        unit: metricUnit,
        description: metricDescription
      };
      
      // Update node with new metric
      const updatedMetrics = [...(node.metrics || []), newMetric];
      OrgStore.updateNode(nodeId, { metrics: updatedMetrics });
      
      form.reset();
      displayAdminMessage("Metric added successfully.", "success");
      
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
      const snapshot = OrgStore.getSnapshot();
      const node = snapshot.nodesById[nodeId];
      
      if (!node || !node.metrics) {
        displayAdminMessage("Selected node or metric not found.", "error");
        return;
      }
      
      // Remove metric from node
      const updatedMetrics = node.metrics.filter((_, index) => index.toString() !== metricToRemove);
      OrgStore.updateNode(nodeId, { metrics: updatedMetrics });
      
      displayAdminMessage("Metric removed successfully.", "success");
      
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

  const renderMetricsEditor = (node) => {

    if (!elements.metricsSection || !elements.metricsList) {

      return;

    }

    elements.metricsList.innerHTML = "";

    if (!node) {

      elements.metricsSection.classList.add("disabled");

      elements.metricsList.appendChild(createMetricsEmpty());

      return;

    }

    elements.metricsSection.classList.remove("disabled");

    // Clear existing metrics display
    if (elements.existingMetrics) {
      elements.existingMetrics.innerHTML = "";
    }

    const metrics = node.metrics || [];

    if (!metrics.length) {

      elements.metricsList.appendChild(createMetricsEmpty());

      return;

    }

    // Display existing metrics
    if (elements.existingMetrics) {
      const existingHeading = document.createElement("h5");
      existingHeading.textContent = "Befintliga Metrics:";
      existingHeading.style.marginBottom = "0.25rem";
      existingHeading.style.color = "var(--brand-orange)";
      elements.existingMetrics.appendChild(existingHeading);

      metrics.forEach((metric, index) => {
        const metricElement = document.createElement("div");
        metricElement.classList.add("existing-metric");

        const info = document.createElement("div");
        info.classList.add("existing-metric-info");

        const name = document.createElement("span");
        name.classList.add("existing-metric-name");
        name.textContent = metric.name || "Time spent on:";

        const type = document.createElement("span");
        type.classList.add("existing-metric-type");
        type.textContent = metric.type || "pie";

        const count = document.createElement("span");
        count.textContent = `(${Object.keys(metric.data || {}).length} items)`;

        info.appendChild(name);
        info.appendChild(type);
        info.appendChild(count);

        const actions = document.createElement("div");
        actions.classList.add("existing-metric-actions");

        const editBtn = document.createElement("button");
        editBtn.classList.add("edit-metric-btn");
        editBtn.textContent = "Edit";
        editBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log("Edit button clicked for metric:", metric, "index:", index);
          editExistingMetric(metric, index);
        };

        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-metric-btn");
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = () => deleteExistingMetric(index);

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        metricElement.appendChild(info);
        metricElement.appendChild(actions);

        elements.existingMetrics.appendChild(metricElement);
      });
    }

  };

  const editExistingMetric = (metric, index) => {
    console.log("editExistingMetric called with:", { metric, index });
    console.log("elements.editNodeSelect:", elements.editNodeSelect);
    console.log("elements.editNodeSelect.value:", elements.editNodeSelect?.value);
    
    // Check if we have a node selected
    if (!elements.editNodeSelect || !elements.editNodeSelect.value) {
      console.log("No node selected, showing error message");
      displayAdminMessage("Välj en nod först för att redigera metrics.", "error");
      return;
    }

    console.log("Node selected:", elements.editNodeSelect.value);

    // Populate the form with existing metric data
    if (elements.visualizationTypeSelect) {
      elements.visualizationTypeSelect.value = metric.type || "pie";
      console.log("Set visualization type to:", metric.type || "pie");
    }
    if (elements.visualizationNameInput) {
      elements.visualizationNameInput.value = metric.name || "Time spent on:";
      console.log("Set visualization name to:", metric.name || "Time spent on:");
    }
    if (elements.visualizationUnitInput) {
      elements.visualizationUnitInput.value = metric.unit || "%";
      console.log("Set visualization unit to:", metric.unit || "%");
    }

    // Clear current metrics list and populate with existing data
    if (elements.metricsList) {
      elements.metricsList.innerHTML = "";
      
      const entries = Object.entries(metric.data || {});
      console.log("Metric entries:", entries);
      
      entries.forEach(([key, value]) => {
        const row = createMetricRow(key, value);
        elements.metricsList.appendChild(row);
        console.log("Added metric row:", key, value);
      });

      // Store the index for updating
      elements.metricsList.dataset.editingIndex = index;
      console.log("Set editing index to:", index);
    }

    // Show Add Metric button
    if (elements.metricsAddButton) {
      elements.metricsAddButton.style.display = "inline-block";
      console.log("Show Add Metric button");
    }

    // Scroll to the metrics section
    if (elements.metricsSection) {
      elements.metricsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    displayAdminMessage("Redigerar metric. Ändra värdena och klicka på 'Save Metrics'.", "info");
    
    // Add visual indicator that we're in edit mode
    if (elements.metricsSection) {
      elements.metricsSection.classList.add("editing-metric");
    }
    
    console.log("Edit metric function completed successfully");
  };

  const deleteExistingMetric = (index) => {
    if (!confirm("Är du säker på att du vill ta bort denna metric?")) {
      return;
    }

    const nodeId = elements.editNodeSelect?.value;
    if (!nodeId) return;

    const node = OrgStore.getNode(nodeId);
    if (!node) return;

    const metrics = [...(node.metrics || [])];
    metrics.splice(index, 1);

    OrgStore.updateNode(nodeId, { metrics });

    displayAdminMessage("Metric deleted.", "success");

    const refreshedNode = OrgStore.getNode(nodeId);
    renderMetricsEditor(refreshedNode);

    if (selectedNodeId === nodeId) {
      renderDetailPanel();
    }
  };

  const handleCreatePieChart = () => {

    if (!elements.metricsList || !elements.metricsSection || elements.metricsSection.classList.contains("disabled")) {

      return;

    }

    const visualizationType = elements.visualizationTypeSelect?.value;

    const visualizationName = elements.visualizationNameInput?.value || "Time spent on:";

    if (!visualizationType) {

      displayAdminMessage("Välj en visualiseringstyp först.", "error");

      return;

    }

    removeMetricsEmpty();

    // Show Add Metric button when visualization is created
    if (elements.metricsAddButton) {

      elements.metricsAddButton.style.display = "inline-block";

    }

    let row = elements.metricsList.querySelector(".metrics-row");

    if (!row) {

      row = createMetricRow("", "");

      elements.metricsList.appendChild(row);

    }

    const keyInput = row.querySelector('input[name="metricKey"]');

    if (keyInput) {

      keyInput.focus();

    }

    displayAdminMessage(`Visualisering "${visualizationName}" av typ "${visualizationType}" skapad. Lägg till metrics nedan.`, "success");

  };

  const handleVisualizationTypeChange = () => {

    const visualizationType = elements.visualizationTypeSelect?.value;

    // Update button text based on visualization type
    if (elements.metricsCreateButton) {

      if (visualizationType === "pie") {

        elements.metricsCreateButton.textContent = "Skapa Cirkeldiagram";

      } else if (visualizationType === "bar") {

        elements.metricsCreateButton.textContent = "Skapa Stapeldiagram";

      } else if (visualizationType === "line") {

        elements.metricsCreateButton.textContent = "Skapa Linjediagram";

      } else if (visualizationType === "table") {

        elements.metricsCreateButton.textContent = "Skapa Tabell";

      } else {

        elements.metricsCreateButton.textContent = "Skapa Visualisering";

      }

    }

  };

  const handleAddMetricRow = () => {

    if (!elements.metricsList || !elements.metricsSection || elements.metricsSection.classList.contains("disabled")) {

      return;

    }

    removeMetricsEmpty();

    const row = createMetricRow("", "");

    elements.metricsList.appendChild(row);

    const keyInput = row.querySelector('input[name="metricKey"]');

    if (keyInput) {

      keyInput.focus();

    }

  };

  const handleSaveMetrics = () => {

    if (!elements.metricsList || !elements.editNodeSelect) {

      return;

    }

    const nodeId = elements.editNodeSelect.value;

    if (!nodeId) {

      displayAdminMessage("Select a node to update.", "error");

      return;

    }

    const rows = Array.from(elements.metricsList.querySelectorAll(".metrics-row"));

    const metrics = {};

    rows.forEach((row) => {

      const keyInput = row.querySelector('input[name="metricKey"]');

      const valueInput = row.querySelector('input[name="metricValue"]');

      if (!keyInput || !valueInput) {

        return;

      }

      const key = keyInput.value.trim();

      const value = Number(valueInput.value);

      if (!key) {

        return;

      }

      if (!Number.isFinite(value)) {

        return;

      }

      metrics[key] = value;

    });

    try {

      // Get visualization type, name and unit
      const visualizationType = elements.visualizationTypeSelect?.value;
      const visualizationName = elements.visualizationNameInput?.value;
      const visualizationUnit = elements.visualizationUnitInput?.value || "%";

      if (!visualizationType || !visualizationName) {
        displayAdminMessage("Välj visualiseringstyp och namn först.", "error");
        return;
      }

      // Get existing metrics
      const node = OrgStore.getNode(nodeId);
      const existingMetrics = node?.metrics || [];

      // Check if we're editing an existing metric
      const editingIndex = elements.metricsList.dataset.editingIndex;
      
      let updatedMetrics;
      if (editingIndex !== undefined && editingIndex !== "") {
        // Update existing metric
        updatedMetrics = [...existingMetrics];
        updatedMetrics[parseInt(editingIndex)] = {
          ...updatedMetrics[parseInt(editingIndex)],
          name: visualizationName,
          type: visualizationType,
          unit: visualizationUnit,
          data: metrics
        };
      } else {
        // Create new metric object
        const newMetric = {
          id: Date.now() + Math.random(),
          name: visualizationName,
          type: visualizationType,
          unit: visualizationUnit,
          data: metrics
        };

        // Add new metric to existing ones
        updatedMetrics = [...existingMetrics, newMetric];
      }

      OrgStore.updateNode(nodeId, { metrics: updatedMetrics });

      displayAdminMessage("Metrics saved.", "success");

      // Clear editing state
      if (elements.metricsList) {
        delete elements.metricsList.dataset.editingIndex;
      }
      if (elements.metricsSection) {
        elements.metricsSection.classList.remove("editing-metric");
      }

      const refreshedNode = OrgStore.getNode(nodeId);

      renderMetricsEditor(refreshedNode);

      if (selectedNodeId === nodeId) {

        renderDetailPanel();

      }

      if (typeof OrgMap !== "undefined" && OrgMap && typeof OrgMap.refresh === "function") {

        OrgMap.refresh();

      }

    } catch (error) {

      displayAdminMessage(error.message, "error");

    }

  };

  const createMetricRow = (key = "", value = "") => {

    const row = document.createElement("div");

    row.classList.add("metrics-row");

    const keyInput = document.createElement("input");

    keyInput.type = "text";

    keyInput.name = "metricKey";

    keyInput.placeholder = "Name";

    keyInput.value = key;

    const valueInput = document.createElement("input");

    valueInput.type = "number";

    valueInput.name = "metricValue";

    valueInput.placeholder = "Value";

    valueInput.step = "0.1";

    if (value !== "" && value !== null && value !== undefined) {

      valueInput.value = value;

    }

    const removeButton = document.createElement("button");

    removeButton.type = "button";

    removeButton.classList.add("metrics-remove");

    removeButton.textContent = "Ta bort";

    removeButton.addEventListener("click", () => {

      row.remove();

      ensureMetricsPlaceholder();

    });

    row.appendChild(keyInput);

    row.appendChild(valueInput);

    row.appendChild(removeButton);

    return row;

  };

  const createMetricsEmpty = () => {

    const empty = document.createElement("p");

    empty.classList.add("metrics-empty");

    empty.textContent = "No metrics yet.";

    return empty;

  };

  const removeMetricsEmpty = () => {

    if (!elements.metricsList) {

      return;

    }

    const placeholder = elements.metricsList.querySelector(".metrics-empty");

    if (placeholder) {

      placeholder.remove();

    }

  };

  const ensureMetricsPlaceholder = () => {

    if (!elements.metricsList) {

      return;

    }

    const hasRows = elements.metricsList.querySelector(".metrics-row");

    const placeholder = elements.metricsList.querySelector(".metrics-empty");

    if (hasRows && placeholder) {

      placeholder.remove();

    }

    if (!hasRows && !placeholder) {

      elements.metricsList.appendChild(createMetricsEmpty());

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

      const entries = Object.entries(metric.data || {})
        .map(([key, value]) => ({ key, value: Number(value) || 0 }))
        .filter((entry) => entry.value > 0);

      if (entries.length > 0) {
        const total = entries.reduce((sum, entry) => sum + entry.value, 0);

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
            ChartRenderer.renderChart(chartContainer, entries, total, metric.type || "pie", metric.name || "Time spent on:", metric.unit || "%");
          } else {
            renderMetricsChart(chartContainer, entries, total);
          }
        });
      }

      body.appendChild(metricContainer);
    });

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

    openNode

  };

})();

window.OrgUI = OrgUI;
