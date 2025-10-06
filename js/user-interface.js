// User Interface Components for Large Organization User Management
import { userManager } from './user-management.js';
import { supabase } from './supabase-multi-org.js';

export class UserInterface {
  constructor() {
    this.userManager = userManager;
    this.currentView = 'dashboard';
    this.filters = {};
    this.init();
  }

  init() {
    this.createUserManagementUI();
    this.setupEventListeners();
  }

  createUserManagementUI() {
    // Create main user management container
    const userPanel = document.createElement('div');
    userPanel.id = 'userManagementPanel';
    userPanel.className = 'user-panel hidden';
    
    userPanel.innerHTML = `
      <div class="user-panel-header">
        <div class="header-left">
          <h3>Användarhantering</h3>
          <span id="orgStats" class="org-stats"></span>
        </div>
        <button id="closeUserPanel" class="close-btn">&times;</button>
      </div>
      
      <div class="user-panel-nav">
        <button class="nav-btn active" data-view="dashboard">Översikt</button>
        <button class="nav-btn" data-view="users">Användare</button>
        <button class="nav-btn" data-view="departments">Avdelningar</button>
        <button class="nav-btn" data-view="import">Import</button>
        <button class="nav-btn" data-view="permissions">Rättigheter</button>
        <button class="nav-btn" data-view="profile">Profil</button>
      </div>
      
      <div class="user-panel-content">
        <!-- Dashboard View -->
        <div id="dashboardView" class="view-content active">
          <div class="dashboard-grid">
            <div class="stat-card">
              <h4>Totala användare</h4>
              <div class="stat-number" id="totalUsers">-</div>
            </div>
            <div class="stat-card">
              <h4>Aktiva användare</h4>
              <div class="stat-number" id="activeUsers">-</div>
            </div>
            <div class="stat-card">
              <h4>Avdelningar</h4>
              <div class="stat-number" id="totalDepartments">-</div>
            </div>
            <div class="stat-card">
              <h4>Senaste aktivitet</h4>
              <div class="stat-number" id="recentActivity">-</div>
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
            <h4>Användarhantering</h4>
            <div class="view-actions">
              <button id="addUserBtn" class="btn btn-primary">Lägg till användare</button>
              <button id="exportUsersBtn" class="btn btn-secondary">Exportera</button>
            </div>
          </div>
          
          <div class="filters-section">
            <div class="filter-group">
              <input type="text" id="userSearch" placeholder="Sök användare..." class="filter-input">
              <select id="departmentFilter" class="filter-select">
                <option value="">Alla avdelningar</option>
              </select>
              <select id="roleFilter" class="filter-select">
                <option value="">Alla roller</option>
                <option value="org_admin">Organisationsadmin</option>
                <option value="department_admin">Avdelningsadmin</option>
                <option value="team_lead">Teamledare</option>
                <option value="member">Medlem</option>
              </select>
              <select id="statusFilter" class="filter-select">
                <option value="">Alla statusar</option>
                <option value="true">Aktiva</option>
                <option value="false">Inaktiva</option>
              </select>
            </div>
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
                  <th>Nivå</th>
                  <th>Status</th>
                  <th>Åtgärder</th>
                </tr>
              </thead>
              <tbody id="usersTableBody">
                <!-- Will be populated dynamically -->
              </tbody>
            </table>
          </div>
          
          <div class="pagination">
            <button id="prevPage" class="btn btn-sm">Föregående</button>
            <span id="pageInfo">Sida 1 av 1</span>
            <button id="nextPage" class="btn btn-sm">Nästa</button>
          </div>
        </div>

        <!-- Departments View -->
        <div id="departmentsView" class="view-content">
          <div class="view-header">
            <h4>Avdelningshantering</h4>
            <button id="addDepartmentBtn" class="btn btn-primary">Lägg till avdelning</button>
          </div>
          
          <div class="departments-grid" id="departmentsGrid">
            <!-- Will be populated dynamically -->
          </div>
        </div>

        <!-- Import View -->
        <div id="importView" class="view-content">
          <div class="view-header">
            <h4>Bulk-import av användare</h4>
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
                <li><strong>level</strong> - Organisationsnivå (1-10)</li>
                <li><strong>role</strong> - Roll (lämnas tom för auto-tilldelning)</li>
                <li><strong>manager_employee_id</strong> - Chefens anställnings-ID</li>
                <li><strong>phone</strong> - Telefonnummer</li>
                <li><strong>start_date</strong> - Anställningsdatum</li>
                <li><strong>contract_type</strong> - Anställningstyp</li>
              </ul>
            </div>
            
            <div class="file-upload-area" id="fileUploadArea">
              <input type="file" id="csvFileInput" accept=".csv" hidden>
              <div class="upload-content">
                <div class="upload-icon">📁</div>
                <p>Dra och släpp CSV-fil här eller <span class="upload-link">välj fil</span></p>
                <small>Maximal filstorlek: 10MB</small>
              </div>
            </div>
            
            <div class="import-options">
              <div class="option-group">
                <label for="defaultPassword">Standardlösenord för nya användare:</label>
                <input type="password" id="defaultPassword" value="password123" class="form-input">
              </div>
              <div class="option-group">
                <label>
                  <input type="checkbox" id="sendWelcomeEmail" checked>
                  Skicka välkomst-e-post till nya användare
                </label>
              </div>
            </div>
            
            <div class="import-actions">
              <button id="startImportBtn" class="btn btn-primary" disabled>Starta import</button>
              <button id="downloadTemplateBtn" class="btn btn-secondary">Ladda ner mall</button>
            </div>
          </div>
          
          <div class="import-progress hidden" id="importProgress">
            <div class="progress-header">
              <h5>Import pågår...</h5>
              <span id="importStatus">Förbereder...</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" id="progressFill"></div>
            </div>
            <div class="progress-details">
              <span id="progressText">0 av 0 användare bearbetade</span>
            </div>
          </div>
          
          <div class="import-results hidden" id="importResults">
            <h5>Importresultat</h5>
            <div class="results-summary">
              <div class="result-item success">
                <span class="result-label">Framgångsrika:</span>
                <span id="successCount">0</span>
              </div>
              <div class="result-item error">
                <span class="result-label">Misslyckade:</span>
                <span id="errorCount">0</span>
              </div>
            </div>
            <div class="results-errors" id="resultsErrors">
              <!-- Error details will be shown here -->
            </div>
          </div>
        </div>

        <!-- Permissions View -->
        <div id="permissionsView" class="view-content">
          <div class="view-header">
            <h4>Nodrättigheter</h4>
          </div>
          
          <div class="permissions-content">
            <div class="permissions-info">
              <p>Här kan du hantera vilka användare som har rättigheter till specifika noder i organisationsstrukturen.</p>
            </div>
            
            <div class="permissions-table-container">
              <table class="permissions-table">
                <thead>
                  <tr>
                    <th>Användare</th>
                    <th>Nod</th>
                    <th>Rättighetstyp</th>
                    <th>Inkluderar barn</th>
                    <th>Kan hantera barn</th>
                    <th>Åtgärder</th>
                  </tr>
                </thead>
                <tbody id="permissionsTableBody">
                  <!-- Will be populated dynamically -->
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Profile View -->
        <div id="profileView" class="view-content">
          <div class="view-header">
            <h4>Min profil</h4>
          </div>
          
          <div class="profile-content">
            <div class="profile-info">
              <div class="profile-avatar">
                <div class="avatar-circle" id="userAvatar">
                  <!-- User initial will be inserted here -->
                </div>
              </div>
              <div class="profile-details">
                <h5 id="userName">-</h5>
                <p id="userEmail">-</p>
                <p id="userRole">-</p>
                <p id="userDepartment">-</p>
              </div>
            </div>
            
            <div class="profile-actions">
              <button id="editProfileBtn" class="btn btn-primary">Redigera profil</button>
              <button id="changePasswordBtn" class="btn btn-secondary">Byt lösenord</button>
              <button id="logoutBtn" class="btn btn-danger">Logga ut</button>
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
    // Note: User Management button event listener is handled by ui.js
    // to avoid duplicate event listeners

    // File upload
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('upload-link') || e.target.closest('#fileUploadArea')) {
        document.getElementById('csvFileInput').click();
      }
    });

    document.addEventListener('change', (e) => {
      if (e.target.id === 'csvFileInput') {
        this.handleFileSelect(e.target.files[0]);
      }
    });

    // Import actions
    document.addEventListener('click', (e) => {
      if (e.target.id === 'startImportBtn') {
        this.startBulkImport();
      }
      if (e.target.id === 'downloadTemplateBtn') {
        this.downloadTemplate();
      }
    });

    // User actions
    document.addEventListener('click', (e) => {
      if (e.target.id === 'addUserBtn') {
        this.showAddUserModal();
      }
      if (e.target.id === 'exportUsersBtn') {
        this.exportUsers();
      }
    });

    // Filters
    document.addEventListener('input', (e) => {
      if (['userSearch', 'departmentFilter', 'roleFilter', 'statusFilter'].includes(e.target.id)) {
        this.updateFilters();
      }
    });

    // Profile actions
    document.addEventListener('click', (e) => {
      if (e.target.id === 'logoutBtn') {
        this.handleLogout();
      }
    });
  }

  showUserPanel() {
    const panel = document.getElementById('userManagementPanel');
    if (panel) {
      panel.classList.remove('hidden');
      this.updateDashboard();
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

    this.currentView = viewName;

    // Load view-specific data
    switch (viewName) {
      case 'dashboard':
        this.updateDashboard();
        break;
      case 'users':
        this.updateUsersView();
        break;
      case 'departments':
        this.updateDepartmentsView();
        break;
      case 'permissions':
        this.updatePermissionsView();
        break;
      case 'profile':
        this.updateProfileView();
        break;
    }
  }

  async updateDashboard() {
    const stats = this.userManager.getOrganizationStats();
    if (!stats) return;

    // Update stat cards
    document.getElementById('totalUsers').textContent = stats.total_users || 0;
    document.getElementById('activeUsers').textContent = stats.active_users || 0;
    document.getElementById('totalDepartments').textContent = stats.total_departments || 0;

    // Update organization stats in header
    const orgStats = document.getElementById('orgStats');
    if (orgStats) {
      orgStats.textContent = `${stats.active_users} aktiva användare`;
    }

    // Create charts
    this.createRoleChart(stats.users_by_role);
    this.createLevelChart(stats.users_by_level);
  }

  createRoleChart(roleData) {
    const canvas = document.getElementById('roleChart');
    if (!canvas || !roleData) return;

    const ctx = canvas.getContext('2d');
    const roles = Object.keys(roleData);
    const counts = Object.values(roleData);

    // Simple bar chart implementation
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const maxCount = Math.max(...counts);
    const barWidth = canvas.width / roles.length - 10;
    
    roles.forEach((role, index) => {
      const barHeight = (counts[index] / maxCount) * (canvas.height - 40);
      const x = index * (barWidth + 10) + 5;
      const y = canvas.height - barHeight - 20;
      
      ctx.fillStyle = this.getRoleColor(role);
      ctx.fillRect(x, y, barWidth, barHeight);
      
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(counts[index], x + barWidth/2, y - 5);
      ctx.fillText(this.getRoleDisplayName(role), x + barWidth/2, canvas.height - 5);
    });
  }

  createLevelChart(levelData) {
    const canvas = document.getElementById('levelChart');
    if (!canvas || !levelData) return;

    const ctx = canvas.getContext('2d');
    const levels = Object.keys(levelData).sort((a, b) => parseInt(a) - parseInt(b));
    const counts = levels.map(level => levelData[level]);

    // Simple line chart implementation
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const maxCount = Math.max(...counts);
    const stepX = canvas.width / (levels.length - 1);
    const stepY = (canvas.height - 40) / maxCount;
    
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    levels.forEach((level, index) => {
      const x = index * stepX;
      const y = canvas.height - (counts[index] * stepY) - 20;
      
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
    levels.forEach((level, index) => {
      const x = index * stepX;
      ctx.fillText(`Nivå ${level}`, x, canvas.height - 5);
    });
  }

  async updateUsersView() {
    // Load departments for filter
    const departments = await this.userManager.getDepartments();
    const departmentFilter = document.getElementById('departmentFilter');
    departmentFilter.innerHTML = '<option value="">Alla avdelningar</option>' +
      departments.map(dept => `<option value="${dept.id}">${dept.name}</option>`).join('');

    // Load users
    await this.loadUsers();
  }

  async loadUsers() {
    try {
      const users = await this.userManager.getUsers(this.filters);
      this.renderUsersTable(users);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    tbody.innerHTML = users.map(user => `
      <tr>
        <td>${user.employee_id}</td>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.department?.name || '-'}</td>
        <td><span class="role-badge ${user.role}">${this.getRoleDisplayName(user.role)}</span></td>
        <td>${user.level}</td>
        <td><span class="status-badge ${user.is_active ? 'active' : 'inactive'}">${user.is_active ? 'Aktiv' : 'Inaktiv'}</span></td>
        <td>
          <button class="btn btn-sm" onclick="userInterface.editUser('${user.id}')">Redigera</button>
          ${user.is_active ? `<button class="btn btn-sm btn-danger" onclick="userInterface.deactivateUser('${user.id}')">Inaktivera</button>` : ''}
        </td>
      </tr>
    `).join('');
  }

  async updateDepartmentsView() {
    try {
      const departments = await this.userManager.getDepartments();
      this.renderDepartmentsGrid(departments);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  }

  renderDepartmentsGrid(departments) {
    const grid = document.getElementById('departmentsGrid');
    if (!grid) return;

    grid.innerHTML = departments.map(dept => `
      <div class="department-card">
        <div class="department-header">
          <h5>${dept.name}</h5>
          <span class="department-code">${dept.code}</span>
        </div>
        <div class="department-content">
          <p>${dept.description || 'Ingen beskrivning'}</p>
          <div class="department-stats">
            <span>Användare: ${dept.user_count || 0}</span>
          </div>
        </div>
        <div class="department-actions">
          <button class="btn btn-sm" onclick="userInterface.editDepartment('${dept.id}')">Redigera</button>
        </div>
      </div>
    `).join('');
  }

  async updatePermissionsView() {
    // Implementation for permissions view
    console.log('Loading permissions view');
  }

  updateProfileView() {
    const user = this.userManager.getCurrentUser();
    if (!user) return;

    document.getElementById('userName').textContent = user.name;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userRole').textContent = this.getRoleDisplayName(user.role);
    document.getElementById('userDepartment').textContent = user.department?.name || 'Ingen avdelning';

    // Update avatar
    const avatar = document.getElementById('userAvatar');
    if (avatar) {
      avatar.textContent = user.name.charAt(0).toUpperCase();
    }
  }

  handleFileSelect(file) {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Endast CSV-filer är tillåtna');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      alert('Filen är för stor. Maximal storlek är 10MB');
      return;
    }

    // Update UI to show selected file
    const uploadArea = document.getElementById('fileUploadArea');
    uploadArea.innerHTML = `
      <div class="file-selected">
        <div class="file-icon">📄</div>
        <div class="file-info">
          <p><strong>${file.name}</strong></p>
          <p>${(file.size / 1024).toFixed(1)} KB</p>
        </div>
        <button class="btn btn-sm" onclick="userInterface.clearFile()">Ta bort</button>
      </div>
    `;

    document.getElementById('startImportBtn').disabled = false;
  }

  clearFile() {
    document.getElementById('csvFileInput').value = '';
    document.getElementById('startImportBtn').disabled = true;
    
    const uploadArea = document.getElementById('fileUploadArea');
    uploadArea.innerHTML = `
      <div class="upload-content">
        <div class="upload-icon">📁</div>
        <p>Dra och släpp CSV-fil här eller <span class="upload-link">välj fil</span></p>
        <small>Maximal filstorlek: 10MB</small>
      </div>
    `;
  }

  async startBulkImport() {
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
      alert('Välj en CSV-fil först');
      return;
    }

    const options = {
      defaultPassword: document.getElementById('defaultPassword').value,
      sendWelcomeEmail: document.getElementById('sendWelcomeEmail').checked
    };

    // Show progress
    document.getElementById('importProgress').classList.remove('hidden');
    document.getElementById('importResults').classList.add('hidden');

    try {
      const result = await this.userManager.bulkImportUsers(file, options);
      
      // Hide progress
      document.getElementById('importProgress').classList.add('hidden');
      
      if (result.success) {
        // Show results
        this.showImportResults(result.results);
      } else {
        alert('Import misslyckades: ' + result.error);
      }
    } catch (error) {
      console.error('Import error:', error);
      document.getElementById('importProgress').classList.add('hidden');
      alert('Import misslyckades: ' + error.message);
    }
  }

  showImportResults(results) {
    document.getElementById('importResults').classList.remove('hidden');
    document.getElementById('successCount').textContent = results.successful;
    document.getElementById('errorCount').textContent = results.failed;

    const errorsContainer = document.getElementById('resultsErrors');
    if (results.errors && results.errors.length > 0) {
      errorsContainer.innerHTML = `
        <h6>Fel:</h6>
        <ul>
          ${results.errors.map(error => `
            <li>
              <strong>${error.employee_id || error.batch}:</strong> ${error.error}
            </li>
          `).join('')}
        </ul>
      `;
    } else {
      errorsContainer.innerHTML = '<p>Inga fel uppstod under importen.</p>';
    }
  }

  downloadTemplate() {
    const template = [
      'employee_id,email,first_name,last_name,department_code,position,level,role,manager_employee_id,phone,start_date,contract_type',
      'EMP001,john.doe@company.com,John,Doe,IT,Developer,3,,EMP000,1234567890,2024-01-01,full-time',
      'EMP002,jane.smith@company.com,Jane,Smith,IT,Manager,2,,EMP000,1234567891,2024-01-01,full-time'
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  updateFilters() {
    this.filters = {
      search: document.getElementById('userSearch').value,
      department_id: document.getElementById('departmentFilter').value,
      role: document.getElementById('roleFilter').value,
      is_active: document.getElementById('statusFilter').value ? 
        document.getElementById('statusFilter').value === 'true' : undefined
    };

    if (this.currentView === 'users') {
      this.loadUsers();
    }
  }

  async exportUsers() {
    try {
      const csvData = await this.userManager.exportUsers('csv', this.filters);
      if (csvData) {
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export misslyckades: ' + error.message);
    }
  }

  async handleLogout() {
    if (confirm('Är du säker på att du vill logga ut?')) {
      await this.userManager.logout();
      this.hideUserPanel();
      this.showLoginForm();
    }
  }

  showLoginForm() {
    const landingPage = document.getElementById('landingPage');
    const mainApp = document.getElementById('mainApp');
    
    if (landingPage && mainApp) {
      landingPage.classList.remove('hidden');
      mainApp.classList.add('hidden');
    }
  }

  // Helper methods
  getRoleDisplayName(role) {
    const roleNames = {
      'super_admin': 'Superadministratör',
      'org_admin': 'Organisationsadministratör',
      'department_admin': 'Avdelningsadministratör',
      'team_lead': 'Teamledare',
      'member': 'Medlem'
    };
    return roleNames[role] || role;
  }

  getRoleColor(role) {
    const colors = {
      'super_admin': '#dc3545',
      'org_admin': '#fd7e14',
      'department_admin': '#ffc107',
      'team_lead': '#20c997',
      'member': '#6c757d'
    };
    return colors[role] || '#6c757d';
  }
}

// Create global instance
export const userInterface = new UserInterface();
