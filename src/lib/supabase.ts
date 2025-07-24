import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Configuration Supabase manquante');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: sessionStorage,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'Cache-Control': 'no-cache',
    },
  },
});

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  sessionStorage.clear();
  return true;
};

export const checkAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};
