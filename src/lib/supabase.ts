import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;https://ilpddhxfqhbicrivetet.supabase.co
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlscGRkaHhmcWhiaWNyaXZldGV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0MjE4MzEsImV4cCI6MjEwNjk5NzgzMX0.sWL9isA-ntd-F9yO_Zvz1h1GUBgYvqnKgrK5flH2a7s

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});