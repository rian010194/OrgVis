const ChartRenderer = (() => {
  
  // Color palette for consistent styling across all charts - matches ui.js metricPalette
  const colorPalette = [
    '#ff5a00', '#ff8b3d', '#ffb266', '#ffd6ad', '#ffe6d5', '#ffc9ae'
  ];

  const getMetricColor = (key, index) => {
    return colorPalette[index % colorPalette.length];
  };

  // Pie Chart (existing functionality enhanced)
  const renderPieChart = (container, entries, total, title = "Time spent on:", unit = "%") => {
    console.log('renderPieChart called with:', { container, entries, total, title, unit });
    
    if (!container || !d3 || !d3.pie) {
      console.log('Pie chart error:', { container: !!container, d3: !!d3, d3pie: !!(d3 && d3.pie) });
      container.textContent = "Enable D3.js to show the diagram.";
      return;
    }

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;
    const size = Math.max(Math.min(width, height), 250);
    const radius = size / 2;
    
    console.log('Pie chart dimensions:', { width, height, size, radius });

    const root = d3.select(container);
    root.selectAll("*").remove();

    const svg = root
      .append("svg")
      .attr("viewBox", `0 0 ${size} ${size}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const group = svg
      .append("g")
      .attr("transform", `translate(${size / 2}, ${size / 2})`);

    const pie = d3.pie().sort(null).value(d => d.value);
    const arc = d3.arc().innerRadius(radius * 0.45).outerRadius(radius * 0.85);
    
    const pieData = pie(entries);
    console.log('Pie data:', pieData);

    const paths = group
      .selectAll("path")
      .data(pieData);
      
    console.log('Paths selection:', paths.size());
    
    paths.enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", (d, i) => getMetricColor(d.data.key, i))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    if (total > 0) {
      group
        .append("text")
        .attr("class", "chart-total")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .text("100%");
    }
    
    // Fallback if no paths were created
    setTimeout(() => {
      if (container.querySelector('path') === null) {
        console.log('No pie chart paths created, showing fallback');
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Pie chart could not be rendered<br>Data: ' + JSON.stringify(entries) + '</div>';
      }
    }, 100);
  };

  // Bar Chart
  const renderBarChart = (container, entries, total, title = "Time spent on:", unit = "%") => {
    if (!container || !d3 || !d3.scaleBand) {
      container.textContent = "Enable D3.js to show the diagram.";
      return;
    }

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 300;
    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const root = d3.select(container);
    root.selectAll("*").remove();

    const svg = root
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const group = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleBand()
      .domain(entries.map(d => d.key))
      .range([0, chartWidth])
      .padding(0.1);

    // Calculate the maximum value from the data
    const maxValue = Math.max(...entries.map(d => d.value));
    const yScale = d3.scaleLinear()
      .domain([0, maxValue])
      .range([chartHeight, 0]);

    // Bars
    group
      .selectAll("rect")
      .data(entries)
      .enter()
      .append("rect")
      .attr("x", d => xScale(d.key))
      .attr("y", d => yScale(d.value))
      .attr("width", xScale.bandwidth())
      .attr("height", d => chartHeight - yScale(d.value))
      .attr("fill", (d, i) => getMetricColor(d.key, i))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1);

    // X-axis
    group
      .append("g")
      .attr("transform", `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    // Y-axis
    group
      .append("g")
      .call(d3.axisLeft(yScale).tickFormat(d => d + " " + unit));

    // Value labels on bars
    group
      .selectAll(".bar-label")
      .data(entries)
      .enter()
      .append("text")
      .attr("class", "bar-label")
      .attr("x", d => xScale(d.key) + xScale.bandwidth() / 2)
      .attr("y", d => yScale(d.value) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text(d => d.value + " " + unit);
  };

  // Line Chart
  const renderLineChart = (container, entries, total, title = "Time spent on:", unit = "%") => {
    if (!container || !d3 || !d3.scaleLinear) {
      container.textContent = "Enable D3.js to show the diagram.";
      return;
    }

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 300;
    const margin = { top: 20, right: 20, bottom: 60, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const root = d3.select(container);
    root.selectAll("*").remove();

    const svg = root
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const group = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleBand()
      .domain(entries.map(d => d.key))
      .range([0, chartWidth])
      .padding(0.1);

    // Calculate the maximum value from the data
    const maxValue = Math.max(...entries.map(d => d.value));
    const yScale = d3.scaleLinear()
      .domain([0, maxValue])
      .range([chartHeight, 0]);

    // Line generator
    const line = d3.line()
      .x((d, i) => xScale(d.key) + xScale.bandwidth() / 2)
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Line
    group
      .append("path")
      .datum(entries)
      .attr("fill", "none")
      .attr("stroke", colorPalette[0])
      .attr("stroke-width", 3)
      .attr("d", line);

    // Data points
    group
      .selectAll(".dot")
      .data(entries)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.key) + xScale.bandwidth() / 2)
      .attr("cy", d => yScale(d.value))
      .attr("r", 5)
      .attr("fill", colorPalette[0])
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // X-axis
    group
      .append("g")
      .attr("transform", `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    // Y-axis
    group
      .append("g")
      .call(d3.axisLeft(yScale).tickFormat(d => d + " " + unit));
  };

  // Table View
  const renderTableView = (container, entries, total, title = "Time spent on:", unit = "%") => {
    if (!container) {
      return;
    }

    const root = d3.select(container);
    root.selectAll("*").remove();

    const table = root
      .append("table")
      .attr("class", "metrics-table");

    const thead = table.append("thead");
    const tbody = table.append("tbody");

    // Header
    thead
      .append("tr")
      .selectAll("th")
      .data(["Activity", `${unit} (%)`, "Visual"])
      .enter()
      .append("th")
      .text(d => d);

    // Rows
    const rows = tbody
      .selectAll("tr")
      .data(entries)
      .enter()
      .append("tr");

    // Activity column
    rows
      .append("td")
      .attr("class", "activity-cell")
      .text(d => d.key);

    // Time percentage column
    rows
      .append("td")
      .attr("class", "time-cell")
      .text(d => d.value + " " + unit + " (" + Math.round((d.value / total) * 100) + "%)");

    // Visual bar column
    rows
      .append("td")
      .attr("class", "visual-cell")
      .append("div")
      .attr("class", "progress-bar")
      .style("width", d => Math.round((d.value / total) * 100) + "%")
      .style("background-color", (d, i) => getMetricColor(d.key, i))
      .style("height", "20px")
      .style("border-radius", "10px");
  };

  // Main render function that switches between chart types
  const renderChart = (container, entries, total, chartType = "pie", title = "Time spent on:", unit = "%") => {
    if (!entries || entries.length === 0) {
      container.innerHTML = '<p class="chart-empty">No data available</p>';
      return;
    }

    switch (chartType) {
      case "pie":
        renderPieChart(container, entries, total, title, unit);
        break;
      case "bar":
        renderBarChart(container, entries, total, title, unit);
        break;
      case "line":
        renderLineChart(container, entries, total, title, unit);
        break;
      case "table":
        renderTableView(container, entries, total, title, unit);
        break;
      default:
        renderPieChart(container, entries, total, title, unit);
    }
  };

  return {
    renderChart,
    renderPieChart,
    renderBarChart,
    renderLineChart,
    renderTableView
  };
})();

window.ChartRenderer = ChartRenderer;
