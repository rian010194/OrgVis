import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yhfwkukibcwsukeqauyg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZndrdWtpYmN3c3VrZXFhdXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMjgwNDUsImV4cCI6MjA3MzgwNDA0NX0.ndZsCRxr-rRcq7KZhxqhzKUFAVB6WHSiOcoO8V_OrlcY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
