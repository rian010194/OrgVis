// Supabase configuration and client setup with Multi-Organization Support
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2';
import { SUPABASE_CONFIG } from './config.js';

// Create Supabase client (singleton to avoid multiple instances)
let supabaseInstance = null;

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  }
  return supabaseInstance;
})();

// Database service class for multi-organization data
export class OrgDatabase {
  constructor() {
    this.supabase = supabase;
  }

  // Organizations CRUD operations
  async getOrganizations() {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  }

  async getOrganization(id) {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createOrganization(orgData) {
    const { data, error } = await this.supabase
      .from('organizations')
      .insert([orgData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateOrganization(id, updates) {
    const { data, error } = await this.supabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteOrganization(id) {
    const { error } = await this.supabase
      .from('organizations')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Nodes CRUD operations (with organization_id)
  async getNodes(organizationId) {
    const { data, error } = await this.supabase
      .from('nodes')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');
    
    if (error) throw error;
    return data;
  }

  async getNode(id, organizationId) {
    const { data, error } = await this.supabase
      .from('nodes')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createNode(nodeData) {
    const { data, error } = await this.supabase
      .from('nodes')
      .insert([nodeData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateNode(id, updates) {
    const { data, error } = await this.supabase
      .from('nodes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteNode(id) {
    const { error } = await this.supabase
      .from('nodes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Metrics CRUD operations (with organization_id)
  async getMetrics(nodeId, organizationId) {
    const { data, error } = await this.supabase
      .from('metrics')
      .select('*')
      .eq('node_id', nodeId)
      .eq('organization_id', organizationId)
      .order('created_at');
    
    if (error) throw error;
    return data;
  }

  async createMetric(nodeId, organizationId, metricData) {
    const { data, error } = await this.supabase
      .from('metrics')
      .insert([{
        node_id: nodeId,
        organization_id: organizationId,
        ...metricData
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateMetric(metricId, updates) {
    const { data, error } = await this.supabase
      .from('metrics')
      .update(updates)
      .eq('id', metricId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteMetric(metricId) {
    const { error } = await this.supabase
      .from('metrics')
      .delete()
      .eq('id', metricId);
    
    if (error) throw error;
  }

  // Relations CRUD operations (with organization_id)
  async getRelations(organizationId) {
    const { data, error } = await this.supabase
      .from('relations')
      .select(`
        *,
        from_node:nodes!relations_from_node_id_fkey(id, name),
        to_node:nodes!relations_to_node_id_fkey(id, name)
      `)
      .eq('organization_id', organizationId);
    
    if (error) throw error;
    return data;
  }

  async createRelation(relationData) {
    const { data, error } = await this.supabase
      .from('relations')
      .insert([relationData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteRelation(fromNodeId, toNodeId, organizationId) {
    const { error } = await this.supabase
      .from('relations')
      .delete()
      .eq('from_node_id', fromNodeId)
      .eq('to_node_id', toNodeId)
      .eq('organization_id', organizationId);
    
    if (error) throw error;
  }

  // Utility methods
  async getNodesWithMetrics(organizationId) {
    const { data, error } = await this.supabase
      .from('nodes')
      .select(`
        *,
        metrics(*)
      `)
      .eq('organization_id', organizationId);
    
    if (error) throw error;
    return data;
  }

  async getNodeHierarchy(organizationId) {
    const { data, error } = await this.supabase
      .from('nodes')
      .select(`
        *,
        children:nodes!nodes_parent_id_fkey(*),
        parent:nodes!nodes_parent_id_fkey(*)
      `)
      .eq('organization_id', organizationId);
    
    if (error) throw error;
    return data;
  }

  // Real-time subscriptions (with organization filtering)
  subscribeToNodes(callback, organizationId = null) {
    const channel = this.supabase
      .channel('nodes_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'nodes' }, 
        (payload) => {
          // Filter by organization if specified
          if (organizationId && payload.new && payload.new.organization_id !== organizationId) {
            return;
          }
          if (organizationId && payload.old && payload.old.organization_id !== organizationId) {
            return;
          }
          callback(payload);
        }
      )
      .subscribe();
    
    return channel;
  }

  subscribeToMetrics(callback, organizationId = null) {
    const channel = this.supabase
      .channel('metrics_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'metrics' }, 
        (payload) => {
          // Filter by organization if specified
          if (organizationId && payload.new && payload.new.organization_id !== organizationId) {
            return;
          }
          if (organizationId && payload.old && payload.old.organization_id !== organizationId) {
            return;
          }
          callback(payload);
        }
      )
      .subscribe();
    
    return channel;
  }

  subscribeToRelations(callback, organizationId = null) {
    const channel = this.supabase
      .channel('relations_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'relations' }, 
        (payload) => {
          // Filter by organization if specified
          if (organizationId && payload.new && payload.new.organization_id !== organizationId) {
            return;
          }
          if (organizationId && payload.old && payload.old.organization_id !== organizationId) {
            return;
          }
          callback(payload);
        }
      )
      .subscribe();
    
    return channel;
  }

  subscribeToOrganizations(callback) {
    return this.supabase
      .channel('organizations_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'organizations' }, 
        callback
      )
      .subscribe();
  }
}

// Create global instance
export const orgDb = new OrgDatabase();

// Make orgDb globally available for compatibility
window.orgDb = orgDb;

// Make conversion functions globally available
window.convertSupabaseToFrontend = convertSupabaseToFrontend;
window.convertFrontendToSupabase = convertFrontendToSupabase;

// Helper function to convert Supabase data to frontend format
export function convertSupabaseToFrontend(supabaseData) {
  if (!supabaseData) return null;

  const node = {
    id: supabaseData.id,
    name: supabaseData.name,
    type: supabaseData.type,
    role: supabaseData.role,
    parent: supabaseData.parent_id,
    children: supabaseData.children || [],
    inputs: [],
    outputs: [],
    responsibilities: supabaseData.responsibilities || [],
    outcomes: supabaseData.outcomes || [],
    supportOffice: supabaseData.support_office_id,
    metrics: []
  };

  // Convert metrics if they exist
  if (supabaseData.metrics && Array.isArray(supabaseData.metrics)) {
    node.metrics = supabaseData.metrics.map(metric => ({
      id: metric.id,
      name: metric.name,
      type: metric.type,
      unit: metric.unit,
      data: metric.data
    }));
  }

  return node;
}

// Helper function to convert frontend data to Supabase format
export function convertFrontendToSupabase(frontendData) {
  if (!frontendData) return null;

  return {
    id: frontendData.id,
    name: frontendData.name,
    type: frontendData.type,
    role: frontendData.role,
    parent_id: frontendData.parent,
    support_office_id: frontendData.supportOffice,
    responsibilities: frontendData.responsibilities || [],
    outcomes: frontendData.outcomes || []
  };
}
