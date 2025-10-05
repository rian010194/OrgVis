// Configuration for Supabase
// Replace these values with your actual Supabase project credentials

// Configuration for Supabase
// Automatically detects if running locally or on Netlify
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const SUPABASE_CONFIG = isLocal ? {
  // For local development - use same as production for now
  url: 'https://cihgptcfhaeujxhpvame.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpaGdwdGNmaGFldWp4aHB2YW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDUyMzMsImV4cCI6MjA3NTA4MTIzM30.ZnGwhkJ6tJWV_jyKMOQ7NE8oS0iZTmR7u3171KpX_SU',
  debug: true
} : {
  // For production on Netlify
  url: 'https://cihgptcfhaeujxhpvame.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpaGdwdGNmaGFldWp4aHB2YW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDUyMzMsImV4cCI6MjA3NTA4MTIzM30.ZnGwhkJ6tJWV_jyKMOQ7NE8oS0iZTmR7u3171KpX_SU',
  debug: false
};

// Instructions for setup:
// 1. Go to https://supabase.com/dashboard
// 2. Create a new project or select existing one
// 3. Go to Settings > API
// 4. Copy the Project URL and replace 'your-project-ref.supabase.co' above
// 5. Copy the anon/public key and replace 'your-anon-key-here' above
// 6. Save this file

// For local development with Supabase CLI:
// If you're running Supabase locally, use these values instead:
// url: 'http://localhost:54321'
// anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
