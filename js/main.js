import { initOrgChart, updateEdges, addNode, nodes, edges } from './orgchart.js';
import { showDetails } from './panel.js';

// --- Global state ---
let viewerNodeId = null;
let selectedNodeId = null;

const interactionLibrary = {
  "VD": [{ label: "Skicka årsrapport", description: "Skicka rapport till styrelse", targetNodeId: null }],
  "Vice VD": [{ label: "Skicka kvartalsrapport", description: "Skicka rapport till VD", targetNodeId: null }],
  "Avdelningschef": [],
  "Teammedlem": [],
  "Admin": []
};

window.interactionLibrary = interactionLibrary;
window.saveOrg = saveOrg;
window.orgchartZoom = 1;

// --- Init ---
async function init() {
  const res = await fetch('http://localhost:3000/api/org', { cache: 'no-store' });
  const data = await res.json();

  // Lägg till Admin om saknas
  if (!data.nodes.find(n => n.role === 'Admin')) {
    data.nodes.push({
      id: `node-${Date.now()}`,
      title: 'Admin',
      role: 'Admin',
      x: 0, y: 0,
      ansvar: [], outputs: [], inputs: [], interactions: []
    });
  }

  nodes.length = 0;
  nodes.push(...data.nodes.map(n => ({ ...n, interactions: Array.isArray(n.interactions) ? n.interactions : [] })));
  edges.length = 0;
  edges.push(...data.edges);

  initOrgChart({ nodes, edges });
  window.addEventListener('resize', updateEdges);

  setupRoleSelect();
  setupPingButton();
  setupAddNodeButton();
  setupWorkflowButtonHandlers();

  setInterval(updateEdges, 200);
  setupPanAndZoom();
}

// --- Rollval ---
function setupRoleSelect() {
  const roleSelect = document.getElementById('viewerRole');
  roleSelect.innerHTML = '';
  nodes.forEach(n => {
    const opt = document.createElement('option');
    opt.value = n.id;
    opt.text = `${n.title} (${n.role})`;
    roleSelect.appendChild(opt);
  });

  const adminNode = nodes.find(n => n.role === 'Admin');
  viewerNodeId = adminNode?.id || nodes[0]?.id || null;
  window.viewerNodeId = viewerNodeId;
  roleSelect.value = viewerNodeId;

  roleSelect.addEventListener('change', e => {
    viewerNodeId = e.target.value;
    window.viewerNodeId = viewerNodeId;

    if (selectedNodeId) {
      showDetails(
        nodes.find(n => n.id === selectedNodeId),
        viewerNodeId,
        interactionLibrary,
        saveOrg,
        nodes,
        edges,
        initOrgChart
      );
    }

    initOrgChart({ nodes, edges });
  });
}

// --- Ping ---
function setupPingButton() {
  const btn = document.getElementById('pingBtn');
  btn.replaceWith(btn.cloneNode(true));
  document.getElementById('pingBtn').addEventListener('click', () => {
    edges.slice(0,3).forEach((e,i) => {
      const path = document.getElementById('edge-' + i);
      if (!path) return;
      path.classList.add('active');
      setTimeout(() => path.classList.remove('active'), 1500);
    });
  });
}

// --- Lägg till nod ---
function setupAddNodeButton() {
  const roleSelect = document.getElementById('viewerRole');
  const btn = document.getElementById('addNodeBtn');
  btn.replaceWith(btn.cloneNode(true));
  document.getElementById('addNodeBtn').addEventListener('click', async () => {
    const viewerNode = nodes.find(n => n.id === viewerNodeId);
    if (!viewerNode || (viewerNode.role !== 'VD' && viewerNode.role !== 'Admin')) {
      return alert('Endast VD/Admin kan skapa nod.');
    }

    const title = prompt('Titel för ny användare:', 'Ny användare');
    const role = prompt('Roll:', 'Teammedlem');
    if (!title || !role) return;

    const parentNode = nodes.find(n => n.role === 'VD');
    const parentId = parentNode?.id || null;

    const newNode = addNode(title, role, parentId);
    await saveOrg();

    const opt = document.createElement('option');
    opt.value = newNode.id;
    opt.text = `${newNode.title} (${newNode.role})`;
    roleSelect.appendChild(opt);
  });
}

// --- Workflow-knappar ---
function setupWorkflowButtonHandlers() {
  const workflowBtn = document.getElementById('workflowBtn');
  const closeBtn = document.getElementById('closeWorkflow');
  const stage = document.getElementById('stage');
  const workflowStage = document.getElementById('workflowStage');

  // Ta bort gamla listeners
  workflowBtn.replaceWith(workflowBtn.cloneNode(true));
  closeBtn.replaceWith(closeBtn.cloneNode(true));

  const newWorkflowBtn = document.getElementById('workflowBtn');
  const newCloseBtn = document.getElementById('closeWorkflow');

  newWorkflowBtn.addEventListener('click', () => {
    stage.style.display = 'none';
    workflowStage.style.display = 'block';
    newWorkflowBtn.style.display = 'none';
    newCloseBtn.style.display = 'inline-block';
    if (window.initWorkflow) window.initWorkflow();
  });

  newCloseBtn.addEventListener('click', () => {
    workflowStage.style.display = 'none';
    stage.style.display = 'block';
    newCloseBtn.style.display = 'none';
    newWorkflowBtn.style.display = 'inline-block';
  });
}

// --- Spara org ---
async function saveOrg() {
  try {
    await fetch('http://localhost:3000/api/org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes, edges })
    });
  } catch (err) {
    console.error('Kunde inte spara org:', err);
  }
}

// --- Pan & zoom ---
function setupPanAndZoom() {
  const stage = document.getElementById('stage');
  const content = document.getElementById('orgchartContent');
  let isPanning = false;
  let startX, startY;
  let currentX = 0, currentY = 0;

  stage.addEventListener('mousedown', e => {
    if (e.target.closest('.node')) return;
    isPanning = true;
    startX = e.clientX - currentX;
    startY = e.clientY - currentY;
    stage.style.cursor = 'grab';
  });
  stage.addEventListener('mousemove', e => {
    if (!isPanning) return;
    currentX = e.clientX - startX;
    currentY = e.clientY - startY;
    content.style.transform = `translate(${currentX}px,${currentY}px) scale(${window.orgchartZoom})`;
  });
  stage.addEventListener('mouseup', () => { isPanning = false; stage.style.cursor = 'default'; });
  stage.addEventListener('mouseleave', () => { isPanning = false; stage.style.cursor = 'default'; });

  stage.addEventListener('wheel', e => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    let zoom = window.orgchartZoom;
    zoom += e.deltaY * -0.001;
    zoom = Math.min(Math.max(0.2, zoom), 3);
    window.orgchartZoom = zoom;
    content.style.transform = `translate(${currentX}px,${currentY}px) scale(${zoom})`;
  });
}

window.addEventListener('DOMContentLoaded', init);
