// ============================================================
// OBSERVABLE NOTEBOOK - COPY/PASTE VERSION
// ============================================================
// Kopiera varje block nedan till en egen cell i Observable
// Tryck Shift+Enter efter varje block
// ============================================================

// ===== BLOCK 1: Setup (3 cells) =====
// Cell 1:
supabase = {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  return createClient('https://cihgptcfhaeujxhpvame.supabase.co', secrets.SUPABASE_KEY);
}

// Cell 2:
organizations = {
  const { data, error } = await supabase.from('organizations').select('*');
  if (error) throw error;
  return data;
}

// Cell 3:
Inputs.table(organizations, {columns: ["id", "name", "type"], header: {id: "ID", name: "Name", type: "Type"}})


// ===== BLOCK 2: Välj organisation (2 cells) =====
// Cell 4:
viewof selectedOrgId = Inputs.select(organizations.map(org => org.id), {
  label: "Select Organization",
  format: id => organizations.find(o => o.id === id)?.name || id,
  value: organizations[0]?.id
})

// Cell 5:
nodes = {
  const { data, error } = await supabase.from('nodes').select('*').eq('organization_id', selectedOrgId).order('name');
  if (error) throw error;
  return data;
}


// ===== BLOCK 3: Visa och välj nod (3 cells) =====
// Cell 6:
Inputs.table(nodes, {columns: ["id", "name", "type", "role"], rows: 20})

// Cell 7:
viewof selectedNodeId = Inputs.select(nodes, {
  label: "Select node to edit",
  format: node => `${node.name} (${node.type})`,
  value: nodes[0]
})

// Cell 8:
md`### Selected: ${selectedNodeId?.name || 'None'}
- **Type:** ${selectedNodeId?.type}
- **Role:** ${selectedNodeId?.role || 'N/A'}`


// ===== BLOCK 4: Redigera nod (2 cells) =====
// Cell 9:
viewof editedNode = Inputs.form([
  Inputs.text({label: "Name", value: selectedNodeId?.name || ""}),
  Inputs.select(["Unit", "Department", "Team", "SupportOffice"], {label: "Type", value: selectedNodeId?.type || "Unit"}),
  Inputs.textarea({label: "Role", value: selectedNodeId?.role || "", rows: 3})
])

// Cell 10:
viewof saveNode = Inputs.button("💾 Save Changes", {
  reduce: async () => {
    if (!selectedNodeId?.id) return alert('Select a node first');
    const [name, type, role] = editedNode;
    const { error } = await supabase.from('nodes').update({name, type, role, updated_at: new Date().toISOString()})
      .eq('id', selectedNodeId.id).eq('organization_id', selectedOrgId);
    alert(error ? '❌ Error: ' + error.message : '✅ Updated!');
  }
})


// ===== BLOCK 5: Metrics (4 cells) =====
// Cell 11:
nodeMetrics = {
  if (!selectedNodeId?.id) return [];
  const { data, error } = await supabase.from('metrics').select('*')
    .eq('node_id', selectedNodeId.id).eq('organization_id', selectedOrgId);
  if (error) throw error;
  return data;
}

// Cell 12:
Plot.plot({
  marks: [Plot.barY(nodeMetrics[0]?.data ? Object.entries(nodeMetrics[0].data) : [], {
    x: ([key]) => key, y: ([_, value]) => value, fill: "steelblue", tip: true
  })],
  x: {label: "Activity", tickRotate: -45},
  y: {label: nodeMetrics[0]?.unit || "Value"},
  marginBottom: 80,
  title: nodeMetrics[0]?.name || "No metrics"
})

// Cell 13:
viewof newMetric = Inputs.form([
  Inputs.text({label: "Metric Name", value: "Time spent on:"}),
  Inputs.select(["pie", "bar", "line", "table"], {label: "Chart Type", value: "pie"}),
  Inputs.text({label: "Unit", value: "%"}),
  Inputs.textarea({label: "Data (key:value per line)", placeholder: "teaching:20\nresearch:15\nadmin:5", rows: 5})
])

// Cell 14:
viewof saveMetric = Inputs.button("📊 Add Metric", {
  reduce: async () => {
    if (!selectedNodeId?.id) return alert('Select a node first');
    const [name, type, unit, dataText] = newMetric;
    const data = {};
    dataText.split('\n').forEach(line => {
      const [key, value] = line.split(':').map(s => s.trim());
      if (key && value) data[key] = parseFloat(value) || 0;
    });
    if (!Object.keys(data).length) return alert('Add at least one data point');
    const { error } = await supabase.from('metrics').insert({
      organization_id: selectedOrgId, node_id: selectedNodeId.id, name, type, unit, data
    });
    alert(error ? '❌ Error: ' + error.message : '✅ Metric added!');
  }
})

// ============================================================
// KLART! 14 cells totalt
// ============================================================

