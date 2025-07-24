import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Check, X, Clock, Calendar as CalendarIcon, Search, RefreshCw, CreditCard, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash-es';
import toast from 'react-hot-toast';

interface Client {
  id: string;
  name: string;
}

interface Transaction {
  id: string;
  amount_sent: number;
  amount_paid: number;
  amount_to_pay: number;
  description: string | null;
  date: string;
  created_at: string;
  last_modified_at: string | null;
  payment_method: 'ESPECE' | 'AIRTEL_MONEY' | null;
}

interface EditingTransaction {
  id: string;
  amount_sent: string;
  amount_paid: string;
  amount_to_pay: string;
  description: string;
}

const PaymentMethodIcon = ({ method }: { method: 'ESPECE' | 'AIRTEL_MONEY' | null }) => {
  if (method === 'AIRTEL_MONEY') {
    return <CreditCard className="w-4 h-4 text-green-600" />;
  }
  return <Wallet className="w-4 h-4 text-green-600" />;
};

export default function SendForm() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [amountSent, setAmountSent] = useState('');
  const [amountToPay, setAmountToPay] = useState('');
  const [description, setDescription] = useState('');
  const [senderName, setSenderName] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [destination, setDestination] = useState('');
  const [code, setCode] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchCache = useRef(new Map<string, Client[]>());
  const [showClientList, setShowClientList] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [editClientName, setEditClientName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<EditingTransaction | null>(null);

  const handleReset = () => {
    setSearchTerm('');
    setSelectedClient(null);
    setClients([]);
    setShowClientList(false);
    setTransactions([]);
    setEditingClient(null);
    setEditClientName('');
    setError(null);
  };

  const searchClients = async (term: string) => {
    if (!term) return;
    
    try {
      setSearchLoading(true);
      setError(null);

      const cacheKey = term.toLowerCase();
      if (searchCache.current.has(cacheKey)) {
        setClients(searchCache.current.get(cacheKey) || []);
        setSearchLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .ilike('name', `%${term}%`)
        .is('deleted_at', null)
        .eq('created_by', user.id)
        .order('name')
        .limit(10);

      if (fetchError) throw fetchError;

      searchCache.current.set(cacheKey, data || []);
      setClients(data || []);
    } catch (err) {
      console.error('Error searching clients:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((term: string) => searchClients(term), 300),
    []
  );

  useEffect(() => {
    if (searchTerm) {
      debouncedSearch(searchTerm);
      setShowClientList(true);
    } else {
      setClients([]);
      setShowClientList(false);
      setSelectedClient(null);
    }

    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, debouncedSearch]);

  useEffect(() => {
    if (selectedClient) {
      fetchTransactions();
    } else {
      setTransactions([]);
    }
  }, [selectedClient]);

  async function fetchTransactions() {
    if (!selectedClient) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('client_id', selectedClient)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  }

  async function handleSubmit() {
    if (!selectedClient || !amountSent || !amountToPay) {
      toast.error('Tous les champs sont requis');
      return;
    }

    setLoading(true);
    try {
      const formattedDescription = `
A- NOM DE L'EXPEDITEUR: ${senderName}
B- RECEVEUR: ${receiverName}
C- DESTINATION: ${destination}
D- CODE: ${code}
E- NOTE: ${note}
      `.trim();

      const { error } = await supabase
        .from('transactions')
        .insert([{
          client_id: selectedClient,
          amount_sent: parseFloat(amountSent),
          amount_paid: 0,
          amount_to_pay: parseFloat(amountToPay),
          description: formattedDescription,
          receiver_name: receiverName
        }]);

      if (error) throw error;

      setAmountSent('');
      setAmountToPay('');
      setSenderName('');
      setReceiverName('');
      setDestination('');
      setCode('');
      setNote('');
      fetchTransactions();
      
      toast.success('Transaction enregistrée', {
        duration: 2000,
        position: 'top-right',
        style: {
          background: '#fff',
          color: '#000',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      });

    } catch (err) {
      toast.error('Impossible d\'enregistrer la transaction');
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateTransaction = async () => {
    if (!editingTransaction) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          amount_sent: parseFloat(editingTransaction.amount_sent),
          amount_paid: parseFloat(editingTransaction.amount_paid),
          amount_to_pay: parseFloat(editingTransaction.amount_to_pay),
          description: editingTransaction.description.trim() || null
        })
        .eq('id', editingTransaction.id);

      if (error) throw error;

      setEditingTransaction(null);
      fetchTransactions();
    } catch (err) {
      toast.error('Impossible de mettre à jour la transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClientName = async (clientId: string) => {
    if (!editClientName.trim()) {
      setError('Le nom du client est requis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: existingClients, error: checkError } = await supabase
        .from('clients')
        .select('id')
        .eq('name', editClientName.trim())
        .neq('id', clientId)
        .is('deleted_at', null);

      if (checkError) throw checkError;

      if (existingClients && existingClients.length > 0) {
        setError('Un client avec ce nom existe déjà');
        return;
      }

      const { error: updateError } = await supabase
        .from('clients')
        .update({ name: editClientName.trim() })
        .eq('id', clientId);

      if (updateError) throw updateError;

      setEditingClient(null);
      setEditClientName('');
      searchClients(searchTerm);
    } catch (err) {
      console.error('Error updating client:', err);
      setError('Erreur lors de la mise à jour du client');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) {
      setError('Le nom du client est requis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: existingClients, error: checkError } = await supabase
        .from('clients')
        .select('id')
        .eq('name', newClientName.trim())
        .is('deleted_at', null);

      if (checkError) throw checkError;

      if (existingClients && existingClients.length > 0) {
        setError('Un client avec ce nom existe déjà');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data, error } = await supabase
        .from('clients')
        .insert([{ 
          name: newClientName.trim(),
          created_by: user.id 
        }])
        .select()
        .single();

      if (error) throw error;

      setShowNewClientForm(false);
      setNewClientName('');
      setSelectedClient(data.id);
      setSearchTerm(data.name);
      setError(null);
    } catch (err) {
      console.error('Error creating client:', err);
      setError('Erreur lors de la création du client');
    } finally {
      setLoading(false);
    }
  };

  const groupTransactionsByDate = (transactions: Transaction[]) => {
    const groups = new Map<string, Transaction[]>();
    
    transactions.forEach(transaction => {
      if (!groups.has(transaction.date)) {
        groups.set(transaction.date, []);
      }
      groups.get(transaction.date)!.push(transaction);
    });

    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Nouvel envoi</h1>

        {!showNewClientForm ? (
          <div className="relative z-50" ref={searchRef}>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-gray-100 rounded-xl">
                <Search className={`w-5 h-5 ml-4 ${searchLoading ? 'text-blue-500 animate-spin' : 'text-gray-500'}`} />
                <input
                  className="w-full py-3 px-4 pl-10 bg-transparent focus:outline-none text-base"
                  placeholder="Rechercher un client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setShowClientList(true)}
                />
              </div>
              <button
                onClick={handleReset}
                className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors duration-200"
                title="Réinitialiser la recherche"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-2 p-4 bg-red-50 text-red-600 rounded-lg">
                {error}
              </div>
            )}

            {searchTerm && clients.length === 0 && showClientList && (
              <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-600 mb-2">Aucun client trouvé</p>
                <button
                  onClick={() => {
                    setShowNewClientForm(true);
                    setNewClientName(searchTerm);
                    setShowClientList(false);
                  }}
                  className="inline-flex items-center text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Créer un nouveau client
                </button>
              </div>
            )}

            {clients.length > 0 && showClientList && (
              <div className="absolute w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 ${
                      selectedClient === client.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {editingClient === client.id ? (
                      <div className="flex-1 flex items-center space-x-2">
                        <input
                          type="text"
                          value={editClientName}
                          onChange={(e) => setEditClientName(e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateClientName(client.id)}
                          disabled={loading}
                          className="p-1 text-green-600 hover:text-green-700"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingClient(null);
                            setEditClientName('');
                            setError(null);
                          }}
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setSelectedClient(client.id);
                            setSearchTerm(client.name);
                            setShowClientList(false);
                          }}
                          className="flex-1 text-left"
                        >
                          {client.name}
                        </button>
                        <button
                          onClick={() => {
                            setEditingClient(client.id);
                            setEditClientName(client.name);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Nouveau client</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du client
                </label>
                <input
                  id="clientName"
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Entrez le nom du client"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowNewClientForm(false);
                    setNewClientName('');
                    setError(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-700"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateClient}
                  disabled={loading}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Création...' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedClient && (
          <div className="mt-8 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Nouvel envoi</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label htmlFor="amountSent" className="block text-sm font-medium text-gray-700 mb-1">
                      Montant envoyé
                    </label>
                    <div className="relative">
                      <input
                        id="amountSent"
                        type="number"
                        value={amountSent}
                        onChange={(e) => setAmountSent(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <label htmlFor="amountToPay" className="block text-sm font-medium text-gray-700 mb-1">
                      Montant à payer
                    </label>
                    <div className="relative">
                      <input
                        id="amountToPay"
                        type="number"
                        value={amountToPay}
                        onChange={(e) => setAmountToPay(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Informations de la transaction
                  </label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Nom de l'expéditeur"
                    />
                    <input
                      type="text"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Nom du receveur"
                    />
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Destination"
                    />
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Code"
                    />
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      rows={3}
                      placeholder="Note supplémentaire"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Envoi en cours...' : 'Envoyer'}
                  </button>
                </div>
              </div>
            </div>

            {transactions.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Historique des transactions</h3>
                <div className="space-y-4">
                  {groupTransactionsByDate(transactions).map(([date, transactions]) => (
                    <div key={date} className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-900">
                        {format(new Date(date), "EEEE d MMMM yyyy", { locale: fr })}
                      </h4>
                      {transactions.map((transaction) => (
                        <div 
                          key={transaction.id} 
                          className={`p-4 rounded-lg ${
                            transaction.amount_paid > transaction.amount_to_pay
                              ? 'bg-blue-50'
                              : transaction.amount_paid > 0
                                ? 'bg-green-50'
                                : 'bg-gray-50'
                          }`}
                        >
                          {editingTransaction?.id === transaction.id ? (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Montant envoyé
                                </label>
                                <input
                                  type="number"
                                  value={editingTransaction.amount_sent}
                                  onChange={(e) => setEditingTransaction({
                                    ...editingTransaction,
                                    amount_sent: e.target.value
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Montant à payer
                                </label>
                                <input
                                  type="number"
                                  value={editingTransaction.amount_to_pay}
                                  onChange={(e) => setEditingTransaction({
                                    ...editingTransaction,
                                    amount_to_pay: e.target.value
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Montant payé
                                </label>
                                <input
                                  type="number"
                                  value={editingTransaction.amount_paid}
                                  onChange={(e) => setEditingTransaction({
                                    ...editingTransaction,
                                    amount_paid: e.target.value
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Description
                                </label>
                                <textarea
                                  value={editingTransaction.description}
                                  onChange={(e) => setEditingTransaction({
                                    ...editingTransaction,
                                    description: e.target.value
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  rows={2}
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => handleUpdateTransaction()}
                                  disabled={loading}
                                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setEditingTransaction(null)}
                                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-start mb-2">
                              <div className="space-y-1">
                                {transaction.amount_sent > 0 && (
                                  <div className="text-sm text-gray-500">
                                    Montant envoyé: {transaction.amount_sent.toLocaleString()} FCFA
                                  </div>
                                )}
                                {transaction.amount_to_pay > 0 && (
                                  <div className="text-sm text-gray-500">
                                    Montant à payer: {transaction.amount_to_pay.toLocaleString()} FCFA
                                  </div>
                                )}
                                {transaction.amount_paid > 0 && (
                                  <div className="flex items-center text-sm text-green-600">
                                    <PaymentMethodIcon method={transaction.payment_method} />
                                    <span className="ml-1">
                                      Payé: {transaction.amount_paid.toLocaleString()} FCFA
                                    </span>
                                  </div>
                                )}
                                {transaction.description && (
                                  <div className="text-sm text-gray-600">{transaction.description}</div>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setEditingTransaction({
                                    id: transaction.id,
                                    amount_sent: transaction.amount_sent.toString(),
                                    amount_paid: transaction.amount_paid.toString(),
                                    amount_to_pay: transaction.amount_to_pay.toString(),
                                    description: transaction.description || ''
                                  })}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <div className="flex items-center text-sm text-gray-500">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {format(new Date(transaction.created_at), "HH:mm")}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
