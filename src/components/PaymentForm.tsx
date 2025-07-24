import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Wallet, Phone, RefreshCw } from 'lucide-react';

interface Client {
  id: string;
  name: string;
}

interface ClientDebtSummary {
  today_sent: number;
  today_paid: number;
  previous_debt: number;
  total_debt: number;
}

type PaymentMethod = 'ESPECE' | 'AIRTEL_MONEY';

export default function PaymentForm() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debtSummary, setDebtSummary] = useState<ClientDebtSummary | null>(null);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ESPECE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiverName, setReceiverName] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchClientDebtSummary();
    } else {
      setDebtSummary(null);
    }
  }, [selectedClient]);

  async function fetchClients() {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Impossible de charger les clients');
    }
  }

  const handleReset = () => {
    setSearchTerm('');
    setSelectedClient(null);
    setDebtSummary(null);
    setAmountPaid('');
  };

  const fetchClientDebtSummary = async () => {
    if (!selectedClient) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Récupérer toutes les transactions du client
      const { data: allTransactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('client_id', selectedClient)
        .order('date', { ascending: true });

      if (transactionsError) throw transactionsError;

      // Calculer les totaux
      let previousDebt = 0;
      let todaySent = 0;
      let todayPaid = 0;

      // Calculer la dette précédente (transactions avant aujourd'hui)
      allTransactions?.forEach(transaction => {
        if (transaction.date < today) {
          previousDebt += transaction.amount_to_pay - transaction.amount_paid;
        } else if (transaction.date === today) {
          todaySent += transaction.amount_to_pay;
          todayPaid += transaction.amount_paid;
        }
      });

      // La dette totale est la somme de la dette précédente plus les transactions d'aujourd'hui
      const totalDebt = previousDebt + (todaySent - todayPaid);

      setDebtSummary({
        today_sent: todaySent,
        today_paid: todayPaid,
        previous_debt: previousDebt,
        total_debt: totalDebt
      });

    } catch (err) {
      console.error('Error fetching client debt summary:', err);
      setError('Impossible de charger le résumé du client');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClient || !amountPaid) {
      setError('Veuillez sélectionner un client et entrer un montant');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          client_id: selectedClient,
          amount_sent: 0,
          amount_paid: parseFloat(amountPaid),
          amount_to_pay: 0,
          payment_method: paymentMethod,
          receiver_name: paymentMethod === 'AIRTEL_MONEY' ? receiverName : null
        }]);

      if (transactionError) throw transactionError;

      setAmountPaid('');
      setReceiverName('');
      await fetchClientDebtSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 md:mb-6">
          Nouveau paiement
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Rechercher un client
            </label>
            <div className="mt-1 flex gap-2">
              <div className="flex-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 sm:text-sm border border-gray-300 rounded-md"
                  placeholder="Nom du client"
                />
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                title="Réinitialiser la recherche"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="client" className="block text-sm font-medium text-gray-700">
              Sélectionner un client
            </label>
            <div className="mt-1 max-h-40 overflow-y-auto border border-gray-300 rounded-md divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => setSelectedClient(client.id)}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
                    selectedClient === client.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                  }`}
                >
                  {client.name}
                </button>
              ))}
              {filteredClients.length === 0 && (
                <div className="px-4 py-2 text-sm text-gray-500">
                  Aucun client trouvé
                </div>
              )}
            </div>
          </div>

          {debtSummary && (
            <div className="bg-gray-50 p-4 rounded-md space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Récapitulatif du client</h4>
              
              <div className="border-b border-gray-200 pb-4">
                <dt className="text-sm font-medium text-gray-500 mb-2">Aujourd'hui</dt>
                <dd className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-md">
                    <p className="text-sm text-gray-500">Total envoyé</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {debtSummary.today_sent.toLocaleString()} FCFA
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-md">
                    <p className="text-sm text-gray-500">Total payé</p>
                    <p className="text-lg font-semibold text-green-600">
                      {debtSummary.today_paid.toLocaleString()} FCFA
                    </p>
                  </div>
                </dd>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <dt className="text-sm font-medium text-gray-500 mb-2">Dette précédente</dt>
                <dd className="bg-white p-3 rounded-md">
                  <p className="text-lg font-semibold text-gray-900">
                    {debtSummary.previous_debt.toLocaleString()} FCFA
                  </p>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500 mb-2">Dette totale</dt>
                <dd className="bg-white p-3 rounded-md">
                  <p className="text-xl font-bold text-red-600">
                    {debtSummary.total_debt.toLocaleString()} FCFA
                  </p>
                </dd>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mode de paiement
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ESPECE')}
                    className={`flex items-center justify-center px-4 py-3 border rounded-lg text-sm font-medium transition-colors duration-200 ${
                      paymentMethod === 'ESPECE'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Wallet className={`h-5 w-5 mr-2 ${
                      paymentMethod === 'ESPECE' ? 'text-green-500' : 'text-gray-400'
                    }`} />
                    Espèces
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('AIRTEL_MONEY')}
                    className={`flex items-center justify-center px-4 py-3 border rounded-lg text-sm font-medium transition-colors duration-200 ${
                      paymentMethod === 'AIRTEL_MONEY'
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Phone className={`h-5 w-5 mr-2 ${
                      paymentMethod === 'AIRTEL_MONEY' ? 'text-blue-500' : 'text-gray-400'
                    }`} />
                    Airtel Money
                  </button>
                </div>
              </div>

              {paymentMethod === 'AIRTEL_MONEY' && (
                <div>
                  <label htmlFor="receiverName" className="block text-sm font-medium text-gray-700">
                    Nom du bénéficiaire (pour Airtel Money)
                  </label>
                  <input
                    type="text"
                    id="receiverName"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Nom du bénéficiaire"
                  />
                </div>
              )}

              <div>
                <label htmlFor="amountPaid" className="block text-sm font-medium text-gray-700">
                  Montant payé
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    id="amountPaid"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="0"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || !selectedClient}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer le paiement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
