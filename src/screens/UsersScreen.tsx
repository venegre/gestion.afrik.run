import React, { useState, useEffect } from 'react';
import { UserPlus, Lock, Unlock, X, Phone, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AppUser {
  id: string;
  email: string;
  phone_number: string | null;
  created_at: string;
  is_active: boolean;
  blocked: boolean;
}

export default function UsersScreen() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      alert('Unable to load users');
    } finally {
      setLoading(false);
    }
  }

  const validatePhoneNumber = (phone: string): string | null => {
    const phoneRegex = /^\+?[0-9]{8,15}$/;
    if (!phoneRegex.test(phone)) {
      return 'Invalid phone number';
    }
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return null;
  };

  const handleAddUser = async () => {
    const phoneError = validatePhoneNumber(phoneNumber);
    if (phoneError) {
      alert(phoneError);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      alert(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      const { error: appUserError } = await supabase
        .from('app_users')
        .insert([{
          id: authData.user?.id,
          email,
          phone_number: phoneNumber,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }]);

      if (appUserError) throw appUserError;

      await fetchUsers();
      setShowAddForm(false);
      resetForm();
      alert('User created successfully');
    } catch (err) {
      alert('Unable to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (user: AppUser) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('app_users')
        .update({ blocked: !user.blocked })
        .eq('id', user.id);

      if (error) throw error;
      await fetchUsers();
    } catch (err) {
      alert('Unable to modify user status');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('app_users')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) throw error;
      await fetchUsers();
    } catch (err) {
      alert('Unable to delete user');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPhoneNumber('');
    setPassword('');
    setConfirmPassword('');
  };

  if (loading && !users.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <UserPlus size={20} />
            <span>New User</span>
          </button>
        </div>

        {showAddForm && (
          <div className="bg-gray-100 rounded-xl p-6 space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="flex items-center bg-white rounded-lg px-3 border border-gray-300">
                <Mail size={20} className="text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="flex-1 px-2 py-2 border-0 focus:ring-0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <div className="flex items-center bg-white rounded-lg px-3 border border-gray-300">
                <Phone size={20} className="text-gray-500" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+33612345678"
                  className="flex-1 px-2 py-2 border-0 focus:ring-0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                disabled={loading}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {users.filter(user => user.is_active).map(user => (
            <div key={user.id} className="bg-gray-100 rounded-xl p-4 flex justify-between items-center">
              <div className="space-y-1">
                <p className="font-semibold text-gray-900">{user.email}</p>
                {user.phone_number && (
                  <p className="text-gray-600">{user.phone_number}</p>
                )}
                {user.blocked && (
                  <span className="inline-block bg-red-100 text-red-600 text-sm px-2 py-1 rounded-full">
                    Blocked
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleBlock(user)}
                  className={`p-2 rounded-lg ${user.blocked ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-600'} hover:opacity-80`}
                >
                  {user.blocked ? <Unlock size={20} /> : <Lock size={20} />}
                </button>
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className="p-2 rounded-lg bg-red-100 text-red-600 hover:opacity-80"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="text-center py-12 bg-gray-100 rounded-xl">
              <UserPlus size={48} className="mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">No Users</h3>
              <p className="text-gray-600">Start by creating a new user</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
