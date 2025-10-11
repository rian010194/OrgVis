# Observable Notebook Setup Guide

## Steg-för-steg instruktioner:

### Förberedelser:
1. Gå till https://observablehq.com
2. Skapa ett konto (gratis)
3. Klicka "New notebook"
4. Lägg till Secret:
   - Klicka på menyn (⋮) → "Notebook settings" → "Secrets"
   - Lägg till: `SUPABASE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpaGdwdGNmaGFldWp4aHB2YW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDUyMzMsImV4cCI6MjA3NTA4MTIzM30.ZnGwhkJ6tJWV_jyKMOQ7NE8oS0iZTmR7u3171KpX_SU`

---

## Kopiera cellerna nedan en i taget:

### Cell 1: Supabase Setup
```javascript
supabase = {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
  return createClient(
    'https://cihgptcfhaeujxhpvame.supabase.co',
    secrets.SUPABASE_KEY
  );
}
```

---

### Cell 2: Hämta organisations
```javascript
organizations = {
  const { data, error } = await supabase
    .from('organizations')
    .select('*');
  
  if (error) {
    console.error('Connection error:', error);
    throw error;
  }
  
  return data;
}
```

---

### Cell 3: Visa organisations
```javascript
Inputs.table(organizations, {
  columns: ["id", "name", "type", "description"],
  header: {
    id: "ID",
    name: "Name",
    type: "Type", 
    description: "Description"
  }
})
```

---

### Cell 4: Välj organisation
```javascript
viewof selectedOrgId = Inputs.select(
  organizations.map(org => org.id),
  {
    label: "Select Organization",
    format: id => organizations.find(o => o.id === id)?.name || id,
    value: organizations[0]?.id
  }
)
```

---

### Cell 5: Hämta noder för vald organisation
```javascript
nodes = {
  const { data, error } = await supabase
    .from('nodes')
    .select('*')
    .eq('organization_id', selectedOrgId)
    .order('name');
  
  if (error) throw error;
  
  return data;
}
```

---

### Cell 6: Visa noder i tabell
```javascript
Inputs.table(nodes, {
  columns: ["id", "name", "type", "role", "parent_id"],
  header: {
    id: "ID",
    name: "Name",
    type: "Type",
    role: "Role",
    parent_id: "Parent"
  },
  rows: 20
})
```

---

### Cell 7: Välj nod att redigera
```javascript
viewof selectedNodeId = Inputs.select(
  nodes,
  {
    label: "Select node to edit",
    format: node => `${node.name} (${node.type})`,
    value: nodes[0]
  }
)
```

---

### Cell 8: Visa vald nod
```javascript
md`### Selected Node: ${selectedNodeId?.name || 'None'}
- **ID:** ${selectedNodeId?.id}
- **Type:** ${selectedNodeId?.type}
- **Role:** ${selectedNodeId?.role || 'N/A'}
- **Parent:** ${selectedNodeId?.parent_id || 'Root'}
`
```

---

### Cell 9: Redigeringsformulär
```javascript
viewof editedNode = Inputs.form([
  Inputs.text({
    label: "Name",
    value: selectedNodeId?.name || ""
  }),
  Inputs.select(
    ["Unit", "Department", "Team", "SupportOffice"],
    {
      label: "Type",
      value: selectedNodeId?.type || "Unit"
    }
  ),
  Inputs.textarea({
    label: "Role",
    value: selectedNodeId?.role || "",
    rows: 3
  })
])
```

---

### Cell 10: Spara ändringar till nod
```javascript
viewof saveNode = Inputs.button("💾 Save Changes", {
  reduce: async () => {
    if (!selectedNodeId?.id) {
      alert('Please select a node first');
      return;
    }
    
    const [name, type, role] = editedNode;
    
    const { data, error } = await supabase
      .from('nodes')
      .update({
        name: name,
        type: type,
        role: role,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedNodeId.id)
      .eq('organization_id', selectedOrgId)
      .select();
    
    if (error) {
      alert('❌ Error: ' + error.message);
      console.error(error);
    } else {
      alert('✅ Node updated successfully!');
    }
    
    return data;
  }
})
```

