export function showDetails(nodeData, viewerNodeId, interactionLibrary, saveOrgCallback, nodes, edges, initOrgChart) {
  if (!nodeData) return;

  const panelEl = document.getElementById('panel');
  const detailsEl = document.getElementById('details');
  const actionArea = document.getElementById('actionArea');
  detailsEl.style.display = 'block';

  // --- DRAG & DROP ---
  const headerEl = panelEl.querySelector('.panel-header') || panelEl.querySelector('h2');
  let isDragging = false, offsetX = 0, offsetY = 0;

  headerEl.onmousedown = e => {
    isDragging = true;
    offsetX = e.clientX - panelEl.offsetLeft;
    offsetY = e.clientY - panelEl.offsetTop;
    panelEl.classList.add('dragging');
  };
  document.onmousemove = e => {
    if (!isDragging) return;
    panelEl.style.left = `${Math.max(0, e.clientX - offsetX)}px`;
    panelEl.style.top = `${Math.max(0, e.clientY - offsetY)}px`;
  };
  document.onmouseup = () => {
    if (!isDragging) return;
    isDragging = false;
    panelEl.classList.remove('dragging');
  };

  // --- RENDER FUNKTIONER ---
  function renderInteractionView() {
    panelEl.classList.remove('editing');
    panelEl.style.width = '360px';

    document.getElementById('d-title').innerText = nodeData.title || '';
    document.getElementById('d-role').innerText = nodeData.role || '';

    renderList('d-resp', nodeData.ansvar || []);
    renderList('d-outs', nodeData.outputs || []);
    renderList('d-ins', nodeData.inputs || []);

    const di = document.getElementById('d-interact');
    di.innerHTML = '';

    // Visa endast interaktioner för mottagarens nod
    nodeData.interactions?.forEach(inter => {
      if (!inter.toNodeId) return;
      if (nodeData.id !== inter.toNodeId) return; // bara mottagare
      if (viewerNodeId !== inter.fromNodeId && viewerNodeId !== inter.toNodeId) return; // viewer ej involverad

      const btn = document.createElement('button');
      btn.className = 'btn small';
      btn.innerText = inter.label;
      btn.title = inter.description;
      btn.style.margin = '2px';

      if (viewerNodeId === inter.fromNodeId) {
        btn.style.backgroundColor = '#2b6df6';
        btn.style.color = '#fff';
      } else if (viewerNodeId === inter.toNodeId) {
        btn.style.backgroundColor = '#10b981';
        btn.style.color = '#fff';
      }

      btn.onclick = () => {
        const fromNode = nodes.find(n => n.id === inter.fromNodeId);
        const toNode = nodes.find(n => n.id === inter.toNodeId);
        alert(`${fromNode?.title || 'Okänd'} → ${toNode?.title || 'Okänd'}: ${inter.label}`);
      };

      di.appendChild(btn);
    });

    // --- Admin kan redigera/ta bort nod ---
    actionArea.innerHTML = '';
    const loggedInNode = nodes.find(n => n.id === viewerNodeId);
    if (loggedInNode?.role === 'Admin') {
      const editBtn = document.createElement('button');
      editBtn.className = 'btn';
      editBtn.innerText = 'Redigera nod';
      editBtn.onclick = renderEditView;
      actionArea.appendChild(editBtn);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn secondary';
      removeBtn.style.marginLeft = '8px';
      removeBtn.innerText = 'Ta bort nod';
      removeBtn.onclick = () => {
        if (confirm('Är du säker på att ta bort denna nod?')) {
          const idx = nodes.findIndex(n => n.id === nodeData.id);
          if (idx !== -1) nodes.splice(idx, 1);
          for (let i = edges.length - 1; i >= 0; i--) {
            if (edges[i].from === nodeData.id || edges[i].to === nodeData.id) edges.splice(i, 1);
          }
          nodes.forEach(n => {
            n.interactions = n.interactions.filter(i => i.fromNodeId !== nodeData.id && i.toNodeId !== nodeData.id);
          });
          saveOrgCallback?.();
          initOrgChart({ nodes, edges });
          detailsEl.style.display = 'none';
        }
      };
      actionArea.appendChild(removeBtn);
    }
  }

  function renderEditView() {
    panelEl.classList.add('editing');
    panelEl.style.width = '720px';

    document.getElementById('d-title').innerHTML =
      `<input id="edit-title" type="text" value="${nodeData.title}" style="width:90%">`;
    document.getElementById('d-role').innerHTML =
      `<input id="edit-role" type="text" value="${nodeData.role}" style="width:90%">`;

    renderList('d-resp', nodeData.ansvar || [], true);
    renderList('d-outs', nodeData.outputs || [], true);
    renderList('d-ins', nodeData.inputs || [], true);

    const di = document.getElementById('d-interact');
    di.innerHTML = '<strong>Interaktioner:</strong><br>';
    nodeData.interactions = nodeData.interactions || [];

    nodeData.interactions.forEach((inter, idx) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.gap = '4px';
      row.style.marginBottom = '4px';

      const inputLabel = document.createElement('input');
      inputLabel.type = 'text';
      inputLabel.value = inter.label;
      inputLabel.placeholder = 'Knapptext';
      inputLabel.style.flex = '1';
      inputLabel.oninput = e => inter.label = e.target.value;

      const inputDesc = document.createElement('input');
      inputDesc.type = 'text';
      inputDesc.value = inter.description;
      inputDesc.placeholder = 'Beskrivning';
      inputDesc.style.flex = '2';
      inputDesc.oninput = e => inter.description = e.target.value;

      const targetSelect = document.createElement('select');
      targetSelect.style.flex = '1';
      const emptyOpt = document.createElement('option');
      emptyOpt.value = '';
      emptyOpt.text = '- Välj nod -';
      targetSelect.appendChild(emptyOpt);

      nodes.forEach(n => {
        if (n.id !== nodeData.id) {
          const opt = document.createElement('option');
          opt.value = n.id;
          opt.text = n.title;
          targetSelect.appendChild(opt);
        }
      });

      targetSelect.value = inter.toNodeId || '';
      targetSelect.onchange = e => {
        inter.toNodeId = e.target.value;
        inter.fromNodeId = nodeData.id;

        const targetNode = nodes.find(n => n.id === inter.toNodeId);
        if (targetNode && !targetNode.interactions.includes(inter)) {
          targetNode.interactions.push(inter);
        }
      };

      const delBtn = document.createElement('button');
      delBtn.innerText = '×';
      delBtn.onclick = () => { 
        nodeData.interactions.splice(idx, 1); 
        const targetNode = nodes.find(n => n.id === inter.toNodeId);
        if(targetNode) {
          targetNode.interactions = targetNode.interactions.filter(i => i !== inter);
        }
        renderEditView(); 
      };

      row.appendChild(inputLabel);
      row.appendChild(inputDesc);
      row.appendChild(targetSelect);
      row.appendChild(delBtn);
      di.appendChild(row);
    });

    const addBtn = document.createElement('button');
    addBtn.innerText = '+ Lägg till interaktion';
    addBtn.onclick = () => {
      const newInter = {
        label: 'Ny interaktion',
        description: '',
        fromNodeId: nodeData.id,
        toNodeId: null
      };
      nodeData.interactions.push(newInter);
      renderEditView();
    };
    di.appendChild(addBtn);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn';
    saveBtn.innerText = 'Spara ändringar';
    saveBtn.onclick = () => {
      nodeData.title = document.getElementById('edit-title').value;
      nodeData.role = document.getElementById('edit-role').value;
      renderInteractionView();
      saveOrgCallback?.();
      initOrgChart({ nodes, edges });
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn secondary';
    cancelBtn.style.marginLeft = '8px';
    cancelBtn.innerText = 'Avbryt';
    cancelBtn.onclick = renderInteractionView;

    actionArea.innerHTML = '';
    actionArea.appendChild(saveBtn);
    actionArea.appendChild(cancelBtn);
  }

  function renderList(containerId, arr, editable = false) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    arr.forEach((item, idx) => {
      if (editable) {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.gap = '4px';
        div.style.marginBottom = '4px';

        const input = document.createElement('input');
        input.type = 'text';
        input.value = item;
        input.style.flex = '1';
        input.oninput = e => arr[idx] = e.target.value;

        const btn = document.createElement('button');
        btn.innerText = '×';
        btn.onclick = () => { arr.splice(idx, 1); renderList(containerId, arr, true); };

        div.appendChild(input);
        div.appendChild(btn);
        container.appendChild(div);
      } else {
        const li = document.createElement('li');
        li.innerText = item;
        container.appendChild(li);
      }
    });

    if (editable) {
      const addBtn = document.createElement('button');
      addBtn.innerText = '+ Lägg till';
      addBtn.onclick = () => { arr.push(''); renderList(containerId, arr, true); };
      container.appendChild(addBtn);
    }
  }

  renderInteractionView();
}
