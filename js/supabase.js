// Supabase configuration and client setup
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2';
import { SUPABASE_CONFIG } from './config.js';

// Create Supabase client
export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database service class for organization data
export class OrgDatabase {
  constructor() {
    this.supabase = supabase;
  }

  // Nodes CRUD operations
  async getNodes() {
    const { data, error } = await this.supabase
      .from('nodes')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  }

  async getNode(id) {
    const { data, error } = await this.supabase
      .from('nodes')
      .select('*')
      .eq('id', id)
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

  // Metrics CRUD operations
  async getMetrics(nodeId) {
    const { data, error } = await this.supabase
      .from('metrics')
      .select('*')
      .eq('node_id', nodeId)
      .order('created_at');
    
    if (error) throw error;
    return data;
  }

  async createMetric(nodeId, metricData) {
    const { data, error } = await this.supabase
      .from('metrics')
      .insert([{
        node_id: nodeId,
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

  // Relations CRUD operations
  async getRelations() {
    const { data, error } = await this.supabase
      .from('relations')
      .select(`
        *,
        from_node:nodes!relations_from_node_id_fkey(id, name),
        to_node:nodes!relations_to_node_id_fkey(id, name)
      `);
    
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

  async deleteRelation(fromNodeId, toNodeId) {
    const { error } = await this.supabase
      .from('relations')
      .delete()
      .eq('from_node_id', fromNodeId)
      .eq('to_node_id', toNodeId);
    
    if (error) throw error;
  }

  // Utility methods
  async getNodesWithMetrics() {
    const { data, error } = await this.supabase
      .from('nodes')
      .select(`
        *,
        metrics(*)
      `);
    
    if (error) throw error;
    return data;
  }

  async getNodeHierarchy() {
    const { data, error } = await this.supabase
      .from('nodes')
      .select(`
        *,
        children:nodes!nodes_parent_id_fkey(*),
        parent:nodes!nodes_parent_id_fkey(*)
      `);
    
    if (error) throw error;
    return data;
  }

  // Real-time subscriptions
  subscribeToNodes(callback) {
    return this.supabase
      .channel('nodes_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'nodes' }, 
        callback
      )
      .subscribe();
  }

  subscribeToMetrics(callback) {
    return this.supabase
      .channel('metrics_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'metrics' }, 
        callback
      )
      .subscribe();
  }

  subscribeToRelations(callback) {
    return this.supabase
      .channel('relations_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'relations' }, 
        callback
      )
      .subscribe();
  }
}

// Create global instance
export const orgDb = new OrgDatabase();

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
