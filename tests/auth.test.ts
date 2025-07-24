import { supabase } from '../src/lib/supabase';
import { AUTH_CREDENTIALS } from '../src/lib/auth';

describe('User Authentication', () => {
  beforeAll(async () => {
    await supabase.auth.signOut();
  });

  // 1.1 Test de connexion réussie
  test('Successful login generates valid session', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: AUTH_CREDENTIALS.email,
      password: AUTH_CREDENTIALS.password
    });

    expect(error).toBeNull();
    expect(data.session).toBeDefined();
    expect(data.session?.access_token).toBeTruthy();
    expect(data.session?.expires_in).toBe(3600);
  });

  // 1.2 Test d'échec d'authentification
  test('Invalid credentials fail with proper error', async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: 'invalid@example.com',
      password: 'wrongpassword'
    });

    expect(error).not.toBeNull();
    expect(error?.message).toContain('Invalid login credentials');
    expect(error?.status).toBe(400);
  });

  // 1.3 Test d'expiration de session
  test('Session token expires correctly', async () => {
    const { data } = await supabase.auth.signInWithPassword(AUTH_CREDENTIALS);
    const originalToken = data.session?.access_token;
    
    // Simuler expiration en modifiant le timestamp
    await supabase.auth.setSession({
      access_token: originalToken!,
      refresh_token: data.session?.refresh_token!,
      expires_in: 1 // 1 seconde pour le test
    });

    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: { session } } = await supabase.auth.getSession();
    expect(session).toBeNull();
  });
});
