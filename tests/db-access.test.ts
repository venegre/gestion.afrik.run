import { supabase } from '../src/lib/supabase';

describe('Database Access', () => {
  let testUserId: string;

  // 2.1 Test CRUD sur Users
  test('Full CRUD operations on Users table', async () => {
    // Create
    const { data: createData, error: createError } = await supabase
      .from('users')
      .insert({ email: 'test@example.com', raw_user_meta_data: {} })
      .select();
    
    expect(createError).toBeNull();
    expect(createData?.[0].id).toBeDefined();
    testUserId = createData?.[0].id;

    // Read
    const { data: readData, error: readError } = await supabase
      .from('users')
      .select()
      .eq('id', testUserId);
    
    expect(readError).toBeNull();
    expect(readData?.length).toBe(1);

    // Update
    const { error: updateError } = await supabase
      .from('users')
      .update({ email: 'updated@example.com' })
      .eq('id', testUserId);
    
    expect(updateError).toBeNull();

    // Delete (soft delete)
    const { error: deleteError } = await supabase
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', testUserId);
    
    expect(deleteError).toBeNull();
  });

  // 2.2 Test des permissions
  test('Row Level Security enforcement', async () => {
    // Tentative d'accès non autorisé
    const { data, error } = await supabase
      .from('users')
      .select()
      .neq('id', testUserId);
    
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });
});
