import { showDetails } from './panel.js';

export let nodes = [];
export let edges = [];

const stage = document.getElementById('stage');
const svg = document.getElementById('edges');
const nodesContainer = document.getElementById('nodes');

export let editMode = false;

// Pan och zoom
let isPanning = false;
let startX, startY;
let currentX = 0, currentY = 0;
let scale = 1;
const scaleFactor = 0.1;

// Initiera orgchart
export function initOrgChart(orgData) {
  nodes = orgData.nodes.map(n => ({
    ...n,
    interactions: Array.isArray(n.interactions) ? n.interactions : [],
    width: 0,
    height: 0
  }));
  edges = orgData.edges;

  nodesContainer.innerHTML = '';
  svg.innerHTML = '';

  // Skapa DOM-element först
  nodes.forEach(n => createNodeElement(n));

  // Mät faktiska nodstorlekar
  nodes.forEach(n => {
    const el = document.getElementById(n.id);
    if (el) {
      const rect = el.getBoundingClientRect();
      n.width = rect.width;
      n.height = rect.height;
    }
  });

  layoutNodesHierarchical();
  updateNodePositions();
  createEdges();
  updateEdges();
}

// Flytta noder i DOM efter layout
function updateNodePositions() {
  nodes.forEach(n => {
    const el = document.getElementById(n.id);
    if (el) {
      el.style.left = n.x + 'px';
      el.style.top = n.y + 'px';
    }
  });
}

// Skapa HTML för nod
function createNodeElement(n) {
  const div = document.createElement('div');
  div.className = 'node';
  div.id = n.id;
  div.innerHTML = `
    <div>
      <div class="title">${n.title}</div>
      <div class="sub">${n.role}</div>
    </div>
  `;
  nodesContainer.appendChild(div);

  const btnContainer = document.createElement('div');
  btnContainer.className = 'btn-container';
  div.appendChild(btnContainer);

  const viewerNodeId = window.viewerNodeId;

  n.interactions?.forEach(inter => {
    if (n.id !== inter.toNodeId) return;
    if (viewerNodeId !== inter.toNodeId && viewerNodeId !== inter.fromNodeId) return;

    const btn = document.createElement('button');
    btn.className = 'btn small visible';
    btn.innerText = inter.label;
    btn.title = inter.description;

    if (viewerNodeId === inter.toNodeId) {
      btn.style.backgroundColor = '#10b981';
      btn.style.color = '#fff';
    } else if (viewerNodeId === inter.fromNodeId) {
      btn.style.backgroundColor = '#2b6df6';
      btn.style.color = '#fff';
    }

    btn.onclick = () => {
      const fromNode = nodes.find(nd => nd.id === inter.fromNodeId);
      const toNode = nodes.find(nd => nd.id === inter.toNodeId);
      alert(`${fromNode?.title || 'Okänd'} → ${toNode?.title || 'Okänd'}: ${inter.label}`);
    };

    btnContainer.appendChild(btn);
  });

  div.addEventListener('click', () => {
    document.querySelectorAll('.node').forEach(nd => nd.style.boxShadow = '0 6px 18px rgba(11,15,30,0.06)');
    div.style.boxShadow = '0 12px 30px rgba(43,109,246,0.12)';

    showDetails(
      n,
      window.viewerNodeId,
      window.interactionLibrary,
      window.saveOrg,
      nodes,
      edges,
      initOrgChart
    );
  });
}

