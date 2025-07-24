import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { createInitialUser } from '../lib/createUser';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        // Create or ensure initial admin user exists
        await createInitialUser();

        // Check existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }

        // Listen for authentication changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return;

          if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
            setUser(null);
            // Clear storage
            sessionStorage.clear();
            localStorage.clear();
          } else if (session) {
            setUser(session.user);
          }
        });

        return () => {
          subscription.unsubscribe();
          mounted = false;
        };
      } catch (error) {
        console.error('Authentication initialization error:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    }

    initializeAuth();
  }, []);

  return { user, loading };
}
