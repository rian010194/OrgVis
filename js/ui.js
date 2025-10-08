const OrgUI = (() => {

  const expandState = new Map();

  let selectedNodeId = null;

  let unsubscribe = null;
  let showingAdminContent = false;

  let activeAdminTab = "edit";

  // Color palettes for metrics
  const colorPalettes = {
    orange: [
      "#ff5a00",
      "#ff8b3d", 
      "#ffb266",
      "#ffd6ad",
      "#ffe6d5",
      "#ffc9ae"
    ],
    blue: [
      "#2563eb",
      "#3b82f6",
      "#60a5fa",
      "#93c5fd",
      "#dbeafe",
      "#bfdbfe"
    ],
    green: [
      "#16a34a",
      "#22c55e",
      "#4ade80",
      "#86efac",
      "#dcfce7",
      "#bbf7d0"
    ],
    purple: [
      "#9333ea",
      "#a855f7",
      "#c084fc",
      "#d8b4fe",
      "#f3e8ff",
      "#e9d5ff"
    ],
    red: [
      "#dc2626",
      "#ef4444",
      "#f87171",
      "#fca5a5",
      "#fecaca",
      "#fde2e2"
    ],
    teal: [
      "#0d9488",
      "#14b8a6",
      "#5eead4",
      "#99f6e4",
      "#ccfbf1",
      "#a7f3d0"
    ]
  };

  // Default palette (orange)
  const metricPalette = colorPalettes.orange;

  const getMetricColor = (() => {

    const assigned = new Map();

    let index = 0;

    return (key, palette = 'orange') => {

      const colorKey = `${key}_${palette}`;

      if (!assigned.has(colorKey)) {

        const currentPalette = colorPalettes[palette] || colorPalettes.orange;

        const color = currentPalette[index % currentPalette.length];

        assigned.set(colorKey, color);

        index += 1;

      }

      return assigned.get(colorKey);

    };

  })();

  const elements = {

    treeContainer: null,

    detailPanel: null,

    relationView: null,

    toggleProfile: null,

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
    
    // Verify critical elements are available
    verifyCriticalElements();

    bindStaticListeners();

    updateAdminTabsUI();

    // Ensure detail panel is visible by default (not in admin mode)
    if (elements.detailPanel && !document.body.classList.contains("admin-mode-active")) {
      elements.detailPanel.style.display = "flex";
    }
    
    // Initialize admin button text
    updateAdminButtonText(document.body.classList.contains("admin-mode-active"));

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

    elements.toggleProfile = document.getElementById("toggleProfile");

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

    if (elements.toggleProfile) {

      elements.toggleProfile.addEventListener("click", toggleProfilePanel);

    }

    if (elements.toggleAdmin) {

      elements.toggleAdmin.addEventListener("click", toggleAdminPanel);

    }

    // Mobile hamburger menu
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const mobileMenuClose = document.getElementById('mobileMenuClose');

    // Mobile view toggle (collapse main section)
    const mobileViewToggle = document.getElementById('mobileViewToggle');
    // Desktop view switch (tree/map) - also used on mobile
    const desktopViewSwitch = document.getElementById('desktopViewSwitch');

    if (mobileMenuToggle && mobileMenuOverlay) {
      mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }

    if (mobileMenuClose && mobileMenuOverlay) {
      mobileMenuClose.addEventListener('click', closeMobileMenu);
    }

    if (mobileViewToggle) {
      mobileViewToggle.addEventListener('click', toggleMainContent);
    }


    if (desktopViewSwitch) {
      desktopViewSwitch.addEventListener('click', () => {
        const treeContainer = document.getElementById('orgchart');
        const mapView = document.getElementById('mapView');
        const isTreeActive = treeContainer && !treeContainer.classList.contains('hidden');
        const nextView = isTreeActive ? 'map' : 'tree';
        switchToView(nextView);
        updateDesktopViewSwitchIcon(nextView);
      });
    }

    if (mobileMenuOverlay) {
      mobileMenuOverlay.addEventListener('click', (e) => {
        if (e.target === mobileMenuOverlay) {
          closeMobileMenu();
        }
      });
    }

    // Mobile admin button listeners
    const mobileMyProfileBtn = document.getElementById('mobileMyProfileBtn');
    const mobileProfileToggle = document.getElementById('mobileProfileToggle');
    const mobileAdminToggle = document.getElementById('mobileAdminToggle');
    const mobileUserManagementBtn = document.getElementById('mobileUserManagementBtn');
    const mobileEditThemeBtn = document.getElementById('mobileEditThemeBtn');
    const mobileEditNodesBtn = document.getElementById('mobileEditNodesBtn');
    const mobileResourcesBtn = document.getElementById('mobileResourcesBtn');
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
    
    // Mobile view button listeners
    const mobileTreeViewBtn = document.getElementById('mobileTreeViewBtn');
    const mobileMapViewBtn = document.getElementById('mobileMapViewBtn');

    if (mobileMyProfileBtn) {
      mobileMyProfileBtn.addEventListener('click', () => {
        // Open user management panel with profile view
        const userManagementPanel = document.getElementById('userManagementPanel');
        if (userManagementPanel) {
          userManagementPanel.classList.remove('hidden');
          // Switch to profile view
          const profileView = document.getElementById('profileView');
          const profileNavBtn = document.querySelector('[data-view="profile"]');
          if (profileView && profileNavBtn) {
            // Hide all views
            document.querySelectorAll('.view-content').forEach(view => {
              view.classList.remove('active');
            });
            // Show profile view
            profileView.classList.add('active');
            // Update nav button
            document.querySelectorAll('.nav-btn').forEach(btn => {
              btn.classList.remove('active');
            });
            profileNavBtn.classList.add('active');
          }
          closeMobileMenu();
        }
      });
    }

    if (mobileProfileToggle) {
      mobileProfileToggle.addEventListener('click', () => {
        // Call the profile toggle function directly
        toggleProfilePanel();
        // Close mobile menu after opening profile
        closeMobileMenu();
      });
    }

    if (mobileAdminToggle) {
      mobileAdminToggle.addEventListener('click', () => {
        // Call the admin toggle function directly
        toggleAdminPanel();
        // Don't close mobile menu - let user see the admin buttons appear
        // The menu will stay open so they can access admin functions immediately
      });
    }

    if (mobileUserManagementBtn) {
      mobileUserManagementBtn.addEventListener('click', () => {
        closeMobileMenu();
        // Call the function directly instead of simulating click
        showConfigureUsersInDetailPanel();
      });
    }

    if (mobileEditThemeBtn) {
      mobileEditThemeBtn.addEventListener('click', () => {
        closeMobileMenu();
        // Call the function directly instead of simulating click
        showEditThemeInDetailPanel();
      });
    }

    if (mobileEditNodesBtn) {
      mobileEditNodesBtn.addEventListener('click', () => {
        closeMobileMenu();
        // Call the function directly instead of simulating click
        showEditNodesInDetailPanel();
      });
    }

    if (mobileResourcesBtn) {
      mobileResourcesBtn.addEventListener('click', () => {
        closeMobileMenu();
        // Call the function directly instead of simulating click
        showAdminInfoInDetailPanel();
      });
    }

    if (mobileLogoutBtn) {
      mobileLogoutBtn.addEventListener('click', () => {
        const desktopLogoutBtn = document.getElementById('logoutBtn');
        if (desktopLogoutBtn) {
          desktopLogoutBtn.click();
          closeMobileMenu();
        }
      });
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
      const valuesContainer = document.getElementById('metricValuesContainer');
      const addValueBtn = document.getElementById('addMetricValueBtn');
      
      console.log('Metric form elements:', {
        chartTypeSelect: !!chartTypeSelect,
        valuesContainer: !!valuesContainer,
        addValueBtn: !!addValueBtn
      });
      
      if (valuesContainer && addValueBtn) {
        // Function to add a new value input
        const addValueInput = () => {
          const currentInputs = valuesContainer.querySelectorAll('.value-input-row');
          const index = currentInputs.length;
          const valueRow = window.createValueInput(index);
          valuesContainer.appendChild(valueRow);
        };
        
        // Add event listener to the add value button
        addValueBtn.addEventListener('click', addValueInput);
        
        // Initialize with two value inputs by default for new metrics
        if (!window.editingMetric) {
          addValueInput();
          addValueInput();
        }
        
        console.log('Metric value inputs initialized');
      } else {
        console.warn('Metric form elements not found:', {
          valuesContainer: !!valuesContainer,
          addValueBtn: !!addValueBtn
        });
      }

    }

    // Manage Metrics section - display metrics for currently selected node
    const metricsListContainer = document.getElementById('metricsListContainer');
    
    if (metricsListContainer) {
      // Display metrics for selected node
      window.displayManageMetrics = (nodeId) => {
        if (!nodeId) {
          metricsListContainer.innerHTML = '<p style="color: var(--muted, #718096); text-align: center; padding: 2rem;">Select a node from the chart to view and manage its metrics</p>';
          return;
        }
        
        const node = OrgStore.getNode(nodeId);
        if (!node) {
          metricsListContainer.innerHTML = '<p style="color: var(--muted, #718096); text-align: center; padding: 2rem;">Node not found</p>';
          return;
        }
        
        const metrics = node.metrics || [];
        
        if (metrics.length === 0) {
          metricsListContainer.innerHTML = `
            <p style="color: var(--muted, #718096); text-align: center; padding: 2rem;">
              No metrics found for <strong>${node.name}</strong>. Use the form above to add metrics.
            </p>
          `;
          return;
        }
        
        // Build metrics list with edit and delete buttons
        let html = `
          <div style="background: var(--surface, #fff); border: 1px solid var(--border, #e2e8f0); border-radius: 8px; padding: 1rem;">
            <h4 style="margin: 0 0 1rem 0; color: var(--text, #1a202c);">Metrics for ${node.name}</h4>
        `;
        
        metrics.forEach((metric, index) => {
          const dataPointsCount = metric.values ? metric.values.length : 0;
          html += `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: var(--background-color, #f8fafc); border-radius: 6px; margin-bottom: 0.5rem;">
              <div style="flex: 1;">
                <div style="font-weight: 600; color: var(--text, #1a202c);">${metric.name || 'Unnamed Metric'}</div>
                <div style="font-size: 0.875rem; color: var(--muted, #718096); margin-top: 0.25rem;">
                  Type: ${metric.chartType || 'pie'} | 
                  Unit: ${metric.unit || 'N/A'} | 
                  Data points: ${dataPointsCount}
                </div>
              </div>
              <div style="display: flex; gap: 0.5rem;">
                <button type="button" class="edit-metric-btn secondary" data-node-id="${nodeId}" data-metric-index="${index}" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                  Edit
                </button>
                <button type="button" class="remove-metric-btn danger" data-node-id="${nodeId}" data-metric-index="${index}" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                  Remove
                </button>
              </div>
            </div>
          `;
        });
        
        html += `</div>`;
        metricsListContainer.innerHTML = html;
        
        // Attach event listeners to edit and remove buttons
        const editButtons = metricsListContainer.querySelectorAll('.edit-metric-btn');
        const removeButtons = metricsListContainer.querySelectorAll('.remove-metric-btn');
        
        editButtons.forEach(btn => {
          btn.addEventListener('click', () => {
            const nodeId = btn.dataset.nodeId;
            const metricIndex = parseInt(btn.dataset.metricIndex);
            handleEditMetric(nodeId, metricIndex);
          });
        });
        
        removeButtons.forEach(btn => {
          btn.addEventListener('click', () => {
            const nodeId = btn.dataset.nodeId;
            const metricIndex = parseInt(btn.dataset.metricIndex);
            handleRemoveMetricByIndex(nodeId, metricIndex);
          });
        });
      };
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

    // Add event listeners for header buttons
    const userManagementBtn = document.getElementById('userManagementBtn');
    const editThemeBtn = document.getElementById('editThemeBtn');
    const editNodesBtn = document.getElementById('editNodesBtn');
    const resourcesBtn = document.getElementById('resourcesBtn');
    
    if (userManagementBtn) {
      userManagementBtn.addEventListener("click", showConfigureUsersInDetailPanel);
    }
    
    if (editThemeBtn) {
      editThemeBtn.addEventListener("click", showEditThemeInDetailPanel);
    }
    
    if (editNodesBtn) {
      editNodesBtn.addEventListener("click", showEditNodesInDetailPanel);
    }
    
    if (resourcesBtn) {
      resourcesBtn.addEventListener("click", showAdminInfoInDetailPanel);
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
      
      // Update Manage Metrics if on metrics tab
      if (typeof window.displayManageMetrics === 'function') {
        window.displayManageMetrics(nodeId);
      }
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

    // Don't clear admin content when showing admin panels
    if (showingAdminContent) {
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
      showingAdminContent = false;
      document.body.classList.remove('admin-mode-active');
      document.body.classList.remove('profile-mode-active');

      // Move admin panel back to its original location if it was moved
      const adminPanel = document.getElementById('adminPanel');
      const sideSection = document.querySelector('.side-section');
      if (adminPanel && sideSection && !sideSection.contains(adminPanel)) {
        sideSection.appendChild(adminPanel);
        adminPanel.classList.remove('detail-admin-content');
        adminPanel.classList.add('admin-panel');
      }

      // Theme panel is now cloned, no need to move it back
      // The original editThemePanel remains in place

      // User management panel is now cloned, no need to move it back
      // The original userManagementPanel remains in place

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

  // Functions to show/hide admin buttons
  const showAdminButtons = () => {
    const adminButtons = [
      'userManagementBtn',
      'editThemeBtn', 
      'editNodesBtn',
      'resourcesBtn'
    ];
    
    adminButtons.forEach(btnId => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.classList.remove('hidden');
        console.log(`Showing admin button: ${btnId}`);
      }
    });
  };

  const hideAdminButtons = () => {
    const adminButtons = [
      'userManagementBtn',
      'editThemeBtn', 
      'editNodesBtn',
      'resourcesBtn'
    ];
    
    adminButtons.forEach(btnId => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.classList.add('hidden');
        console.log(`Hiding admin button: ${btnId}`);
      }
    });
  };

  const initializeAdminButtonListeners = () => {
    const userManagementBtn = document.getElementById('userManagementBtn');
    const editThemeBtn = document.getElementById('editThemeBtn');
    const editNodesBtn = document.getElementById('editNodesBtn');
    const resourcesBtn = document.getElementById('resourcesBtn');
    
    console.log('Initializing admin button listeners:', {
      userManagementBtn: !!userManagementBtn,
      editThemeBtn: !!editThemeBtn,
      editNodesBtn: !!editNodesBtn,
      resourcesBtn: !!resourcesBtn
    });
    
    // Helper function to safely re-attach event listeners
    const reattachListener = (button, handler, name) => {
      if (button) {
        // Clone button to remove all existing event listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Add new event listener
        newButton.addEventListener("click", handler);
        console.log(`${name} button listener attached`);
        return newButton;
      }
      return null;
    };
    
    // Re-attach all admin button listeners
    reattachListener(userManagementBtn, showConfigureUsersInDetailPanel, 'User management');
    reattachListener(editThemeBtn, showEditThemeInDetailPanel, 'Edit theme');
    reattachListener(editNodesBtn, showEditNodesInDetailPanel, 'Edit nodes');
    reattachListener(resourcesBtn, showAdminInfoInDetailPanel, 'Resources');
    
    console.log('Admin button event listeners re-initialized');
  };

  // Move initializeAdminPanel to global scope to avoid reference errors
  window.initializeAdminPanel = () => {
    // Re-initialize admin panel functionality
    refreshAdminPanel();
    updateAdminTabsUI();
    
    // Re-cache admin elements since they may have moved
    elements.adminTabs = Array.from(document.querySelectorAll('[data-admin-tab]')) || [];
    elements.adminPanels = Array.from(document.querySelectorAll('[data-admin-panel]')) || [];
    
    // Re-bind admin panel event listeners
    if (elements.adminTabs && elements.adminTabs.length) {
      elements.adminTabs.forEach((button) => {
        // Clone the button to remove all event listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Add the event listener to the new button
        newButton.addEventListener("click", () => {
          const targetTab = newButton.dataset.adminTab;
          if (targetTab) {
            setActiveAdminTab(targetTab);
          }
        });
      });
      
      // Update the elements array with the new buttons
      elements.adminTabs = Array.from(document.querySelectorAll('[data-admin-tab]')) || [];
    }
    
    // Re-initialize admin button listeners (for buttons like Edit Nodes, Edit Theme, etc.)
    initializeAdminButtonListeners();
    
    console.log('Admin panel re-initialized');
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
    // DISABLED: Now using the "Manage Metrics" section in the Metrics tab instead
    // This old function was showing metrics in the detail panel which created duplicate UI
    return;
    
    /* OLD CODE DISABLED
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
    */ // END OF DISABLED CODE
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
      if (typeof window.displayManageMetrics === 'function') {
        window.displayManageMetrics(selectedNodeId);
      }
    }
    
    // Populate edit form when switching to Edit tab
    if (tab === "edit") {
      populateEditForm();
      // Reset button text to "Save changes"
      const saveButton = document.querySelector('#adminEditForm button[type="submit"]');
      if (saveButton) {
        saveButton.textContent = "Save changes";
        saveButton.style.backgroundColor = ""; // Reset color
      }
    }

  };

  // Mobile menu functions
  const toggleMobileMenu = () => {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    
    if (!mobileMenuToggle || !mobileMenuOverlay) return;
    
    const isOpen = !mobileMenuOverlay.classList.contains('hidden');
    
    if (isOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  };

  const openMobileMenu = () => {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    
    if (!mobileMenuToggle || !mobileMenuOverlay) return;
    
    mobileMenuOverlay.classList.remove('hidden');
    mobileMenuToggle.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Sync admin button states
    syncMobileAdminButtons();
  };

  const closeMobileMenu = () => {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    
    if (!mobileMenuToggle || !mobileMenuOverlay) return;
    
    mobileMenuOverlay.classList.add('hidden');
    mobileMenuToggle.classList.remove('active');
    document.body.style.overflow = '';
  };


  const toggleMainContent = () => {
    const mobileViewToggle = document.getElementById('mobileViewToggle');
    const body = document.body;
    
    if (!mobileViewToggle) return;
    
    const isCollapsed = body.classList.contains('main-content-collapsed');
    
    if (isCollapsed) {
      // Show main content
      body.classList.remove('main-content-collapsed');
      mobileViewToggle.classList.remove('collapsed');
    } else {
      // Hide main content
      body.classList.add('main-content-collapsed');
      mobileViewToggle.classList.add('collapsed');
    }
  };

  const syncMobileAdminButtons = () => {
    const isAdminOpen = document.body.classList.contains('admin-mode-active');
    
    // Update mobile admin toggle button
    const mobileAdminToggle = document.getElementById('mobileAdminToggle');
    if (mobileAdminToggle) {
      mobileAdminToggle.classList.toggle('active', isAdminOpen);
      const textElement = mobileAdminToggle.querySelector('.mobile-admin-action-text');
      if (textElement) {
        textElement.textContent = isAdminOpen ? 'Exit Admin' : 'Admin Mode';
      }
    }
    
    // Show/hide admin action buttons
    const adminButtons = [
      'mobileUserManagementBtn',
      'mobileEditThemeBtn', 
      'mobileEditNodesBtn',
      'mobileResourcesBtn'
    ];
    
    adminButtons.forEach(buttonId => {
      const button = document.getElementById(buttonId);
      if (button) {
        if (isAdminOpen) {
          button.classList.remove('hidden');
        } else {
          button.classList.add('hidden');
        }
      }
    });
  };

  // Function to switch between views
  const switchToView = (viewType) => {
    const treeContainer = document.getElementById('orgchart');
    const mapView = document.getElementById('mapView');
    
    if (viewType === 'tree') {
      if (treeContainer) treeContainer.classList.remove('hidden');
      if (mapView) mapView.classList.add('hidden');
    } else if (viewType === 'map') {
      if (treeContainer) treeContainer.classList.add('hidden');
      if (mapView) mapView.classList.remove('hidden');
      
      // When switching to map view, focus on the currently selected node
      if (typeof OrgMap !== 'undefined' && OrgMap && typeof OrgMap.reveal === 'function') {
        // Get the currently selected node ID from the tree
        const selectedNodeId = getSelectedNodeId();
        if (selectedNodeId) {
          console.log('switchToView - focusing on selected node:', selectedNodeId);
          // Use a longer delay to ensure map is visible and dimensions are updated
          setTimeout(() => {
            OrgMap.reveal(selectedNodeId);
          }, 300);
        } else {
          console.log('switchToView - no selected node, using resetView');
          // If no node is selected, use resetView
          setTimeout(() => {
            if (typeof OrgMap !== 'undefined' && OrgMap && typeof OrgMap.resetView === 'function') {
              OrgMap.resetView({ duration: 0 });
            }
          }, 100);
        }
      }
    }
    
    // Update desktop view dropdown if it exists
    const viewDropdownToggle = document.getElementById('viewDropdownToggle');
    if (viewDropdownToggle) {
      const currentSpan = viewDropdownToggle.querySelector('.view-current');
      if (currentSpan) {
        currentSpan.textContent = viewType === 'tree' ? 'Tree View' : 'Map View';
      }
    }

    // Update desktop switch icon
    updateDesktopViewSwitchIcon(viewType);
  };


  const updateDesktopViewSwitchIcon = (activeView) => {
    const desktopViewSwitch = document.getElementById('desktopViewSwitch');
    if (!desktopViewSwitch) return;
    const iconEl = desktopViewSwitch.querySelector('.desktop-view-switch-icon');
    if (!iconEl) return;
    iconEl.textContent = activeView === 'tree' ? '🌳' : '🗺️';
    desktopViewSwitch.setAttribute('aria-label', activeView === 'tree' ? 'Switch to map view' : 'Switch to tree view');
  };

  const getSelectedNodeId = () => {
    // Try to get the selected node from the tree
    const selectedNode = document.querySelector('.org-node.selected');
    if (selectedNode) {
      return selectedNode.dataset.nodeId || selectedNode.id;
    }
    
    // Fallback: try to get from global selectedNodeId variable if it exists
    if (typeof selectedNodeId !== 'undefined' && selectedNodeId) {
      return selectedNodeId;
    }
    
    // Another fallback: check if there's a node with active class
    const activeNode = document.querySelector('.org-node.active');
    if (activeNode) {
      return activeNode.dataset.nodeId || activeNode.id;
    }
    
    return null;
  };

  // Function to update mobile view buttons
  const updateMobileViewButtons = (activeView) => {
    const treeBtn = document.getElementById('mobileTreeViewBtn');
    const mapBtn = document.getElementById('mobileMapViewBtn');
    
    if (treeBtn && mapBtn) {
      treeBtn.classList.toggle('active', activeView === 'tree');
      mapBtn.classList.toggle('active', activeView === 'map');
    }
  };

  // Debounce admin toggle to prevent multiple rapid clicks
  let adminToggleInProgress = false;
  
  const toggleAdminPanel = () => {
    if (!elements.detailPanel) {
      return;
    }
    
    // Prevent multiple simultaneous toggle attempts
    if (adminToggleInProgress) {
      console.log('Admin toggle already in progress, ignoring click');
      return;
    }
    
    adminToggleInProgress = true;
    
    // Disable the admin toggle button temporarily
    if (elements.toggleAdmin) {
      elements.toggleAdmin.disabled = true;
      elements.toggleAdmin.style.pointerEvents = 'none';
    }
    
    try {
      // Check if admin mode is currently active
      const willOpen = !document.body.classList.contains("admin-mode-active");

      // Toggle body class for admin mode
      document.body.classList.toggle("admin-mode-active", willOpen);

    // Show admin info in detail panel when admin mode is ON
    if (willOpen) {
      // Admin mode ON: show admin info in detail panel
      document.body.classList.add('admin-mode-active');
      showAdminInfoInDetailPanel();
      
      // Re-initialize event listeners for admin buttons to ensure they work
      initializeAdminButtonListeners();
      
      // Show admin buttons
      showAdminButtons();
    } else {
      // Admin mode OFF: show detail panel (restore original flex display)
      document.body.classList.remove('admin-mode-active');
      showingAdminContent = false;
      
      // Hide admin buttons
      hideAdminButtons();
      
      // Move admin panel back to its original location if it was moved
      const adminPanel = document.getElementById('adminPanel');
      const sideSection = document.querySelector('.side-section');
      if (adminPanel && sideSection && !sideSection.contains(adminPanel)) {
        sideSection.appendChild(adminPanel);
        adminPanel.classList.remove('detail-admin-content');
        adminPanel.classList.add('admin-panel');
      }

      // Theme panel is now cloned, no need to move it back
      // The original editThemePanel remains in place

      // User management panel is now cloned, no need to move it back
      // The original userManagementPanel remains in place
    }

    if (elements.toggleAdmin) {

      elements.toggleAdmin.classList.toggle("active", willOpen);

      elements.toggleAdmin.setAttribute("aria-pressed", String(willOpen));
      
      // Update button text based on admin state
      updateAdminButtonText(willOpen);

    }

    // Show/hide Users, Edit Theme, Edit Nodes, and Resources buttons based on admin state
    const userManagementBtn = document.getElementById('userManagementBtn');
    const editThemeBtn = document.getElementById('editThemeBtn');
    const editNodesBtn = document.getElementById('editNodesBtn');
    const resourcesBtn = document.getElementById('resourcesBtn');
    
    if (userManagementBtn) {
      if (willOpen) {
        userManagementBtn.classList.remove('hidden');
      } else {
        userManagementBtn.classList.add('hidden');
      }
    }
    
    if (editThemeBtn) {
      if (willOpen) {
        editThemeBtn.classList.remove('hidden');
      } else {
        editThemeBtn.classList.add('hidden');
      }
    }
    
    if (editNodesBtn) {
      if (willOpen) {
        editNodesBtn.classList.remove('hidden');
      } else {
        editNodesBtn.classList.add('hidden');
      }
    }
    
    if (resourcesBtn) {
      if (willOpen) {
        resourcesBtn.classList.remove('hidden');
      } else {
        resourcesBtn.classList.add('hidden');
      }
    }

    // Sync mobile admin buttons
    syncMobileAdminButtons();

    if (willOpen) {

      updateAdminTabsUI();

    } else {

      // When admin panel closes, refresh detail panel to remove admin buttons
      if (selectedNodeId) {
        renderDetailPanel();
      }

    }
    
    } catch (error) {
      console.error('Admin toggle error:', error);
    } finally {
      // Re-enable the admin toggle button after a short delay
      setTimeout(() => {
        adminToggleInProgress = false;
        if (elements.toggleAdmin) {
          elements.toggleAdmin.disabled = false;
          elements.toggleAdmin.style.pointerEvents = '';
        }
      }, 100); // Short delay to prevent rapid clicking
    }
  };

  // Debounce profile toggle to prevent multiple rapid clicks
  let profileToggleInProgress = false;
  
  const toggleProfilePanel = () => {
    if (!elements.detailPanel) {
      return;
    }
    
    // Prevent multiple simultaneous toggle attempts
    if (profileToggleInProgress) {
      console.log('Profile toggle already in progress, ignoring click');
      return;
    }
    
    profileToggleInProgress = true;
    
    // Disable the profile toggle button temporarily
    if (elements.toggleProfile) {
      elements.toggleProfile.disabled = true;
      elements.toggleProfile.style.pointerEvents = 'none';
    }
    
    try {
      // Check if profile mode is currently active
      const willOpen = !document.body.classList.contains("profile-mode-active");

      // Toggle body class for profile mode
      document.body.classList.toggle("profile-mode-active", willOpen);

      // Show profile info in detail panel when profile mode is ON
      if (willOpen) {
        showProfileInfoInDetailPanel();
      } else {
        // Hide detail panel when profile mode is OFF
        elements.detailPanel.style.display = "none";
        elements.detailPanel.classList.remove("active", "expanded");
        document.body.classList.remove("detail-expanded");
      }

      // Update profile button state
      if (elements.toggleProfile) {
        elements.toggleProfile.classList.toggle("active", willOpen);
        elements.toggleProfile.setAttribute("aria-pressed", String(willOpen));
      }

    } catch (error) {
      console.error('Profile toggle error:', error);
    } finally {
      // Re-enable the profile toggle button after a short delay
      setTimeout(() => {
        profileToggleInProgress = false;
        if (elements.toggleProfile) {
          elements.toggleProfile.disabled = false;
          elements.toggleProfile.style.pointerEvents = '';
        }
      }, 100); // Short delay to prevent rapid clicking
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

      // Reset button text to "Save changes" when clearing form
      const saveButton = elements.editForm.querySelector('button[type="submit"]');
      if (saveButton) {
        saveButton.textContent = "Save changes";
        saveButton.style.backgroundColor = ""; // Reset color
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

    // Reset button text to "Save changes" when populating form
    const saveButton = elements.editForm.querySelector('button[type="submit"]');
    if (saveButton) {
      saveButton.textContent = "Save changes";
      saveButton.style.backgroundColor = ""; // Reset color
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

  // Helper function to edit a metric
  const handleEditMetric = (nodeId, metricIndex) => {
    const node = OrgStore.getNode(nodeId);
    if (!node || !node.metrics || !node.metrics[metricIndex]) {
      displayAdminMessage("Metric not found.", "error");
      return;
    }
    
    const metric = node.metrics[metricIndex];
    const form = elements.addMetricForm;
    
    // Populate the form with metric data
    form.querySelector('select[name="nodeId"]').value = nodeId;
    form.querySelector('input[name="metricName"]').value = metric.name || '';
    form.querySelector('input[name="metricUnit"]').value = metric.unit || '';
    form.querySelector('select[name="metricChartType"]').value = metric.chartType || 'pie';
    form.querySelector('select[name="metricColorPalette"]').value = metric.colorPalette || 'orange';
    form.querySelector('input[name="metricDescription"]').value = metric.description || '';
    
    // Clear existing value inputs
    const valuesContainer = document.getElementById('metricValuesContainer');
    if (valuesContainer) {
      valuesContainer.innerHTML = '';
      
      // Add value inputs for existing data
      if (metric.values && metric.values.length > 0) {
        metric.values.forEach((dataPoint, i) => {
          const valueRow = window.createValueInput(i, dataPoint.label, dataPoint.value);
          valuesContainer.appendChild(valueRow);
        });
      }
    }
    
    // Store editing state
    window.editingMetric = {
      nodeId: nodeId,
      originalIndex: metricIndex
    };
    
    // Change submit button text
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.textContent = "Update Metric";
    }
    
    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    displayAdminMessage(`Editing metric: ${metric.name}`, "info");
  };
  
  // Helper function to remove a metric by index
  const handleRemoveMetricByIndex = (nodeId, metricIndex) => {
    const node = OrgStore.getNode(nodeId);
    if (!node || !node.metrics || !node.metrics[metricIndex]) {
      displayAdminMessage("Metric not found.", "error");
      return;
    }
    
    const metric = node.metrics[metricIndex];
    const metricName = metric.name || 'Unnamed Metric';
    
    if (confirm(`Are you sure you want to remove the metric "${metricName}" from ${node.name}?`)) {
      const updatedMetrics = node.metrics.filter((_, index) => index !== metricIndex);
      OrgStore.updateNode(nodeId, { metrics: updatedMetrics });
      
      displayAdminMessage(`Metric "${metricName}" removed successfully.`, "success");
      
      // Refresh the metrics list
      if (typeof window.displayManageMetrics === 'function') {
        setTimeout(() => window.displayManageMetrics(nodeId), 100);
      }
      
      refresh();
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
    const metricColorPalette = data.get("metricColorPalette") || "orange";
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
        colorPalette: metricColorPalette,
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
      
      // Clear the editing state
      window.editingMetric = null;
      
      form.reset();
      
      // Clear data point inputs
      const valuesContainer = document.getElementById('metricValuesContainer');
      if (valuesContainer) {
        valuesContainer.innerHTML = '';
      }
      
      // Refresh the metrics list if we're on the metrics tab
      if (typeof window.displayManageMetrics === 'function') {
        window.displayManageMetrics(nodeId);
      }
      
      // Update current metrics display
      if (typeof displayCurrentMetrics === 'function') {
        displayCurrentMetrics();
      }
      
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
          swatch.style.backgroundColor = getMetricColor(entry.key, metric.colorPalette || 'orange');

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
            ChartRenderer.renderChart(chartContainer, entries, total, metric.chartType || "pie", metric.name || "Time spent on:", metric.unit || "%", metric.colorPalette || "orange");
          } else {
            console.log('ChartRenderer not available, using fallback');
            renderMetricsChart(chartContainer, entries, total, metric.colorPalette || "orange");
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

  function renderMetricsChart(container, entries, total, palette = "orange") {

    if (!container) {

      return;

    }

    // Use new ChartRenderer if available, otherwise fallback to old implementation
    if (typeof ChartRenderer !== "undefined") {
      ChartRenderer.renderChart(container, entries, total, "pie", "Time spent on:", "%", "orange");
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

      .attr("fill", (d) => getMetricColor(d.data.key, palette))

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

  // New functions for showing content in detail panel
  const showConfigureUsersInDetailPanel = () => {
    console.log('showConfigureUsersInDetailPanel called');
    
    // Prevent multiple simultaneous calls
    if (window._showConfigureUsersInProgress) {
      console.log('showConfigureUsersInDetailPanel already in progress, skipping');
      return;
    }
    
    window._showConfigureUsersInProgress = true;
    
    // Safety timeout to reset flag if something goes wrong
    setTimeout(() => {
      if (window._showConfigureUsersInProgress) {
        console.warn('showConfigureUsersInDetailPanel timeout - resetting flag');
        window._showConfigureUsersInProgress = false;
      }
    }, 5000); // 5 second timeout
    
    // Check if DOM is ready
    if (document.readyState !== 'complete') {
      console.log('DOM not ready, waiting...');
      const waitForDOM = () => {
        if (document.readyState === 'complete') {
          console.log('DOM is now ready, proceeding');
          showConfigureUsersInDetailPanel();
        } else {
          setTimeout(waitForDOM, 100);
        }
      };
      waitForDOM();
      return;
    }
    
    // Debug: Check if panels exist in HTML source
    console.log('HTML source check:', {
      hasUserPanel: document.documentElement.innerHTML.includes('userManagementPanel'),
      hasThemePanel: document.documentElement.innerHTML.includes('editThemePanel'),
      bodyHTML: document.body.innerHTML.substring(0, 200)
    });
    
    if (!elements.detailPanel) {
      console.log('Detail panel not found');
      window._showConfigureUsersInProgress = false; // Reset flag
      return;
    }
    
    // Hide admin panel if it's open (but keep admin mode active)
    if (elements.adminPanel && elements.adminPanel.classList.contains("open")) {
      elements.adminPanel.classList.remove("open");
    }
    
    // Show detail panel
    elements.detailPanel.style.display = "flex";
    elements.detailPanel.classList.add("active");
    
    // Mark that we're showing admin content
    showingAdminContent = true;
    
    // Get the original user management panel content
    let originalUserPanel = document.getElementById('userManagementPanel');
    
    console.log('Looking for userManagementPanel:', {
      found: !!originalUserPanel,
      documentReadyState: document.readyState,
      bodyChildren: document.body.children.length,
      allPanels: document.querySelectorAll('[id*="Panel"]').length
    });
    
    // Panel should always be found since we're not moving it anymore
    
    if (!originalUserPanel) {
      console.log('User management panel not found anywhere');
      console.log('Available elements with "Panel" in ID:', 
        Array.from(document.querySelectorAll('[id*="Panel"]')).map(el => el.id));
      window._showConfigureUsersInProgress = false; // Reset flag
      return;
    }
    
    // Clone the user management panel content instead of moving it
    const userContent = originalUserPanel.cloneNode(true);
    userContent.classList.remove('hidden', 'user-panel');
    userContent.classList.add('detail-user-content');
    
    // Remove the panel header and use detail panel header instead
    const userHeader = userContent.querySelector('.user-panel-header');
    if (userHeader) {
      userHeader.remove();
    }
    
    // Create detail panel header
    const container = document.createElement("div");
    container.classList.add("detail-content", "full-width");
    
    const header = document.createElement("div");
    header.classList.add("detail-header");
    
    const title = document.createElement("h2");
    title.textContent = "Configure Users";
    header.appendChild(title);
    
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.classList.add("detail-close");
    closeButton.setAttribute("aria-label", "Close panel");
    closeButton.dataset.action = "close-panel";
    closeButton.textContent = "";
    header.appendChild(closeButton);
    
    container.appendChild(header);
    
    // Add the user content
    container.appendChild(userContent);
    
    // Clear and populate detail panel
    elements.detailPanel.innerHTML = "";
    elements.detailPanel.appendChild(container);
    elements.detailPanel.classList.add("expanded");
    
    // Set flag to prevent map focus during admin panel transitions
    window._adminPanelTransition = true;
    document.body.classList.add("detail-expanded");
    
    // Clear the flag after a short delay
    setTimeout(() => {
      window._adminPanelTransition = false;
    }, 500);
    
    // Re-initialize user management functionality since we moved the content
    setTimeout(() => {
      if (typeof UserManagement !== 'undefined' && UserManagement.init) {
        UserManagement.init();
        console.log('User management re-initialized in detail panel');
      }
      
      // Reset the progress flag
      window._showConfigureUsersInProgress = false;
    }, 100);
  };

  const showEditThemeInDetailPanel = () => {
    console.log('showEditThemeInDetailPanel called');
    
    // Prevent multiple simultaneous calls
    if (window._showEditThemeInProgress) {
      console.log('showEditThemeInDetailPanel already in progress, skipping');
      return;
    }
    
    window._showEditThemeInProgress = true;
    
    // Safety timeout to reset flag if something goes wrong
    setTimeout(() => {
      if (window._showEditThemeInProgress) {
        console.warn('showEditThemeInDetailPanel timeout - resetting flag');
        window._showEditThemeInProgress = false;
      }
    }, 5000); // 5 second timeout
    
    // Check if DOM is ready
    if (document.readyState !== 'complete') {
      console.log('DOM not ready, waiting...');
      const waitForDOM = () => {
        if (document.readyState === 'complete') {
          console.log('DOM is now ready, proceeding');
          showEditThemeInDetailPanel();
        } else {
          setTimeout(waitForDOM, 100);
        }
      };
      waitForDOM();
      return;
    }
    
    // Debug: Check if panels exist in HTML source
    console.log('HTML source check:', {
      hasUserPanel: document.documentElement.innerHTML.includes('userManagementPanel'),
      hasThemePanel: document.documentElement.innerHTML.includes('editThemePanel'),
      bodyHTML: document.body.innerHTML.substring(0, 200)
    });
    
    if (!elements.detailPanel) {
      console.log('Detail panel not found');
      window._showEditThemeInProgress = false; // Reset flag
      return;
    }
    
    // Hide admin panel if it's open (but keep admin mode active)
    if (elements.adminPanel && elements.adminPanel.classList.contains("open")) {
      elements.adminPanel.classList.remove("open");
    }
    
    // Show detail panel
    elements.detailPanel.style.display = "flex";
    elements.detailPanel.classList.add("active");
    
    // Mark that we're showing admin content
    showingAdminContent = true;
    
    // Clone the theme panel into detail panel (with proper event handling)
    let originalThemePanel = document.getElementById('editThemePanel');
    
    console.log('Looking for editThemePanel:', {
      found: !!originalThemePanel,
      documentReadyState: document.readyState
    });
    
    if (!originalThemePanel) {
      console.log('Edit theme panel not found');
      window._showEditThemeInProgress = false;
      return;
    }
    
    // Clone the theme panel content
    const themeContent = originalThemePanel.cloneNode(true);
    themeContent.classList.remove('hidden', 'theme-panel');
    themeContent.classList.add('detail-theme-content');
    
    // Remove the panel header and use detail panel header instead
    const themeHeader = themeContent.querySelector('.theme-panel-header');
    if (themeHeader) {
      themeHeader.remove();
    }
    
    // Create detail panel header
    const container = document.createElement("div");
    container.classList.add("detail-content", "full-width");
    
    const header = document.createElement("div");
    header.classList.add("detail-header");
    
    const title = document.createElement("h2");
    title.textContent = "Edit Theme";
    header.appendChild(title);
    
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.classList.add("detail-close");
    closeButton.setAttribute("aria-label", "Close panel");
    closeButton.dataset.action = "close-panel";
    closeButton.textContent = "";
    header.appendChild(closeButton);
    
    container.appendChild(header);
    container.appendChild(themeContent);
    
    // Clear and populate detail panel
    elements.detailPanel.innerHTML = "";
    elements.detailPanel.appendChild(container);
    elements.detailPanel.classList.add("expanded");
    
    // Set flag to prevent map focus during admin panel transitions
    window._adminPanelTransition = true;
    document.body.classList.add("detail-expanded");
    
    setTimeout(() => {
      window._adminPanelTransition = false;
    }, 500);
    
    // Load current theme and reattach listeners for the cloned form
    setTimeout(() => {
      if (window.ThemeEditor) {
        // Re-attach save button listener (force=true to override marker)
        if (typeof window.ThemeEditor.attachSaveButtonListener === 'function') {
          console.log('Theme editor: Re-attaching save button listener after cloning');
          window.ThemeEditor.attachSaveButtonListener(true);
        }
        
        // Load current theme into the cloned form
        if (typeof window.ThemeEditor.loadCurrentTheme === 'function') {
          console.log('Theme editor: Loading current theme into detail panel');
          const detailPanel = document.getElementById('detailPanel');
          if (detailPanel) {
            window.ThemeEditor.loadCurrentTheme(detailPanel);
          }
        }
      }
      
      window._showEditThemeInProgress = false;
    }, 100);
  };

  const showEditNodesInDetailPanel = () => {
    console.log('showEditNodesInDetailPanel called');
    
    // Show warning about admin panel issues
    if (window.warningBanner) {
      window.warningBanner.showAdminPanelIssue();
    }
    
    // Prevent multiple simultaneous calls
    if (window._showEditNodesInProgress) {
      console.log('showEditNodesInDetailPanel already in progress, skipping');
      return;
    }
    
    window._showEditNodesInProgress = true;
    
    // Safety timeout to reset flag if something goes wrong
    setTimeout(() => {
      if (window._showEditNodesInProgress) {
        console.warn('showEditNodesInDetailPanel timeout - resetting flag');
        window._showEditNodesInProgress = false;
      }
    }, 5000); // 5 second timeout
    
    // Debug: Log current DOM state
    console.log('DOM state check:', {
      adminPanelById: !!document.getElementById('adminPanel'),
      adminPanelByClass: !!document.querySelector('.admin-panel'),
      adminPanelInElements: !!elements.adminPanel,
      detailPanel: !!elements.detailPanel
    });
    
    if (!elements.detailPanel) {
      console.log('Detail panel not found');
      window._showEditNodesInProgress = false; // Reset flag
      return;
    }
    
    // Hide admin panel if it's open (but keep admin mode active)
    if (elements.adminPanel && elements.adminPanel.classList.contains("open")) {
      elements.adminPanel.classList.remove("open");
      console.log('Admin panel hidden');
    }
    
    // Show detail panel
    elements.detailPanel.style.display = "flex";
    elements.detailPanel.classList.add("active");
    
    // Mark that we're showing admin content
    showingAdminContent = true;
    
    // Check if admin content is already in detail panel
    const existingAdminContent = elements.detailPanel.querySelector('.detail-admin-content');
    if (existingAdminContent) {
      console.log('Admin content already in detail panel');
      window._showEditNodesInProgress = false; // Reset flag
      return;
    }
    
    // Get the original admin panel content - try multiple approaches
    let originalAdminPanel = document.getElementById('adminPanel');
    
    // If not found by ID, try to find it in the DOM by class
    if (!originalAdminPanel) {
      originalAdminPanel = document.querySelector('.admin-panel');
    }
    
    // If still not found, try to find it in elements
    if (!originalAdminPanel && elements.adminPanel) {
      originalAdminPanel = elements.adminPanel;
    }
    
    if (!originalAdminPanel) {
      console.warn('Admin panel not found - DOM may not be ready yet');
      // Retry after a short delay with exponential backoff
      let retryCount = 0;
      const maxRetries = 5;
      
      const retryFunction = () => {
        retryCount++;
        let retryPanel = document.getElementById('adminPanel') || 
                        document.querySelector('.admin-panel') || 
                        elements.adminPanel;
                        
        if (retryPanel) {
          showEditNodesInDetailPanel();
        } else if (retryCount < maxRetries) {
          setTimeout(retryFunction, 100 * retryCount); // Exponential backoff
        } else {
          console.error('Admin panel still not found after', maxRetries, 'retries');
          // Fallback: create a simple admin interface
          createFallbackAdminInterface();
        }
      };
      
      setTimeout(retryFunction, 100);
      window._showEditNodesInProgress = false; // Reset flag
      return;
    }
    
    console.log('Moving admin panel content to detail panel');
    
    // Move the admin panel content instead of cloning it
    const adminContent = originalAdminPanel;
    adminContent.classList.remove('admin-panel');
    adminContent.classList.add('detail-admin-content');
    
    // Create detail panel header
    const container = document.createElement("div");
    container.classList.add("detail-content", "full-width");
    
    const header = document.createElement("div");
    header.classList.add("detail-header");
    
    const title = document.createElement("h2");
    title.textContent = "Edit Nodes";
    header.appendChild(title);
    
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.classList.add("detail-close");
    closeButton.setAttribute("aria-label", "Close panel");
    closeButton.dataset.action = "close-panel";
    closeButton.textContent = "";
    header.appendChild(closeButton);
    
    container.appendChild(header);
    
    // Add the admin content
    container.appendChild(adminContent);
    
    // Clear and populate detail panel
    elements.detailPanel.innerHTML = "";
    elements.detailPanel.appendChild(container);
    elements.detailPanel.classList.add("expanded");
    
    // Set flag to prevent map focus during admin panel transitions
    window._adminPanelTransition = true;
    document.body.classList.add("detail-expanded");
    
    // Clear the flag after a short delay
    setTimeout(() => {
      window._adminPanelTransition = false;
    }, 500);
    
    console.log('Detail panel populated with admin content');
    
    // Re-initialize admin panel functionality since we moved the content
    setTimeout(() => {
      // Re-cache all admin elements since they've moved
      cacheElements();
      
      // Initialize admin panel functionality
      initializeAdminPanel();
      
      console.log('Admin panel re-initialized in detail panel');
      
      // Reset the progress flag
      window._showEditNodesInProgress = false;
    }, 100);
  };

  // Helper function to verify admin panel availability
  const isAdminPanelAvailable = () => {
    return !!(document.getElementById('adminPanel') || 
              document.querySelector('.admin-panel') || 
              elements.adminPanel);
  };

  // Verify that critical DOM elements are available
  const verifyCriticalElements = () => {
    const criticalElements = [
      { name: 'detailPanel', element: elements.detailPanel },
      { name: 'adminPanel', element: elements.adminPanel },
      { name: 'toggleAdmin', element: elements.toggleAdmin }
    ];
    
    const missingElements = criticalElements.filter(item => !item.element);
    
    if (missingElements.length > 0) {
      console.warn('Critical UI elements not found:', missingElements.map(item => item.name));
      
      // Try to find admin panel by other means
      if (!elements.adminPanel) {
        const adminPanel = document.getElementById('adminPanel') || document.querySelector('.admin-panel');
        if (adminPanel) {
          elements.adminPanel = adminPanel;
          console.log('Admin panel found and assigned to elements');
        }
      }
    } else {
      console.log('All critical UI elements found successfully');
    }
  };

  // Fallback function to create a simple admin interface when main admin panel is not available
  const createFallbackAdminInterface = () => {
    console.log('Creating fallback admin interface');
    
    const container = document.createElement("div");
    container.classList.add("detail-content", "full-width");
    
    const header = document.createElement("div");
    header.classList.add("detail-header");
    
    const title = document.createElement("h2");
    title.textContent = "Edit Nodes (Fallback Mode)";
    header.appendChild(title);
    
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.classList.add("detail-close");
    closeButton.setAttribute("aria-label", "Close panel");
    closeButton.dataset.action = "close-panel";
    closeButton.textContent = "";
    header.appendChild(closeButton);
    
    container.appendChild(header);
    
    // Create a simple admin interface
    const adminContent = document.createElement("div");
    adminContent.classList.add("detail-admin-content", "fallback-admin");
    
    const message = document.createElement("div");
    message.classList.add("admin-message");
    message.innerHTML = `
      <p><strong>Admin panel is temporarily unavailable.</strong></p>
      <p>Please try refreshing the page or check if the admin panel is properly loaded.</p>
      <p>If the issue persists, the admin functionality may need to be reinitialized.</p>
    `;
    
    const refreshButton = document.createElement("button");
    refreshButton.type = "button";
    refreshButton.classList.add("btn", "btn-primary");
    refreshButton.textContent = "Retry Loading Admin Panel";
    refreshButton.addEventListener("click", () => {
      // Try to reinitialize the admin panel
      setTimeout(() => {
        showEditNodesInDetailPanel();
      }, 100);
    });
    
    adminContent.appendChild(message);
    adminContent.appendChild(refreshButton);
    
    container.appendChild(adminContent);
    
    // Clear and populate detail panel
    elements.detailPanel.innerHTML = "";
    elements.detailPanel.appendChild(container);
    elements.detailPanel.classList.add("expanded");
    
    // Set flag to prevent map focus during admin panel transitions
    window._adminPanelTransition = true;
    document.body.classList.add("detail-expanded");
    
    // Clear the flag after a short delay
    setTimeout(() => {
      window._adminPanelTransition = false;
    }, 500);
    
    console.log('Fallback admin interface created');
  };

  const showAdminInfoInDetailPanel = () => {
    if (!elements.detailPanel) return;
    
    // Show detail panel
    elements.detailPanel.style.display = "flex";
    elements.detailPanel.classList.add("active");
    
    // Mark that we're showing admin content
    showingAdminContent = true;
    
    // Create admin info content
    const container = document.createElement("div");
    container.classList.add("detail-content", "full-width");
    
    const header = document.createElement("div");
    header.classList.add("detail-header");
    
    const title = document.createElement("h2");
    title.textContent = "Admin Mode";
    header.appendChild(title);
    
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.classList.add("detail-close");
    closeButton.setAttribute("aria-label", "Close panel");
    closeButton.dataset.action = "close-panel";
    closeButton.textContent = "";
    header.appendChild(closeButton);
    
    container.appendChild(header);
    
    // Add admin info content
    const content = document.createElement("div");
    content.innerHTML = `
      <div class="admin-info-content">
        <div class="admin-info-section">
          <h3>🚀 Organization Chart Tool</h3>
          <p>A modern, interactive web application for visualizing and managing organizational structures. Built with vanilla JavaScript, D3.js, and Supabase.</p>
        </div>
        
        <div class="admin-info-section">
          <h3>📋 Available Features</h3>
          <ul class="feature-list">
            <li><strong>Tree View:</strong> Navigate your organization hierarchy with an intuitive tree structure</li>
            <li><strong>Map View:</strong> See the big picture with D3.js-powered force-directed graph</li>
            <li><strong>User Management:</strong> Manage users and permissions (click Users button)</li>
            <li><strong>Theme Editor:</strong> Customize colors, fonts, and branding (click Edit Theme button)</li>
            <li><strong>Node Editor:</strong> Create, edit, and manage organization nodes (click Edit Nodes button)</li>
            <li><strong>Metrics & Analytics:</strong> Track KPIs, budgets, and performance indicators</li>
            <li><strong>Relationship Mapping:</strong> Define and visualize complex relationships</li>
          </ul>
        </div>
        
        <div class="admin-info-section">
          <h3>🔧 Technical Implementation</h3>
          <p>This application is built with modern web technologies and is designed to be easily customizable and extensible:</p>
          <ul class="tech-list">
            <li><strong>Frontend:</strong> Vanilla JavaScript, D3.js, CSS Grid & Flexbox</li>
            <li><strong>Backend:</strong> Supabase (PostgreSQL, Authentication, Real-time)</li>
            <li><strong>Storage:</strong> Local storage for demo mode, Supabase for production</li>
            <li><strong>Responsive:</strong> Mobile-optimized with touch-friendly interface</li>
          </ul>
        </div>
        
        <div class="admin-info-section">
          <h3>📚 Resources & Documentation</h3>
          <div class="resource-links">
            <a href="https://github.com/rian010194/OrgVis" target="_blank" rel="noopener noreferrer" class="resource-link">
              <span class="link-icon">📁</span>
              <span class="link-text">GitHub Repository</span>
            </a>
            <a href="https://github.com/rian010194/OrgVis/blob/main/docs/index.md" target="_blank" rel="noopener noreferrer" class="resource-link">
              <span class="link-icon">📖</span>
              <span class="link-text">Documentation</span>
            </a>
            <a href="https://github.com/rian010194/OrgVis/issues" target="_blank" rel="noopener noreferrer" class="resource-link">
              <span class="link-icon">🐛</span>
              <span class="link-text">Report Issues</span>
            </a>
            <a href="https://github.com/rian010194/OrgVis/discussions" target="_blank" rel="noopener noreferrer" class="resource-link">
              <span class="link-icon">💬</span>
              <span class="link-text">Discussions</span>
            </a>
          </div>
        </div>
        
        <div class="admin-info-section">
          <h3>🎯 Use Cases</h3>
          <p>Perfect for companies, non-profits, educational institutions, and government organizations that need to:</p>
          <ul class="use-case-list">
            <li>Visualize corporate hierarchies and organizational structures</li>
            <li>Track department performance and resource allocation</li>
            <li>Manage organizational changes during growth or restructuring</li>
            <li>Map academic departments and administrative structures</li>
            <li>Organize government agencies and public service delivery</li>
            <li>Manage volunteer networks and community impact</li>
          </ul>
        </div>
        
        <div class="admin-info-section">
          <h3>⚡ Quick Actions</h3>
          <p>Use the buttons in the header to access different features:</p>
          <div class="quick-actions">
            <div class="action-item">
              <span class="action-icon">👥</span>
              <span class="action-text"><strong>Users:</strong> Manage users and permissions</span>
            </div>
            <div class="action-item">
              <span class="action-icon">🎨</span>
              <span class="action-text"><strong>Edit Theme:</strong> Customize colors and branding</span>
            </div>
            <div class="action-item">
              <span class="action-icon">✏️</span>
              <span class="action-text"><strong>Edit Nodes:</strong> Create and edit organization nodes</span>
            </div>
          </div>
        </div>
      </div>
    `;
    
    container.appendChild(content);
    
    // Clear and populate detail panel
    elements.detailPanel.innerHTML = "";
    elements.detailPanel.appendChild(container);
    elements.detailPanel.classList.add("expanded");
    
    // Set flag to prevent map focus during admin panel transitions
    window._adminPanelTransition = true;
    document.body.classList.add("detail-expanded");
    
    // Clear the flag after a short delay
    setTimeout(() => {
      window._adminPanelTransition = false;
    }, 500);
  };

  const showProfileInfoInDetailPanel = () => {
    if (!elements.detailPanel) return;
    
    // Show detail panel
    elements.detailPanel.style.display = "flex";
    elements.detailPanel.classList.add("active");
    
    // Create profile info content
    const container = document.createElement("div");
    container.classList.add("detail-content", "full-width");
    
    const header = document.createElement("div");
    header.classList.add("detail-header");
    
    const title = document.createElement("h2");
    title.textContent = "My Profile";
    header.appendChild(title);
  
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.classList.add("detail-close");
    closeButton.setAttribute("aria-label", "Close panel");
    closeButton.dataset.action = "close-panel";
    closeButton.textContent = "";
    header.appendChild(closeButton);
    
    container.appendChild(header);
    
    // Add profile info content
    const content = document.createElement("div");
    content.innerHTML = `
      <div class="profile-info-content">
        <div class="profile-info-section">
          <div class="profile-avatar">
            <div class="profile-avatar-circle">JD</div>
            <div class="profile-avatar-info">
              <h4>John Doe</h4>
              <p>Software Engineer</p>
            </div>
          </div>
          <p>Welcome to your profile! Here you can view your personal information, activity, and manage your account settings.</p>
        </div>
        
        <div class="profile-info-section">
          <h3>📊 My Statistics</h3>
          <div class="profile-stats">
            <div class="profile-stat">
              <span class="profile-stat-number">12</span>
              <span class="profile-stat-label">Projects</span>
            </div>
            <div class="profile-stat">
              <span class="profile-stat-number">8</span>
              <span class="profile-stat-label">Team Members</span>
            </div>
            <div class="profile-stat">
              <span class="profile-stat-number">24</span>
              <span class="profile-stat-label">Tasks Completed</span>
            </div>
            <div class="profile-stat">
              <span class="profile-stat-number">95%</span>
              <span class="profile-stat-label">Performance</span>
            </div>
          </div>
        </div>
        
        <div class="profile-info-section">
          <h3>⚡ Quick Actions</h3>
          <div class="profile-actions">
            <button class="profile-action-btn" onclick="alert('Edit Profile clicked')">
              <span class="profile-action-icon">✏️</span>
              <span>Edit Profile</span>
            </button>
            <button class="profile-action-btn" onclick="alert('Change Password clicked')">
              <span class="profile-action-icon">🔒</span>
              <span>Change Password</span>
            </button>
            <button class="profile-action-btn" onclick="alert('Notification Settings clicked')">
              <span class="profile-action-icon">🔔</span>
              <span>Notification Settings</span>
            </button>
            <button class="profile-action-btn" onclick="alert('Privacy Settings clicked')">
              <span class="profile-action-icon">🛡️</span>
              <span>Privacy Settings</span>
            </button>
          </div>
        </div>
        
        <div class="profile-info-section">
          <h3>📈 Recent Activity</h3>
          <ul class="profile-recent-activity">
            <li class="profile-activity-item">
              <span class="profile-activity-icon">✅</span>
              <div class="profile-activity-content">
                <p class="profile-activity-text">Completed project milestone</p>
                <p class="profile-activity-time">2 hours ago</p>
              </div>
            </li>
            <li class="profile-activity-item">
              <span class="profile-activity-icon">👥</span>
              <div class="profile-activity-content">
                <p class="profile-activity-text">Joined team meeting</p>
                <p class="profile-activity-time">1 day ago</p>
              </div>
            </li>
            <li class="profile-activity-item">
              <span class="profile-activity-icon">📝</span>
              <div class="profile-activity-content">
                <p class="profile-activity-text">Updated project documentation</p>
                <p class="profile-activity-time">3 days ago</p>
              </div>
            </li>
            <li class="profile-activity-item">
              <span class="profile-activity-icon">🎯</span>
              <div class="profile-activity-content">
                <p class="profile-activity-text">Set new quarterly goals</p>
                <p class="profile-activity-time">1 week ago</p>
              </div>
            </li>
          </ul>
        </div>
        
        <div class="profile-info-section">
          <h3>ℹ️ Account Information</h3>
          <p><strong>Email:</strong> john.doe@company.com</p>
          <p><strong>Department:</strong> Engineering</p>
          <p><strong>Role:</strong> Senior Software Engineer</p>
          <p><strong>Member since:</strong> January 2023</p>
          <p><strong>Last login:</strong> Today at 9:30 AM</p>
        </div>
      </div>
    `;
    
    container.appendChild(content);
    
    // Clear and populate detail panel
    elements.detailPanel.innerHTML = "";
    elements.detailPanel.appendChild(container);
    elements.detailPanel.classList.add("expanded");
    
    // Set flag to prevent map focus during admin panel transitions
    window._adminPanelTransition = true;
    document.body.classList.add("detail-expanded");
    
    // Clear the flag after a short delay
    setTimeout(() => {
      window._adminPanelTransition = false;
    }, 500);
  };

  // Mobile hamburger menu functionality (removed duplicate - using functions defined above)

  // Test function removed - not needed in production

  return {

    init: () => {
      init();
    },

    openNode,

    getSelectedNodeId: () => selectedNodeId,

    isAdminPanelAvailable,

    showAdminButtons,

    hideAdminButtons

  };

})();

window.OrgUI = OrgUI;