---

### Cell 11: Hämta metrics för vald nod
```javascript
nodeMetrics = {
  if (!selectedNodeId?.id) return [];
  
  const { data, error } = await supabase
    .from('metrics')
    .select('*')
    .eq('node_id', selectedNodeId.id)
    .eq('organization_id', selectedOrgId);
  
  if (error) throw error;
  
  return data;
}
```

---

### Cell 12: Visualisera metrics
```javascript
Plot.plot({
  marks: [
    Plot.barY(
      nodeMetrics[0]?.data ? Object.entries(nodeMetrics[0].data) : [],
      {
        x: ([key]) => key,
        y: ([_, value]) => value,
        fill: "steelblue",
        tip: true
      }
    )
  ],
  x: {
    label: "Activity",
    tickRotate: -45
  },
  y: {
    label: nodeMetrics[0]?.unit || "Value"
  },
  marginBottom: 80,
  title: nodeMetrics[0]?.name || "No metrics available"
})
```

---

### Cell 13: Formulär för ny metric
```javascript
viewof newMetric = Inputs.form([
  Inputs.text({
    label: "Metric Name",
    placeholder: "e.g., Time spent on:",
    value: "Time spent on:"
  }),
  Inputs.select(
    ["pie", "bar", "line", "table"],
    {
      label: "Chart Type",
      value: "pie"
    }
  ),
  Inputs.text({
    label: "Unit",
    value: "%",
    placeholder: "e.g., %, hours, kr"
  }),
  Inputs.textarea({
    label: "Data (key:value pairs, one per line)",
    placeholder: "teaching:20\nresearch:15\nadmin:5",
    rows: 5
  })
])
```

---

### Cell 14: Spara ny metric
```javascript
viewof saveMetric = Inputs.button("📊 Add Metric", {
  reduce: async () => {
    if (!selectedNodeId?.id) {
      alert('Please select a node first');
      return;
    }
    
    const [name, type, unit, dataText] = newMetric;
    
    // Parse data from text
    const data = {};
    dataText.split('\n').forEach(line => {
      const [key, value] = line.split(':').map(s => s.trim());
      if (key && value) {
        data[key] = parseFloat(value) || 0;
      }
    });
    
    if (Object.keys(data).length === 0) {
      alert('Please add at least one data point');
      return;
    }
    
    const { error } = await supabase
      .from('metrics')
      .insert({
        organization_id: selectedOrgId,
        node_id: selectedNodeId.id,
        name: name || "Time spent on:",
        type: type,
        unit: unit || "%",
        data: data
      });
    
    if (error) {
      alert('❌ Error: ' + error.message);
      console.error(error);
    } else {
      alert('✅ Metric added successfully!');
    }
    
    return data;
  }
})
```

---

## Hur du använder det:

1. **Öppna filen** `docs/observable-notebook-setup.md` (denna fil)
2. **Gå till Observable** (https://observablehq.com)
3. **Skapa ny notebook**
4. **Kopiera Cell 1** från denna fil → klistra in i Observable → tryck Shift+Enter
5. **Kopiera Cell 2** → klistra in → Shift+Enter
6. **Fortsätt med alla 14 cells**

## Tips:

- Tryck **Shift+Enter** för att köra en cell
- Tryck **Alt+Enter** för att skapa en ny cell
- Om något inte fungerar, kolla Console (F12) för fel
- Om du får "permission denied", behöver vi uppdatera Supabase RLS-policies

## Nästa steg efter setup:

Efter att du kört alla cells kan du:
1. Välja organisation från dropdown
2. Välja en nod
3. Ändra namn/typ/roll
4. Klicka "💾 Save Changes"
5. Öppna din app → se ändringen live! 🎉

## Felsökning:

### "secrets.SUPABASE_KEY is not defined"
→ Glöm inte lägga till din anon key som Secret i notebook settings

### "permission denied for table nodes"
→ Du behöver uppdatera RLS policies (be mig om hjälp med detta)

### "Cannot read property 'name' of undefined"
→ Vänta tills alla cells har kört klart (de är beroende av varandra)

