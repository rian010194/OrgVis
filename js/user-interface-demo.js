// Demo version of user interface for testing without Supabase
class UserInterfaceDemo {
  constructor() {
    this.init();
  }

  init() {
    this.createUserManagementUI();
    this.setupEventListeners();
  }

  createUserManagementUI() {
    // Create user management panel
    const userPanel = document.createElement('div');
    userPanel.id = 'userManagementPanel';
    userPanel.className = 'user-panel hidden';
    
    userPanel.innerHTML = `
      <div class="user-panel-header">
        <div class="header-left">
          <h3>Användarhantering (DEMO)</h3>
          <span class="org-stats">Demo-läge - ingen databas</span>
        </div>
        <button id="closeUserPanel" class="close-btn">&times;</button>
      </div>
      
      <div class="user-panel-nav">
        <button class="nav-btn active" data-view="dashboard">Översikt</button>
        <button class="nav-btn" data-view="users">Användare</button>
        <button class="nav-btn" data-view="import">Import</button>
      </div>
      
      <div class="user-panel-content">
        <!-- Dashboard View -->
        <div id="dashboardView" class="view-content active">
          <div class="dashboard-grid">
            <div class="stat-card">
              <h4>Totala användare</h4>
              <div class="stat-number">1,247</div>
            </div>
            <div class="stat-card">
              <h4>Aktiva användare</h4>
              <div class="stat-number">1,189</div>
            </div>
            <div class="stat-card">
              <h4>Avdelningar</h4>
              <div class="stat-number">12</div>
            </div>
            <div class="stat-card">
              <h4>Senaste aktivitet</h4>
              <div class="stat-number">47</div>
            </div>
          </div>
          
          <div class="dashboard-charts">
            <div class="chart-container">
              <h4>Användare per roll</h4>
              <div id="roleChart" class="d3-chart"></div>
            </div>
            <div class="chart-container">
              <h4>Användare per nivå</h4>
              <div id="levelChart" class="d3-chart"></div>
            </div>
          </div>
        </div>

        <!-- Users View -->
        <div id="usersView" class="view-content">
          <div class="view-header">
            <h4>Användarhantering (DEMO)</h4>
            <div class="view-actions">
              <button class="btn btn-primary">Lägg till användare</button>
              <button class="btn btn-secondary">Exportera</button>
            </div>
          </div>
          
          <div class="demo-notice">
            <p><strong>Demo-läge:</strong> Detta är en demonstration av användarhanteringssystemet. För full funktionalitet, kör SQL-skriptet i Supabase-databasen.</p>
          </div>
          
          <div class="users-table-container">
            <table class="users-table">
              <thead>
                <tr>
                  <th>Anställnings-ID</th>
                  <th>Namn</th>
                  <th>E-post</th>
                  <th>Avdelning</th>
                  <th>Roll</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>EMP001</td>
                  <td>Admin User</td>
                  <td>admin@company.com</td>
                  <td>Executive</td>
                  <td><span class="role-badge org_admin">Organisationsadmin</span></td>
                  <td><span class="status-badge active">Aktiv</span></td>
                </tr>
                <tr>
                  <td>EMP002</td>
                  <td>Operations Manager</td>
                  <td>ops@company.com</td>
                  <td>Operations</td>
                  <td><span class="role-badge department_admin">Avdelningsadmin</span></td>
                  <td><span class="status-badge active">Aktiv</span></td>
                </tr>
                <tr>
                  <td>EMP003</td>
                  <td>John Developer</td>
                  <td>john@company.com</td>
                  <td>IT</td>
                  <td><span class="role-badge member">Medlem</span></td>
                  <td><span class="status-badge active">Aktiv</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Import View -->
        <div id="importView" class="view-content">
          <div class="view-header">
            <h4>Bulk-import av användare (DEMO)</h4>
          </div>
          
          <div class="demo-notice">
            <p><strong>Demo-läge:</strong> Import-funktionen kräver Supabase-databas. Kör SQL-skriptet först.</p>
          </div>
          
          <div class="import-section">
            <div class="import-info">
              <h5>CSV-format krävs</h5>
              <p>Ladda upp en CSV-fil med följande kolumner:</p>
              <ul>
                <li><strong>employee_id</strong> - Anställnings-ID (obligatoriskt)</li>
                <li><strong>email</strong> - E-postadress (obligatoriskt)</li>
                <li><strong>first_name</strong> - Förnamn (obligatoriskt)</li>
                <li><strong>last_name</strong> - Efternamn (obligatoriskt)</li>
                <li><strong>department_code</strong> - Avdelningskod</li>
                <li><strong>position</strong> - Position/titel</li>
              </ul>
            </div>
            
            <div class="file-upload-area">
              <div class="upload-content">
                <div class="upload-icon">📁</div>
                <p>Demo-läge: Filuppladdning inte tillgänglig</p>
                <small>Kör SQL-skriptet för full funktionalitet</small>
              </div>
            </div>
            
            <div class="import-actions">
              <button class="btn btn-secondary" onclick="window.open('templates/user_import_template.csv')">Ladda ner mall</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(userPanel);
  }

  setupEventListeners() {
    // Navigation
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('nav-btn')) {
        const view = e.target.dataset.view;
        this.switchView(view);
      }
    });

    // Close panel
    document.addEventListener('click', (e) => {
      if (e.target.id === 'closeUserPanel') {
        this.hideUserPanel();
      }
    });

    // Show user panel - improved touch handling
    document.addEventListener('click', (e) => {
      if (e.target.id === 'userManagementBtn' || e.target.closest('#userManagementBtn')) {
        e.preventDefault();
        e.stopPropagation();
        this.showUserPanel();
      }
    });
    
    // Also handle touch events for better mobile support
    document.addEventListener('touchend', (e) => {
      if (e.target.id === 'userManagementBtn' || e.target.closest('#userManagementBtn')) {
        e.preventDefault();
        e.stopPropagation();
        this.showUserPanel();
      }
    });

    // Handle user panel navigation
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('nav-btn')) {
        this.switchView(e.target.dataset.view);
      }
    });
  }

  switchView(viewName) {
    // Hide all views
    document.querySelectorAll('.view-content').forEach(view => {
      view.classList.remove('active');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Show selected view
    const targetView = document.getElementById(viewName + 'View');
    if (targetView) {
      targetView.classList.add('active');
    }
    
    // Add active class to clicked nav button
    const activeBtn = document.querySelector(`[data-view="${viewName}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  }

  showUserPanel() {
    const panel = document.getElementById('userManagementPanel');
    if (panel) {
      panel.classList.remove('hidden');
      this.createDemoCharts();
    } else {
      console.warn('User management panel not found');
    }
  }

  hideUserPanel() {
    const panel = document.getElementById('userManagementPanel');
    if (panel) {
      panel.classList.add('hidden');
    }
  }

  switchView(viewName) {
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.view-content').forEach(view => {
      view.classList.remove('active');
    });
    document.getElementById(`${viewName}View`).classList.add('active');
  }

