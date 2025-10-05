// User Management System for Large Organizations
import { supabase } from './supabase-multi-org.js';

export class UserManager {
  constructor() {
    this.currentUser = null;
    this.currentSession = null;
    this.permissions = null;
    this.organizationStats = null;
  }

  // Authentication methods
  async login(email, password) {
    try {
      const passwordHash = await this.hashPassword(password);
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          department:departments(id, name, code),
          manager:users!users_manager_user_id_fkey(id, name, email)
        `)
        .eq('email', email)
        .eq('password_hash', passwordHash)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        throw new Error('Invalid credentials');
      }

      // Create session
      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await supabase
        .from('user_sessions')
        .insert({
          user_id: data.id,
          token: sessionToken,
          expires_at: expiresAt.toISOString()
        });

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id);

      this.currentUser = data;
      this.currentSession = { token: sessionToken, expires_at: expiresAt };

      // Load permissions and organization stats
      await Promise.all([
        this.loadUserPermissions(),
        this.loadOrganizationStats()
      ]);

      // Store session in localStorage
      localStorage.setItem('userSession', JSON.stringify({
        user: data,
        session: this.currentSession
      }));

      // Log login activity
      await this.logActivity('login', 'session');

      return { success: true, user: data };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  async logout() {
    try {
      if (this.currentSession) {
        await supabase
          .from('user_sessions')
          .delete()
          .eq('token', this.currentSession.token);
      }

      // Log logout activity
      await this.logActivity('logout', 'session');

      localStorage.removeItem('userSession');
      this.currentUser = null;
      this.currentSession = null;
      this.permissions = null;
      this.organizationStats = null;

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }

  async restoreSession() {
    try {
      const sessionData = localStorage.getItem('userSession');
      if (!sessionData) return { success: false, error: 'No session found' };

      const { user, session } = JSON.parse(sessionData);
      
      // Check if session is still valid
      if (new Date(session.expires_at) < new Date()) {
        localStorage.removeItem('userSession');
        return { success: false, error: 'Session expired' };
      }

      // Verify session in database
      const { data: sessionData, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('token', session.token)
        .eq('user_id', user.id)
        .single();

      if (error || !sessionData) {
        localStorage.removeItem('userSession');
        return { success: false, error: 'Invalid session' };
      }

      this.currentUser = user;
      this.currentSession = session;
      await Promise.all([
        this.loadUserPermissions(),
        this.loadOrganizationStats()
      ]);

      return { success: true, user: user };
    } catch (error) {
      console.error('Session restore error:', error);
      return { success: false, error: error.message };
    }
  }

  // Organization and department management
  async loadOrganizationStats() {
    if (!this.currentUser) return;

    try {
      const { data, error } = await supabase.rpc('get_organization_stats', {
        org_id_param: this.currentUser.organization_id
      });

      if (error) throw error;
      this.organizationStats = data;
    } catch (error) {
      console.error('Error loading organization stats:', error);
      this.organizationStats = null;
    }
  }

  async getDepartments() {
    if (!this.currentUser) return [];

    try {
      const { data, error } = await supabase
        .from('departments')
        .select(`
          *,
          manager:users!departments_manager_user_id_fkey(id, name, email),
          parent_department:departments!departments_parent_department_id_fkey(id, name, code)
        `)
        .eq('organization_id', this.currentUser.organization_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading departments:', error);
      return [];
    }
  }

  async createDepartment(departmentData) {
    if (!this.canManageDepartments()) {
      throw new Error('Insufficient permissions');
    }

    try {
      const { data, error } = await supabase
        .from('departments')
        .insert([{
          organization_id: this.currentUser.organization_id,
          ...departmentData
        }])
        .select()
        .single();

      if (error) throw error;

      await this.logActivity('create', 'department', data.id, departmentData);
      return { success: true, department: data };
    } catch (error) {
      console.error('Error creating department:', error);
      return { success: false, error: error.message };
    }
  }

  // User management (bulk operations)
  async bulkImportUsers(file, options = {}) {
    if (!this.canBulkImportUsers()) {
      throw new Error('Insufficient permissions');
    }

    try {
      // Parse CSV file
      const csvData = await this.parseCSVFile(file);
      const usersData = this.processCSVData(csvData, options);
      
      // Create bulk import job
      const { data: job, error: jobError } = await supabase
        .from('bulk_import_jobs')
        .insert([{
          organization_id: this.currentUser.organization_id,
          created_by: this.currentUser.id,
          filename: file.name,
          total_rows: usersData.length,
          status: 'processing'
        }])
        .select()
        .single();

      if (jobError) throw jobError;

      // Process users in batches
      const batchSize = 50; // Process 50 users at a time
      const results = await this.processUserBatches(usersData, batchSize);

      // Update job status
      await supabase
        .from('bulk_import_jobs')
        .update({
          status: 'completed',
          processed_rows: results.total,
          successful_rows: results.successful,
          failed_rows: results.failed,
          errors: results.errors,
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id);

      await this.logActivity('bulk_import', 'users', null, {
        filename: file.name,
        total: results.total,
        successful: results.successful,
        failed: results.failed
      });

      return { success: true, results: results, jobId: job.id };
    } catch (error) {
      console.error('Bulk import error:', error);
      return { success: false, error: error.message };
    }
  }

  async processUserBatches(usersData, batchSize) {
    const results = {
      total: usersData.length,
      successful: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < usersData.length; i += batchSize) {
      const batch = usersData.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabase.rpc('bulk_create_users', {
          org_id_param: this.currentUser.organization_id,
          created_by_param: this.currentUser.id,
          users_data: batch
        });

        if (error) throw error;

        results.successful += data.successful;
        results.failed += data.failed;
        results.errors = results.errors.concat(data.errors || []);
      } catch (error) {
        console.error('Batch processing error:', error);
        results.failed += batch.length;
        results.errors.push({
          batch: `Batch ${Math.floor(i / batchSize) + 1}`,
          error: error.message
        });
      }
    }

    return results;
  }

  parseCSVFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target.result;
          const lines = csv.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          
          const data = lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
              const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
              const row = {};
              headers.forEach((header, index) => {
                row[header] = values[index] || '';
              });
              return row;
            });

          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  processCSVData(csvData, options) {
    const requiredFields = ['employee_id', 'email', 'first_name', 'last_name'];
    const processedData = [];

    for (const row of csvData) {
      try {
        // Validate required fields
        const missingFields = requiredFields.filter(field => !row[field]);
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Process user data
        const userData = {
          employee_id: row.employee_id,
          email: row.email.toLowerCase(),
          name: `${row.first_name} ${row.last_name}`,
          first_name: row.first_name,
          last_name: row.last_name,
          password_hash: await this.hashPassword(options.defaultPassword || 'password123'),
          department_id: await this.getDepartmentIdByCode(row.department_code),
          position: row.position || '',
          level: parseInt(row.level) || 5,
          role: row.role || null, // Will be auto-assigned if null
          manager_user_id: row.manager_employee_id ? await this.getUserIdByEmployeeId(row.manager_employee_id) : null,
          permissions: {},
          profile_data: {
            phone: row.phone || '',
            title: row.position || ''
          },
          employment_data: {
            start_date: row.start_date || null,
            contract_type: row.contract_type || 'full-time'
          }
        };

        processedData.push(userData);
      } catch (error) {
        console.error('Error processing row:', row, error);
        // Continue with other rows
      }
    }

    return processedData;
  }

  async getDepartmentIdByCode(departmentCode) {
    if (!departmentCode) return null;

    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id')
        .eq('organization_id', this.currentUser.organization_id)
        .eq('code', departmentCode.toUpperCase())
        .single();

      return error ? null : data?.id;
    } catch (error) {
      console.error('Error getting department ID:', error);
      return null;
    }
  }

  async getUserIdByEmployeeId(employeeId) {
    if (!employeeId) return null;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('organization_id', this.currentUser.organization_id)
        .eq('employee_id', employeeId)
        .single();

      return error ? null : data?.id;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }

  // Individual user management
  async createUser(userData) {
    if (!this.canManageUsers()) {
      throw new Error('Insufficient permissions');
    }

    try {
      const passwordHash = await this.hashPassword(userData.password || 'password123');
      
      const { data, error } = await supabase.rpc('create_user', {
        user_employee_id: userData.employee_id,
        user_email: userData.email,
        user_name: userData.name,
        user_first_name: userData.first_name,
        user_last_name: userData.last_name,
        user_password_hash: passwordHash,
        user_org_id: this.currentUser.organization_id,
        user_department_id: userData.department_id || null,
        user_position: userData.position || '',
        user_level: userData.level || 5,
        user_role: userData.role || null,
        user_manager_id: userData.manager_user_id || null,
        user_permissions: userData.permissions || {},
        user_profile_data: userData.profile_data || {},
        user_employment_data: userData.employment_data || {}
      });

      if (error) throw error;

      await this.logActivity('create', 'user', data);
      return { success: true, userId: data };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }
  }

  async getUsers(filters = {}) {
    if (!this.currentUser) return [];

    try {
      let query = supabase
        .from('users')
        .select(`
          *,
          department:departments(id, name, code),
          manager:users!users_manager_user_id_fkey(id, name, email, employee_id)
        `)
        .eq('organization_id', this.currentUser.organization_id);

      // Apply filters
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters.department_id) {
        query = query.eq('department_id', filters.department_id);
      }
      if (filters.role) {
        query = query.eq('role', filters.role);
      }
      if (filters.level) {
        query = query.eq('level', filters.level);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,employee_id.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  }

  async updateUser(userId, updates) {
    if (!this.canManageUsers()) {
      throw new Error('Insufficient permissions');
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .eq('organization_id', this.currentUser.organization_id)
        .select()
        .single();

      if (error) throw error;

      await this.logActivity('update', 'user', userId, updates);
      return { success: true, user: data };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteUser(userId) {
    if (!this.canManageUsers()) {
      throw new Error('Insufficient permissions');
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', userId)
        .eq('organization_id', this.currentUser.organization_id);

      if (error) throw error;

      await this.logActivity('delete', 'user', userId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: error.message };
    }
  }

  // Permission management
  async loadUserPermissions() {
    if (!this.currentUser) return;

    try {
      const { data, error } = await supabase.rpc('get_user_node_permissions', {
        user_id_param: this.currentUser.id,
        node_id_param: '', // Empty to get role-based permissions
        org_id_param: this.currentUser.organization_id
      });

      if (error) throw error;
      this.permissions = data;
    } catch (error) {
      console.error('Error loading permissions:', error);
      this.permissions = { access: false };
    }
  }

  async getNodePermissions(nodeId) {
    if (!this.currentUser) return { access: false };

    try {
      const { data, error } = await supabase.rpc('get_user_node_permissions', {
        user_id_param: this.currentUser.id,
        node_id_param: nodeId,
        org_id_param: this.currentUser.organization_id
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting node permissions:', error);
      return { access: false };
    }
  }

  async assignNodePermission(userId, nodeId, permissionType, options = {}) {
    if (!this.canManageUsers()) {
      throw new Error('Insufficient permissions');
    }

    try {
      const { data, error } = await supabase.rpc('assign_node_permission', {
        user_id_param: userId,
        node_id_param: nodeId,
        org_id_param: this.currentUser.organization_id,
        permission_type_param: permissionType,
        include_children_param: options.includeChildren !== false,
        can_manage_children_param: options.canManageChildren || false,
        can_create_children_param: options.canCreateChildren || false,
        can_delete_children_param: options.canDeleteChildren || false
      });

      if (error) throw error;

      await this.logActivity('assign_permission', 'user_node_permission', `${userId}-${nodeId}`, {
        permissionType,
        options
      });

      return { success: true, permissionId: data };
    } catch (error) {
      console.error('Error assigning node permission:', error);
      return { success: false, error: error.message };
    }
  }

  // Permission checking methods
  canManageUsers() {
    return ['org_admin', 'super_admin'].includes(this.currentUser?.role);
  }

  canBulkImportUsers() {
    return this.canManageUsers() && this.currentUser?.permissions?.can_bulk_import;
  }

  canManageDepartments() {
    return ['org_admin', 'super_admin'].includes(this.currentUser?.role);
  }

  canManageNode(nodeId) {
    // This would need to be checked per node
    return ['org_admin', 'super_admin'].includes(this.currentUser?.role);
  }

  canViewNode(nodeId) {
    return this.currentUser?.role !== 'member' || this.canManageNode(nodeId);
  }

  canEditNode(nodeId) {
    return this.canManageNode(nodeId);
  }

  canCreateNodes() {
    return ['org_admin', 'super_admin', 'department_admin'].includes(this.currentUser?.role);
  }

  canDeleteNodes() {
    return ['org_admin', 'super_admin'].includes(this.currentUser?.role);
  }

  // Activity logging
  async logActivity(action, resourceType, resourceId = null, details = {}) {
    if (!this.currentUser) return;

    try {
      await supabase.rpc('log_user_activity', {
        user_id_param: this.currentUser.id,
        org_id_param: this.currentUser.organization_id,
        action_param: action,
        resource_type_param: resourceType,
        resource_id_param: resourceId,
        details_param: details
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  // Utility methods
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  generateSessionToken() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  // Get current user info
  getCurrentUser() {
    return this.currentUser;
  }

  getCurrentPermissions() {
    return this.permissions;
  }

  getOrganizationStats() {
    return this.organizationStats;
  }

  isLoggedIn() {
    return this.currentUser !== null;
  }

  // Export data
  async exportUsers(format = 'csv', filters = {}) {
    if (!this.canManageUsers()) {
      throw new Error('Insufficient permissions');
    }

    try {
      const users = await this.getUsers(filters);
      
      if (format === 'csv') {
        return this.convertUsersToCSV(users);
      } else if (format === 'json') {
        return JSON.stringify(users, null, 2);
      }

      throw new Error('Unsupported format');
    } catch (error) {
      console.error('Export error:', error);
      return null;
    }
  }

  convertUsersToCSV(users) {
    if (users.length === 0) return '';

    const headers = [
      'employee_id', 'email', 'name', 'first_name', 'last_name',
      'department', 'position', 'level', 'role', 'manager_employee_id',
      'phone', 'start_date', 'contract_type', 'is_active'
    ];

    const csvRows = [headers.join(',')];

    for (const user of users) {
      const row = [
        user.employee_id,
        user.email,
        `"${user.name}"`,
        user.first_name,
        user.last_name,
        user.department?.name || '',
        `"${user.position}"`,
        user.level,
        user.role,
        user.manager?.employee_id || '',
        user.profile_data?.phone || '',
        user.employment_data?.start_date || '',
        user.employment_data?.contract_type || '',
        user.is_active
      ];
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }
}

// Create global instance
export const userManager = new UserManager();
