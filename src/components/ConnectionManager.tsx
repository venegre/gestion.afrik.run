import React, { useState } from 'react';
import { RefreshCw, LogOut, LogIn } from 'lucide-react';
import { disconnectSupabase, reconnectSupabase, refreshConnection } from '../lib/supabase';

interface ConnectionManagerProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

export default function ConnectionManager({ onConnectionChange }: ConnectionManagerProps) {
  const [loading, setLoading] = useState(false);
  const [showReconnect, setShowReconnect] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const success = await disconnectSupabase();
      if (success) {
        setShowReconnect(true);
        onConnectionChange?.(false);
      } else {
        throw new Error('Échec de la déconnexion');
      }
    } catch (err) {
      setError('Erreur lors de la déconnexion');
    } finally {
      setLoading(false);
    }
  };

  const handleReconnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const { success, error } = await reconnectSupabase(email, password);
      if (success) {
        setShowReconnect(false);
        onConnectionChange?.(true);
        window.location.reload();
      } else {
        throw error;
      }
    } catch (err) {
      setError('Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const { success } = await refreshConnection();
      if (success) {
        onConnectionChange?.(true);
        window.location.reload();
      } else {
        throw new Error('Échec du rafraîchissement');
      }
    } catch (err) {
      setError('Erreur lors du rafraîchissement');
    } finally {
      setLoading(false);
    }
  };

  if (showReconnect) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Reconnexion à Supabase
          </h2>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Votre email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Votre mot de passe"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                onClick={handleReconnect}
                disabled={loading || !email || !password}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                <LogIn className="w-4 h-4 mr-2" />
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 flex space-x-2 z-50">
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors duration-200"
        title="Rafraîchir la connexion"
      >
        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
      </button>
      <button
        onClick={handleDisconnect}
        disabled={loading}
        className="p-2 bg-red-100 rounded-full hover:bg-red-200 text-red-600 hover:text-red-800 transition-colors duration-200"
        title="Déconnecter Supabase"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </div>
  );
}