  createDemoCharts() {
    // Check if D3 is available
    if (typeof d3 === "undefined" || !d3.pie || !d3.arc) {
      console.warn('D3.js not available, falling back to simple text display');
      this.createFallbackCharts();
      return;
    }

    // Create D3.js charts
    this.createRoleChart();
    this.createLevelChart();
  }

  createFallbackCharts() {
    const roleContainer = document.getElementById('roleChart');
    const levelContainer = document.getElementById('levelChart');
    
    if (roleContainer) {
      roleContainer.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #666;">
          <p>Medlem: 150</p>
          <p>Teamledare: 300</p>
          <p>Träningsadmin: 500</p>
          <p>Org Admin: 200</p>
          <p>Super Admin: 50</p>
        </div>
      `;
    }
    
    if (levelContainer) {
      levelContainer.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #666;">
          <p>Nivå 1: 5 användare</p>
          <p>Nivå 2: 25 användare</p>
          <p>Nivå 3: 150 användare</p>
          <p>Nivå 4: 400 användare</p>
          <p>Nivå 5: 600 användare</p>
          <p>Nivå 6: 200 användare</p>
          <p>Nivå 7: 50 användare</p>
        </div>
      `;
    }
  }

  createRoleChart() {
    const container = document.getElementById('roleChart');
    if (!container) return;

    // Clear container
    container.innerHTML = '';

    // Data for roles
    const data = [
      { role: 'Medlem', value: 150, color: '#6c757d' },
      { role: 'Teamledare', value: 300, color: '#20c997' },
      { role: 'Träningsadmin', value: 500, color: '#ffc107' },
      { role: 'Org Admin', value: 200, color: '#fd7e14' },
      { role: 'Super Admin', value: 50, color: '#dc3545' }
    ];

    // Get container dimensions
    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width || 400;
    const height = 300;
    const radius = Math.min(width, height) / 2 - 20;

    // Create SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Create pie generator
    const pie = d3.pie()
      .sort(null)
      .value(d => d.value);

    // Create arc generator
    const arc = d3.arc()
      .innerRadius(radius * 0.4)
      .outerRadius(radius);

    // Create arcs
    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    // Add path elements
    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add labels
    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text(d => d.data.value);

    // Add legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 150}, 20)`);

    const legendItems = legend.selectAll('.legend-item')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 20})`);

    legendItems.append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', d => d.color);

    legendItems.append('text')
      .attr('x', 18)
      .attr('y', 9)
      .attr('font-size', '11px')
      .attr('fill', '#333')
      .text(d => d.role);
  }

  createLevelChart() {
    const container = document.getElementById('levelChart');
    if (!container) return;

    // Clear container
    container.innerHTML = '';

    // Data for levels
    const data = [
      { level: 1, value: 5 },
      { level: 2, value: 25 },
      { level: 3, value: 150 },
      { level: 4, value: 400 },
      { level: 5, value: 600 },
      { level: 6, value: 200 },
      { level: 7, value: 50 }
    ];

    // Get container dimensions
    const containerRect = container.getBoundingClientRect();
    const width = containerRect.width || 400;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create scales
    const xScale = d3.scaleBand()
      .domain(data.map(d => d.level))
      .range([0, chartWidth])
      .padding(0.1);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value)])
      .range([chartHeight, 0]);

    // Create bars
    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d.level))
      .attr('y', d => yScale(d.value))
      .attr('width', xScale.bandwidth())
      .attr('height', d => chartHeight - yScale(d.value))
      .attr('fill', '#007bff')
      .attr('rx', 4)
      .attr('ry', 4);

    // Add value labels on top of bars
    g.selectAll('.bar-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', d => xScale(d.level) + xScale.bandwidth() / 2)
      .attr('y', d => yScale(d.value) - 5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text(d => d.value);

    // Add x-axis
    g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d => `Nivå ${d}`))
      .attr('font-size', '11px')
      .selectAll('text')
      .attr('fill', '#666');

    // Add y-axis
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5))
      .attr('font-size', '11px')
      .selectAll('text')
      .attr('fill', '#666');

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale)
        .tickSize(-chartWidth)
        .tickFormat('')
      )
      .attr('opacity', 0.1);
  }
}

// Create global instance
const userInterfaceDemo = new UserInterfaceDemo();
