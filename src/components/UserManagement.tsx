import React, { useState, useEffect } from 'react';
import { UserPlus, Edit2, Lock, Unlock, X, Check, Phone, Mail, Key, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AppUser {
  id: string;
  email: string;
  phone_number: string | null;
  created_at: string;
  is_active: boolean;
  blocked: boolean;
}

export default function UserManagement() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    checkAdminStatus();
    fetchUsers();
  }, []);

  async function checkAdminStatus() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: appUser, error: userError } = await supabase
        .from('app_users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;
      
      setIsAdmin(appUser?.is_admin || false);
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
    }
  }

  async function fetchUsers() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  }

  const validatePhoneNumber = (phone: string): string | null => {
    const phoneRegex = /^\+?[0-9]{8,15}$/;
    if (!phoneRegex.test(phone)) {
      return 'Numéro de téléphone invalide';
    }
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return 'Le mot de passe doit contenir au moins 6 caractères';
    }
    return null;
  };

  const handleAddUser = async () => {
    if (!isAdmin) {
      setError('Vous devez être administrateur pour créer des utilisateurs');
      return;
    }

    const phoneError = validatePhoneNumber(phoneNumber);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      setError(null);

      // First create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim()
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erreur lors de la création de l\'utilisateur');

      // Then create the app_user record
      const { error: appUserError } = await supabase
        .from('app_users')
        .insert([
          {
            id: authData.user.id,
            email: authData.user.email,
            phone_number: phoneNumber,
            is_active: true,
            is_admin: false,
            blocked: false
          }
        ]);

      if (appUserError) throw appUserError;

      await fetchUsers();
      setShowAddForm(false);
      resetForm();
      
    } catch (err) {
      console.error('Error creating user:', err);
      setError('Erreur lors de la création de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!isAdmin) {
      setError('Vous devez être administrateur pour modifier les utilisateurs');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const updates: Partial<AppUser> = {
        email,
        phone_number: phoneNumber
      };

      if (password) {
        const validationError = validatePassword(password);
        if (validationError) {
          setError(validationError);
          return;
        }

        if (password !== confirmPassword) {
          setError('Les mots de passe ne correspondent pas');
          return;
        }

        // Update password using Supabase Edge Function
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Non authentifié');

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-user`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              userId: selectedUser.id,
              password: password
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erreur lors de la mise à jour du mot de passe');
        }
      }

      const { error: updateError } = await supabase
        .from('app_users')
        .update(updates)
        .eq('id', selectedUser.id);

      if (updateError) throw updateError;

      await fetchUsers();
      setShowEditForm(false);
      resetForm();
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Erreur lors de la modification de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (user: AppUser) => {
    if (!isAdmin) {
      setError('Vous devez être administrateur pour bloquer/débloquer les utilisateurs');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('app_users')
        .update({ blocked: !user.blocked })
        .eq('id', user.id);

      if (error) throw error;

      await fetchUsers();
    } catch (err) {
      console.error('Error toggling user block status:', err);
      setError('Erreur lors du changement du statut de blocage');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!isAdmin) {
      setError('Vous devez être administrateur pour supprimer des utilisateurs');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('app_users')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Erreur lors de la suppression de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupUserData = async (userId: string) => {
    if (!isAdmin) {
      setError('Vous devez être administrateur pour nettoyer les données des utilisateurs');
      return;
    }

    if (!confirm('Cette action va archiver toutes les anciennes transactions de cet utilisateur. Voulez-vous continuer ?')) {
      return;
    }

    setCleanupLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Non authentifié');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cleanup-data`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            userId,
            months: 12 // Archive transactions older than 12 months
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors du nettoyage');
      }

      await fetchUsers();
    } catch (err) {
      console.error('Error cleaning up user data:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du nettoyage des données');
    } finally {
      setCleanupLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPhoneNumber('');
    setPassword('');
    setConfirmPassword('');
    setSelectedUser(null);
    setError(null);
  };

  const startEdit = (user: AppUser) => {
    if (!isAdmin) {
      setError('Vous devez être administrateur pour modifier les utilisateurs');
      return;
    }
    setSelectedUser(user);
    setEmail(user.email);
    setPhoneNumber(user.phone_number || '');
    setPassword('');
    setConfirmPassword('');
    setShowEditForm(true);
  };

  if (loading && !users.length) {
    return (
      <div className="bg-white shadow rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="bg-white shadow rounded-xl p-6">
        <div className="text-center py-12">
          <Lock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Accès restreint</h3>
          <p className="mt-1 text-sm text-gray-500">
            Vous devez être administrateur pour accéder à la gestion des utilisateurs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Gestion des utilisateurs
          </h3>
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Nouvel utilisateur
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {(showAddForm || showEditForm) && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <form onSubmit={showAddForm ? handleAddUser : handleEditUser} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                  Numéro de téléphone
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                    placeholder="+33612345678"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  {showEditForm ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      const error = validatePassword(e.target.value);
                      if (error) setError(error);
                      else setError(null);
                    }}
                    minLength={6}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required={!showEditForm}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Le mot de passe doit contenir au moins 6 caractères
                </p>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmer le mot de passe
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required={!showEditForm || !!password}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    showAddForm ? setShowAddForm(false) : setShowEditForm(false);
                    resetForm();
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || (showAddForm && (!!validatePassword(password) || password !== confirmPassword))}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <Check className="h-5 w-5 mr-2" />
                  {showAddForm ? 'Créer l\'utilisateur' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {users.filter(user => user.is_active).map(user => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <div>
                <p className="font-medium text-gray-900">{user.email}</p>
                {user.phone_number && (
                  <p className="text-sm text-gray-600">{user.phone_number}</p>
                )}
                {user.blocked && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Bloqué
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCleanupUserData(user.id)}
                  disabled={cleanupLoading}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleToggleBlock(user)}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    user.blocked
                      ? 'text-red-400 hover:text-red-600 hover:bg-red-50'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {user.blocked ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => startEdit(user)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun utilisateur</h3>
              <p className="mt-1 text-sm text-gray-500">
                Commencez par créer un nouvel utilisateur.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
