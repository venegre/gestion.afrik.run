import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Edit2, X, Save, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Calendar from './Calendar';
import toast from 'react-hot-toast';

interface Balance {
  id: string;
  name: string;
  amount: number;
}

const DEFAULT_BALANCE_TYPES = [
  'SOLDE GLOBAL CASH',
  'ESPÈCE DISPONIBLE', 
  'SOLDE YAWI ASH',
  'MR BALDE ET MR ALPHA DOIT',
  'SOLDE LPV',
  'MD NOUS DOIT',
  'SOLDE AIRTEL MONEY',
  'NOUS DEVONS MD'
];

export default function DailyBalances() {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [editingCell, setEditingCell] = useState<{id?: string, name: string, amount: string} | null>(null);
  const [editingName, setEditingName] = useState<{id?: string, name: string} | null>(null);

  useEffect(() => {
    fetchBalances();
  }, [selectedDate]);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('daily_balances')
        .select('*')
        .eq('date', selectedDate)
        .order('created_at');

      if (error) throw error;

      // Create entries for missing default types
      const existingNames = new Set((data || []).map(b => b.name));
      const missingBalances = DEFAULT_BALANCE_TYPES
        .filter(name => !existingNames.has(name))
        .map(name => ({
          id: crypto.randomUUID(),
          date: selectedDate,
          name,
          amount: 0
        }));

      setBalances([...(data || []), ...missingBalances]);
    } catch (err) {
      console.error('Error fetching balances:', err);
      setError('Erreur lors du chargement des soldes');
      toast.error('Erreur lors du chargement des soldes');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBalance = async (id: string | undefined, name: string, amount: string) => {
    if (!amount.trim()) {
      toast.error('Le montant ne peut pas être vide');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount)) {
        throw new Error('Le montant doit être un nombre valide');
      }

      // Find existing balance for this name and date
      const { data: existingBalance, error: checkError } = await supabase
        .from('daily_balances')
        .select()
        .eq('date', selectedDate)
        .eq('name', name)
        .maybeSingle();

      if (checkError) throw checkError;

      let result;
      if (existingBalance) {
        // Update existing balance
        result = await supabase
          .from('daily_balances')
          .update({ amount: numericAmount })
          .eq('id', existingBalance.id)
          .eq('name', name) // Add name check to ensure we update the correct entry
          .select()
          .single();
      } else {
        // Insert new balance
        result = await supabase
          .from('daily_balances')
          .insert([{
            date: selectedDate,
            name: name, // Ensure correct name is used
            amount: numericAmount
          }])
          .select()
          .single();
      }

      if (result.error) throw result.error;

      setEditingCell(null);
      toast.success('Solde mis à jour avec succès');
      
      // Refresh to ensure consistency
      await fetchBalances();
    } catch (err) {
      console.error('Error updating balance:', err);
      toast.error('Erreur lors de la mise à jour');
      setError('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async (id: string | undefined, newName: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (id) {
        const { error } = await supabase
          .from('daily_balances')
          .update({ name: newName })
          .eq('id', id);

        if (error) throw error;
      }

      setEditingName(null);
      toast.success('Nom mis à jour avec succès');
      await fetchBalances();
    } catch (err) {
      console.error('Error updating name:', err);
      toast.error('Erreur lors de la mise à jour du nom');
      setError('Erreur lors de la mise à jour du nom');
    } finally {
      setLoading(false);
    }
  };

  const resetToToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  if (loading && !balances.length) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Soldes du {format(new Date(selectedDate), 'd MMMM yyyy', { locale: fr })}
            </h3>
            <div className="flex items-center space-x-2">
              <div className="w-48">
                <Calendar
                  value={selectedDate}
                  onChange={setSelectedDate}
                  dateStatuses={new Map()}
                  className="w-full"
                />
              </div>
              <button
                onClick={resetToToday}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                title="Revenir à aujourd'hui"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {balances.map((balance) => (
            <div key={balance.id} className="flex flex-col">
              <div className="flex items-center justify-between mb-1">
                {editingName?.id === balance.id ? (
                  <input
                    type="text"
                    value={editingName.name}
                    onChange={(e) => setEditingName({ ...editingName, name: e.target.value })}
                    onBlur={() => handleUpdateName(balance.id, editingName.name)}
                    onKeyPress={(e) => e.key === 'Enter' && handleUpdateName(balance.id, editingName.name)}
                    className="block w-full text-sm font-medium text-gray-700 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                ) : (
                  <label 
                    className="text-sm font-medium text-gray-700 cursor-pointer hover:text-blue-600"
                    onClick={() => setEditingName({ id: balance.id, name: balance.name })}
                  >
                    {balance.name}
                  </label>
                )}
              </div>
              <div className="relative">
                {editingCell?.id === balance.id ? (
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={editingCell.amount}
                      onChange={(e) => setEditingCell({ ...editingCell, amount: e.target.value })}
                      onKeyPress={(e) => e.key === 'Enter' && handleUpdateBalance(balance.id, balance.name, editingCell.amount)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdateBalance(balance.id, balance.name, editingCell.amount)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Save className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => setEditingCell({ id: balance.id, name: balance.name, amount: balance.amount.toString() })}
                    className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100"
                  >
                    <span>{balance.amount.toLocaleString()}</span>
                    <span className="text-gray-500">FCFA</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
