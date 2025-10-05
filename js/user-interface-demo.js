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
              <canvas id="roleChart"></canvas>
            </div>
            <div class="chart-container">
              <h4>Användare per nivå</h4>
              <canvas id="levelChart"></canvas>
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

    // Show user panel
    document.addEventListener('click', (e) => {
      if (e.target.id === 'userManagementBtn') {
        this.showUserPanel();
      }
    });
  }

  showUserPanel() {
    const panel = document.getElementById('userManagementPanel');
    if (panel) {
      panel.classList.remove('hidden');
      this.createDemoCharts();
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
    // Simple demo charts
    const roleCanvas = document.getElementById('roleChart');
    const levelCanvas = document.getElementById('levelChart');
    
    if (roleCanvas) {
      const ctx = roleCanvas.getContext('2d');
      ctx.clearRect(0, 0, roleCanvas.width, roleCanvas.height);
      
      // Simple bar chart
      const data = [150, 300, 500, 200, 50]; // member, team_lead, department_admin, org_admin, super_admin
      const labels = ['Medlem', 'Teamledare', 'Avdelningsadmin', 'Org Admin', 'Super Admin'];
      const colors = ['#6c757d', '#20c997', '#ffc107', '#fd7e14', '#dc3545'];
      
      const barWidth = roleCanvas.width / data.length - 10;
      const maxValue = Math.max(...data);
      
      data.forEach((value, index) => {
        const barHeight = (value / maxValue) * (roleCanvas.height - 40);
        const x = index * (barWidth + 10) + 5;
        const y = roleCanvas.height - barHeight - 20;
        
        ctx.fillStyle = colors[index];
        ctx.fillRect(x, y, barWidth, barHeight);
        
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(value, x + barWidth/2, y - 5);
        ctx.fillText(labels[index], x + barWidth/2, roleCanvas.height - 5);
      });
    }
    
    if (levelCanvas) {
      const ctx = levelCanvas.getContext('2d');
      ctx.clearRect(0, 0, levelCanvas.width, levelCanvas.height);
      
      // Simple line chart
      const data = [5, 25, 150, 400, 600, 200, 50]; // levels 1-7
      const stepX = levelCanvas.width / (data.length - 1);
      const stepY = (levelCanvas.height - 40) / Math.max(...data);
      
      ctx.strokeStyle = '#007bff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      data.forEach((value, index) => {
        const x = index * stepX;
        const y = levelCanvas.height - (value * stepY) - 20;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        // Draw point
        ctx.fillStyle = '#007bff';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
      
      ctx.stroke();
      
      // Add labels
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      data.forEach((value, index) => {
        const x = index * stepX;
        ctx.fillText(`Nivå ${index + 1}`, x, levelCanvas.height - 5);
      });
    }
  }
}

// Create global instance
const userInterfaceDemo = new UserInterfaceDemo();
