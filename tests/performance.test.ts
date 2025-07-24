import { supabase } from '../src/lib/supabase';

describe('Query Performance', () => {
  // 3.1 Test de performance
  test('Critical queries under 100ms', async () => {
    const startTime = performance.now();
    
    const { error } = await supabase
      .from('users')
      .select('id, email')
      .limit(10);
    
    const duration = performance.now() - startTime;
    console.log(`Query executed in ${duration.toFixed(2)}ms`);
    
    expect(error).toBeNull();
    expect(duration).toBeLessThan(100);
  });

  // 3.2 Test avec jeu de données volumineux
  test('Handles large datasets', async () => {
    // Générer 1000 entrées de test
    const testUsers = Array.from({ length: 1000 }, (_, i) => ({
      email: `perftest${i}@example.com`,
      raw_user_meta_data: {}
    }));

    const { error: insertError } = await supabase
      .from('users')
      .insert(testUsers);
    
    expect(insertError).toBeNull();

    // Mesurer la lecture
    const startTime = performance.now();
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .like('email', 'perftest%');
    
    const duration = performance.now() - startTime;
    console.log(`Scanned ${count} records in ${duration.toFixed(2)}ms`);
    
    expect(count).toBe(1000);
    expect(duration).toBeLessThan(500);
  });
});
