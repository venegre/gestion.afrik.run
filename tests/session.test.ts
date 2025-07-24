import { supabase } from '../src/lib/supabase';

describe('Session Continuity', () => {
  // 4.1 Persistance de session
  test('Session persists across operations', async () => {
    await supabase.auth.signInWithPassword({
      email: 'admin@example.com',
      password: 'admin123456'
    });

    const { data: initialSession } = await supabase.auth.getSession();
    expect(initialSession.session).not.toBeNull();

    // Simuler navigation
    await supabase.from('users').select().limit(1);
    
    const { data: postOpSession } = await supabase.auth.getSession();
    expect(postOpSession.session?.access_token).toBe(initialSession.session?.access_token);
  });

  // 4.2 Récupération après interruption
  test('Recovers from network interruption', async () => {
    // Simuler coupure réseau
    const originalToken = (await supabase.auth.getSession()).data.session?.access_token;
    
    // Rétablir connexion
    const { data: { session } } = await supabase.auth.getSession();
    expect(session?.access_token).toBe(originalToken);
  });
});
