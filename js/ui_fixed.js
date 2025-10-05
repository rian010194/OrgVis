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

    createTypeSelect: null,

    createResponsibilities: null,

    createActivities: null,

    createOutcomes: null,

    createSupportOffice: null,

    editTypeSelect: null,

    editResponsibilities: null,

    editActivities: null,

    editOutcomes: null,

    editSupportOffice: null,

    adminTabs: [],

    adminPanels: []

  };

  const init = () => {

    cacheElements();

    bindStaticListeners();

    updateAdminTabsUI();

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

    elements.deleteNodeButton = document.getElementById("adminDeleteNodeButton");

    elements.adminParentSelect = document.getElementById("adminCreateParent");

    elements.editParentSelect = document.getElementById("adminEditParent");

    elements.appStatus = document.getElementById("appStatus");

    elements.metricsSection = document.getElementById("adminMetricsSection");

    elements.metricsList = document.getElementById("adminMetricsList");

    elements.metricsAddButton = document.getElementById("adminAddMetricButton");

    elements.metricsCreateButton = document.getElementById("adminCreatePieButton");

    elements.metricsSaveButton = document.getElementById("adminSaveMetricsButton");

    elements.createTypeSelect = document.getElementById("adminCreateType");

    elements.createResponsibilities = document.getElementById("adminCreateResponsibilities");

    elements.createActivities = document.getElementById("adminCreateActivities");

    elements.createOutcomes = document.getElementById("adminCreateOutcomes");

    elements.createSupportOffice = document.getElementById("adminCreateSupportOffice");

    elements.editTypeSelect = document.getElementById("adminEditType");

    elements.editResponsibilities = document.getElementById("adminEditResponsibilities");

    elements.editActivities = document.getElementById("adminEditActivities");

    elements.editOutcomes = document.getElementById("adminEditOutcomes");

    elements.editSupportOffice = document.getElementById("adminEditSupportOffice");

    elements.adminTabs = Array.from(document.querySelectorAll('[data-admin-tab]')) || [];

    elements.adminPanels = Array.from(document.querySelectorAll('[data-admin-panel]')) || [];

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

      elements.treeContainer.innerHTML = '<p class="empty-state">Ingen organisationsdata laddad.</p>';

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

    if (elements.detailPanel) {

      elements.detailPanel.classList.remove("expanded");

    }

    document.body.classList.remove("detail-expanded");

    expandAncestors(nodeId);

    if (elements.editNodeSelect) {

      elements.editNodeSelect.value = nodeId;

      populateEditForm();

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

      elements.detailPanel.innerHTML = '<div class="detail-empty">VÃƒÂ¤lj en nod i trÃƒÂ¤det fÃƒÂ¶r detaljer.</div>';

      return;

    }

    const node = OrgStore.getNode(selectedNodeId);

    if (!node) {

      selectedNodeId = null;

      renderDetailPanel();

      return;

    }

    if (elements.detailPanel.dataset.nodeId !== node.id) {

      elements.detailPanel.classList.remove("expanded");

      document.body.classList.remove("detail-expanded");

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

    closeButton.setAttribute("aria-label", "StÃƒÂ¤ng panel");

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

    appendDetailList(container, "Macro  Responsibilities", node.responsibilities);

    appendDetailList(container, "Spending time on", node.activities);

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

      heading.textContent = "Supportfunktioner";

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

    container.appendChild(buildRelationList("Inputs", node.inputs, "from"));

    container.appendChild(buildRelationList("Outputs", node.outputs, "to"));

    elements.detailPanel.appendChild(container);

    const toggleButton = document.createElement("button");

    toggleButton.type = "button";

    toggleButton.classList.add("detail-toggle");

    toggleButton.dataset.action = "toggle-detail";

    const isExpanded = elements.detailPanel.classList.contains("expanded");

    toggleButton.textContent = isExpanded ? "Visa mindre" : "Visa mer";

    elements.detailPanel.appendChild(toggleButton);

    elements.detailPanel.classList.add("active");

  };

  const buildRelationList = (title, relations, key) => {

    const section = document.createElement("section");

    section.classList.add("detail-section");

    const heading = document.createElement("h3");

    heading.textContent = title;

    section.appendChild(heading);

    if (!relations || relations.length === 0) {

      const empty = document.createElement("p");

      empty.classList.add("detail-empty");

      empty.textContent = "Inga relationer";

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

        span.textContent = relation[key] || "OkÃƒÂ¤nd nod";

        li.appendChild(span);

      }

      if (relation.desc) {

        const desc = document.createElement("span");

        desc.classList.add("relation-desc");

        desc.textContent = " ÃƒÂ¢ " + relation.desc;

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

      target.textContent = isExpanded ? "Visa mindre" : "Visa mer";

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

      elements.relationView.innerHTML = '<p class="empty-state">Inga relationer att visa ÃƒÂ¤nnu.</p>';

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

  };

  const toggleAdminPanel = () => {

    if (!elements.adminPanel) {

      return;

    }

    const willOpen = !elements.adminPanel.classList.contains("open");

    elements.adminPanel.classList.toggle("open", willOpen);

    if (elements.toggleAdmin) {

      elements.toggleAdmin.classList.toggle("active", willOpen);

      elements.toggleAdmin.setAttribute("aria-pressed", String(willOpen));

    }

    // Show/hide Users button based on admin state
    const userManagementBtn = document.getElementById('userManagementBtn');
    if (userManagementBtn) {
      if (willOpen) {
        userManagementBtn.classList.remove('hidden');
      } else {
        userManagementBtn.classList.add('hidden');
      }
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

      option.textContent = "ÃƒÂ¢";

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

  const populateEditForm = () => {

    if (!elements.editForm || !elements.editNodeSelect) {

      return;

    }

    const nodeId = elements.editNodeSelect.value;

    const nameInput = elements.editForm.querySelector("input[name='name']");

    const typeSelect = elements.editTypeSelect || elements.editForm.querySelector("select[name='type']");

    const roleInput = elements.editForm.querySelector("textarea[name='role']");

    const responsibilitiesInput = elements.editResponsibilities || elements.editForm.querySelector("textarea[name='responsibilities']");

    const activitiesInput = elements.editActivities || elements.editForm.querySelector("textarea[name='activities']");

    const outcomesInput = elements.editOutcomes || elements.editForm.querySelector("textarea[name='outcomes']");

    const supportOfficeInput = elements.editSupportOffice || elements.editForm.querySelector("input[name='supportOffice']");

    if (!nodeId) {

      if (nameInput) nameInput.value = "";

      if (typeSelect) typeSelect.value = "Unit";

      if (roleInput) roleInput.value = "";

      if (responsibilitiesInput) responsibilitiesInput.value = "";

      if (activitiesInput) activitiesInput.value = "";

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

    if (activitiesInput) activitiesInput.value = formatMultiline(node.activities);

    if (outcomesInput) outcomesInput.value = formatMultiline(node.outcomes);

    if (supportOfficeInput) supportOfficeInput.value = node.supportOffice || "";

    if (elements.editParentSelect) {

      elements.editParentSelect.value = node.parent || "";

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

    const activities = parseMultiline(data.get("activities"));

    const outcomes = parseMultiline(data.get("outcomes"));

    if (!id || !name) {

      displayAdminMessage("Id och namn mÃƒÂ¥ste anges fÃƒÂ¶r en ny nod.", "error");

      return;

    }

    try {

      OrgStore.addNode({ id, name, type, parent, role, supportOffice, responsibilities, activities, outcomes });

      form.reset();

      if (elements.createTypeSelect) {

        elements.createTypeSelect.value = "Unit";

      }

      if (elements.createSupportOffice) {

        elements.createSupportOffice.value = "";

      }

      displayAdminMessage("Nod " + name + " skapades.", "success");

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

      displayAdminMessage("VÃƒÂ¤lj en nod att uppdatera.", "error");

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

      activities: parseMultiline(data.get("activities")),

      outcomes: parseMultiline(data.get("outcomes"))

    };

    try {

      OrgStore.updateNode(id, updates);

      displayAdminMessage("Nod uppdaterad.", "success");

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

      displayAdminMessage("VÃƒÂ¤lj bÃƒÂ¥de frÃƒÂ¥n- och till-nod.", "error");

      return;

    }

    if (from === to) {

      displayAdminMessage("Relationer mÃƒÂ¥ste gÃƒÂ¥ mellan tvÃƒÂ¥ olika noder.", "error");

      return;

    }

    try {

      OrgStore.addLink({ from, to, desc });

      form.reset();

      displayAdminMessage("Relation tillagd.", "success");

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

      displayAdminMessage("VÃƒÂ¤lj bÃƒÂ¥de frÃƒÂ¥n- och till-nod fÃƒÂ¶r att ta bort relationen.", "error");

      return;

    }

    try {

      OrgStore.removeLink({ from, to });

      displayAdminMessage("Relation borttagen.", "success");

    } catch (error) {

      displayAdminMessage(error.message, "error");

    }

  };

  const handleDeleteNode = (event) => {

    event.preventDefault();

    if (!elements.editNodeSelect || !elements.editNodeSelect.value) {

      displayAdminMessage("VÃƒÂ¤lj en nod att ta bort.", "error");

      return;

    }

    const nodeId = elements.editNodeSelect.value;

    const node = OrgStore.getNode(nodeId);

    if (!node) {

      displayAdminMessage("Noden hittades inte.", "error");

      return;

    }

        const confirmed = window.confirm("r du sÃƒÂ¤ker pÃƒÂ¥ att du vill ta bort " + node.name + "?");

    if (!confirmed) {

      return;

    }

    try {

      OrgStore.removeNode(nodeId);

      if (selectedNodeId === nodeId) {

        selectedNodeId = null;

      }

      displayAdminMessage("Nod borttagen.", "success");

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

    const entries = node.metrics

      ? Object.entries(node.metrics).filter(([key, value]) => key && Number.isFinite(Number(value)))

      : [];

    if (!entries.length) {

      elements.metricsList.appendChild(createMetricsEmpty());

      return;

    }

    entries.forEach(([key, value]) => {

      elements.metricsList.appendChild(createMetricRow(key, value));

    });

  };

  const handleCreatePieChart = () => {

    if (!elements.metricsList || !elements.metricsSection || elements.metricsSection.classList.contains("disabled")) {

      return;

    }

    removeMetricsEmpty();

    let row = elements.metricsList.querySelector(".metrics-row");

    if (!row) {

      row = createMetricRow("", "");

      elements.metricsList.appendChild(row);

    }

    const keyInput = row.querySelector('input[name="metricKey"]');

    if (keyInput) {

      keyInput.focus();

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

      displayAdminMessage("VÃƒÂ¤lj en nod att uppdatera.", "error");

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

      OrgStore.updateNode(nodeId, { metrics });

      displayAdminMessage("Nyckeltal sparade.", "success");

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

    keyInput.placeholder = "Namn";

    keyInput.value = key;

    const valueInput = document.createElement("input");

    valueInput.type = "number";

    valueInput.name = "metricValue";

    valueInput.placeholder = "VÃƒÂ¤rde";

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

    empty.textContent = "Inga nyckeltal ÃƒÂ¤nnu.";

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

    heading.textContent = "Nyckeltal";

    section.appendChild(heading);

    const body = document.createElement("div");

    body.classList.add("detail-metrics-body");

    section.appendChild(body);

    const metrics = node.metrics || null;

    const entries = metrics

      ? Object.entries(metrics)

          .map(([key, value]) => ({ key, value: Number(value) || 0 }))

          .filter((entry) => entry.value > 0)

      : [];

    if (!entries.length) {

      const empty = document.createElement("p");

      empty.classList.add("detail-empty");

      empty.textContent = "Inga metriker definierade ÃƒÂ¤nnu.";

      body.appendChild(empty);

      return section;

    }

    const chartContainer = document.createElement("div");

    chartContainer.classList.add("detail-metrics-chart");

    body.appendChild(chartContainer);

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

      const percent = total > 0 ? Math.round((entry.value / total) * 100) : 0;

            value.textContent = entry.value + " (" + percent + "%)";

      item.appendChild(swatch);

      item.appendChild(label);

      item.appendChild(value);

      legend.appendChild(item);

    });

    body.appendChild(legend);

    requestAnimationFrame(() => {

      renderMetricsChart(chartContainer, entries, total);

    });

    return section;

  }

  function renderMetricsChart(container, entries, total) {

    if (!container) {

      return;

    }

    if (typeof d3 === "undefined" || !d3.pie) {

      container.textContent = "Aktivera D3.js fÃƒÂ¶r att visa diagrammet.";

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

        .text(String(total));

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