// Hierarkisk layout med korrekt avstånd
function layoutNodesHierarchical() {
  const levelMap = {};
  const parentMap = {};

  edges.forEach(e => {
    if (!parentMap[e.to]) parentMap[e.to] = [];
    parentMap[e.to].push(e.from);
  });

  const rootNodes = nodes.filter(n => !parentMap[n.id] || parentMap[n.id].length === 0);

  function assignLevel(node, level) {
    node.level = level;
    if (!levelMap[level]) levelMap[level] = [];
    levelMap[level].push(node);

    const children = edges
      .filter(e => e.from === node.id)
      .map(e => nodes.find(n => n.id === e.to));
    children.forEach(c => assignLevel(c, level + 1));
  }

  rootNodes.forEach(r => assignLevel(r, 0));

  const rootStyle = getComputedStyle(document.documentElement);
  const verticalGap = parseInt(rootStyle.getPropertyValue('--node-gap-y')) || 200;
  const horizontalGap = parseInt(rootStyle.getPropertyValue('--node-gap-x')) || 350;

  Object.keys(levelMap).forEach(level => {
    const nodesInLevel = levelMap[level];
    let totalWidth = nodesInLevel.reduce((sum, n) => sum + n.width, 0) + (nodesInLevel.length - 1) * horizontalGap;
    let startX = (stage.clientWidth - totalWidth) / 2;
    if (startX < 20) startX = 20;

    let x = startX;
    nodesInLevel.forEach((n) => {
      n.x = x;
      n.y = 50 + level * verticalGap;
      x += n.width + horizontalGap;
    });
  });
}

// Skapa edges i SVG
function createEdges() {
  edges.forEach((e, i) => {
    if (!document.getElementById('edge-' + i)) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute('id', 'edge-' + i);
      path.setAttribute('class', 'edge');
      svg.appendChild(path);
    }
  });
}

// Uppdatera edges
export function updateEdges() {
  edges.forEach((e, i) => {
    const fromNode = nodes.find(n => n.id === e.from);
    const toNode = nodes.find(n => n.id === e.to);
    const edgeEl = document.getElementById('edge-' + i);
    if (!fromNode || !toNode || !edgeEl) return;

    const x1 = fromNode.x + fromNode.width / 2;
    const y1 = fromNode.y + fromNode.height / 2;
    const x2 = toNode.x + toNode.width / 2;
    const y2 = toNode.y + toNode.height / 2;

    const qx = x1 + (x2 - x1) / 2;
    const qy = y1 + (y2 - y1) / 2;

    edgeEl.setAttribute('d', `M${x1} ${y1} Q${qx} ${qy} ${x2} ${y2}`);
  });
}

// Ping-effekt på edges
export function pingEdges(indices = [0,1,2], duration = 1500) {
  indices.forEach(i => {
    const edgeEl = document.getElementById('edge-' + i);
    if (!edgeEl) return;
    edgeEl.classList.add('active');
    setTimeout(() => edgeEl.classList.remove('active'), duration);
  });
}

// Lägg till ny nod
export function addNode(title = "Ny nod", role = "Teammedlem", parentId = null) {
  const id = `node-${Date.now()}`;
  const newNode = { id, title, role, x: 0, y: 0, width:200, height:100, ansvar: [], outputs: [], inputs: [], interactions: [] };
  nodes.push(newNode);
  if (parentId) edges.push({ from: parentId, to: id });

  layoutNodesHierarchical();
  updateNodePositions();
  createEdges();
  updateEdges();

  return newNode;
}

// --- Panning ---
stage.addEventListener('mousedown', (e) => {
  if (e.target.closest('.node')) return;
  isPanning = true;
  startX = e.clientX - currentX;
  startY = e.clientY - currentY;
  stage.style.cursor = 'grab';
});
stage.addEventListener('mousemove', (e) => {
  if (!isPanning) return;
  currentX = e.clientX - startX;
  currentY = e.clientY - startY;
  orgchartContent.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scale})`;
  updateEdges();
});
stage.addEventListener('mouseup', () => { isPanning = false; stage.style.cursor='default'; });
stage.addEventListener('mouseleave', () => { isPanning = false; stage.style.cursor='default'; });

// --- Zoom med ctrl + scroll ---
stage.addEventListener('wheel', (e) => {
  if (!e.ctrlKey) return;
  e.preventDefault();
  const rect = orgchartContent.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;

  const prevScale = scale;
  scale += (e.deltaY < 0 ? 1 : -1) * scaleFactor;
  scale = Math.min(Math.max(scale, 0.2), 3);

  currentX -= offsetX * (scale - prevScale);
  currentY -= offsetY * (scale - prevScale);

  orgchartContent.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scale})`;
  updateEdges();
}, { passive: false });
