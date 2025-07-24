import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { RefreshCw, ChevronDown, ChevronUp, Clock, Search, Calendar as CalendarIcon, Download, Wallet, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Calendar from './Calendar';
import DateRangeDialog from './DateRangeDialog';
import PasswordDialog from './PasswordDialog';
import { exportTransactionsToPDF } from '../utils/pdfExport';
import { motion, AnimatePresence } from 'framer-motion';
import type { Transaction, ClientSummary } from '../types';

interface DateStatus {
  hasDebt: boolean;
  hasAdvance: boolean;
}

export default function TransactionHistory() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSummaries, setClientSummaries] = useState<ClientSummary[]>([]);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [searchDate, setSearchDate] = useState<string>(() => {
    return localStorage.getItem('selectedDate') || format(new Date(), 'yyyy-MM-dd');
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSummaries, setFilteredSummaries] = useState<ClientSummary[]>([]);
  const [dateStatuses, setDateStatuses] = useState<Map<string, DateStatus>>(new Map());
  const [showDateRangeDialog, setShowDateRangeDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date; end: Date } | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [searchDate]);

  useEffect(() => {
    filterSummaries();
  }, [searchDate, searchTerm, clientSummaries]);

  useEffect(() => {
    localStorage.setItem('selectedDate', searchDate);
  }, [searchDate]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select(`
          id,
          date,
          created_at,
          amount_sent,
          amount_paid,
          amount_to_pay,
          description,
          payment_method,
          receiver_name,
          clients (
            id,
            name
          )
        `)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      const validTransactions = (data || []).filter(t => 
        t && t.clients && t.clients.name
      ) as Transaction[];

      const summaries = calculateClientSummaries(validTransactions);
      setClientSummaries(summaries);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Erreur lors du chargement des transactions');
    } finally {
      setLoading(false);
    }
  };

  const calculateClientSummaries = (transactions: Transaction[]): ClientSummary[] => {
    const summariesMap = new Map<string, ClientSummary>();

    transactions.forEach(transaction => {
      const clientId = transaction.clients.id;

      if (!summariesMap.has(clientId)) {
        summariesMap.set(clientId, {
          id: clientId,
          name: transaction.clients.name,
          todaySent: 0,
          todayPaid: 0,
          previousDebt: 0,
          totalDebt: 0,
          transactions: []
        });
      }

      const summary = summariesMap.get(clientId)!;
      summary.transactions.push(transaction);

      if (transaction.date === searchDate) {
        summary.todaySent += transaction.amount_to_pay || 0;
        summary.todayPaid += transaction.amount_paid || 0;
      } else if (transaction.date < searchDate) {
        summary.previousDebt += (transaction.amount_to_pay || 0) - (transaction.amount_paid || 0);
      }

      summary.totalDebt = summary.previousDebt + (summary.todaySent - summary.todayPaid);
      summariesMap.set(clientId, summary);
    });

    return Array.from(summariesMap.values());
  };

  const filterSummaries = () => {
    let filtered = [...clientSummaries];

    if (searchTerm) {
      filtered = filtered.filter(summary =>
        summary.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSummaries(filtered);
  };

  const handleRefresh = () => {
    setSearchDate(format(new Date(), 'yyyy-MM-dd'));
    setSearchTerm('');
    setExpandedClient(null);
    fetchTransactions();
  };

  const handleDateRangeSelect = (range: { start: Date; end: Date }) => {
    setSelectedDateRange(range);
    setShowDateRangeDialog(false);
    setShowPasswordDialog(true);
  };

  const handlePasswordSubmit = async (password: string) => {
    try {
      setError(null);
      setPasswordError(null);

      // Verify password
      const { data, error: verifyError } = await supabase
        .rpc('verify_export_password', {
          password_to_verify: password
        });

      if (verifyError) throw verifyError;
      if (!data) {
        setPasswordError('Mot de passe incorrect');
        return;
      }

      // If password is correct and we have a date range, proceed with export
      if (selectedDateRange) {
        const result = await exportTransactionsToPDF(
          clientSummaries.flatMap(s => s.transactions),
          selectedDateRange
        );
        
        if (!result.success) {
          setError(result.message);
        }
      }

      setShowPasswordDialog(false);
      setSelectedDateRange(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'export');
    }
  };

  const hasTransactionsForDate = (date: string) => {
    return clientSummaries.some(summary => 
      summary.transactions.some(t => t.date === date)
    );
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

  if (loading && !clientSummaries.length) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
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

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
          <h3 className="text-xl font-semibold text-gray-900">
            Récapitulatif des transactions
          </h3>
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="w-full md:w-48">
              <Calendar
                value={searchDate}
                onChange={setSearchDate}
                dateStatuses={dateStatuses}
                className="w-full"
              />
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              title="Rafraîchir"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                if (!hasTransactionsForDate(searchDate)) {
                  setError('Aucune transaction disponible pour cette date');
                  return;
                }
                setShowDateRangeDialog(true);
              }}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              title="Exporter"
            >
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un client..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out sm:text-sm"
            />
          </div>
        </div>

        <div className="mb-6 bg-blue-50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold text-blue-900 mb-2">Totaux</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-blue-700">Total des dettes</p>
              <p className="text-xl md:text-2xl font-bold text-red-600">
                {filteredSummaries
                  .reduce((sum, s) => sum + (s.totalDebt > 0 ? s.totalDebt : 0), 0)
                  .toLocaleString()} FCFA
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm text-blue-700">Total des avances</p>
              <p className="text-xl md:text-2xl font-bold text-green-600">
                {Math.abs(
                  filteredSummaries
                    .reduce((sum, s) => sum + (s.totalDebt < 0 ? s.totalDebt : 0), 0)
                ).toLocaleString()} FCFA
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredSummaries.map(summary => (
            <div key={summary.id} className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
              <div className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 mb-4">{summary.name}</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="text-sm bg-white p-3 rounded-lg">
                        <span className="text-gray-600 block mb-1">Total envoyé du jour:</span>
                        <span className="font-medium">{summary.todaySent.toLocaleString()} FCFA</span>
                      </div>
                      <div className="text-sm bg-white p-3 rounded-lg">
                        <span className="text-gray-600 block mb-1">Total payé du jour:</span>
                        <span className="font-medium text-green-600">{summary.todayPaid.toLocaleString()} FCFA</span>
                      </div>
                      <div className="text-sm bg-white p-3 rounded-lg">
                        <span className="text-gray-600 block mb-1">Dette précédente:</span>
                        <span className="font-medium text-red-600">{summary.previousDebt.toLocaleString()} FCFA</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start md:ml-4">
                    <button
                      onClick={() => setExpandedClient(expandedClient === summary.id ? null : summary.id)}
                      className="p-2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                    >
                      {expandedClient === summary.id ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                    <div className="md:mt-4">
                      <p className="text-lg font-bold text-red-600">
                        Dette totale: {summary.totalDebt.toLocaleString()} FCFA
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {expandedClient === summary.id && (
                <div className="border-t border-gray-200">
                  <div className="divide-y divide-gray-200">
                    {groupTransactionsByDate(summary.transactions).map(([date, transactions]) => (
                      <div key={date} className="p-4">
                        <h6 className="text-sm font-medium text-gray-900 mb-3">
                          {format(new Date(date), "EEEE d MMMM yyyy", { locale: fr })}
                        </h6>
                        <div className="space-y-3">
                          {transactions.map((transaction) => (
                            <div 
                              key={transaction.id} 
                              className={`${
                                transaction.amount_paid > transaction.amount_to_pay
                                  ? 'bg-blue-50 hover:bg-blue-100'
                                  : transaction.amount_paid > 0
                                    ? 'bg-green-50 hover:bg-green-100'
                                    : 'bg-gray-100 hover:bg-gray-200'
                              } p-3 rounded-lg shadow-sm transition-all duration-200`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-2 sm:space-y-0">
                                <div>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {format(new Date(transaction.created_at), "HH:mm")}
                                  </div>
                                  <div className="mt-1 space-y-1">
                                    <p className="text-sm">
                                      Montant à payer: <span className="font-medium">{transaction.amount_to_pay.toLocaleString()} FCFA</span>
                                    </p>
                                    {transaction.amount_paid > 0 && (
                                      <div className="flex items-center text-sm text-green-600">
                                        {transaction.payment_method === 'AIRTEL_MONEY' ? (
                                          <Phone className="h-4 w-4 mr-1" />
                                        ) : (
                                          <Wallet className="h-4 w-4 mr-1" />
                                        )}
                                        <span className="font-medium">{transaction.amount_paid.toLocaleString()} FCFA</span>
                                      </div>
                                    )}
                                    {transaction.amount_sent > 0 && (
                                      <p className="text-sm">
                                        Envoyé: <span className="font-medium">{transaction.amount_sent.toLocaleString()} FCFA</span>
                                      </p>
                                    )}
                                  </div>
                                  {transaction.description && (
                                    <p className="mt-2 text-sm text-gray-500">
                                      {transaction.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredSummaries.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune transaction trouvée</h3>
              <p className="mt-1 text-sm text-gray-500">
                Modifiez vos critères de recherche pour voir plus de résultats.
              </p>
            </div>
          )}
        </div>
      </div>

      <DateRangeDialog
        isOpen={showDateRangeDialog}
        onClose={() => setShowDateRangeDialog(false)}
        onConfirm={handleDateRangeSelect}
        initialStartDate={new Date(searchDate)}
        initialEndDate={new Date(searchDate)}
      />

      <PasswordDialog
        isOpen={showPasswordDialog}
        onClose={() => {
          setShowPasswordDialog(false);
          setSelectedDateRange(null);
          setPasswordError(null);
        }}
        onConfirm={handlePasswordSubmit}
        error={passwordError}
      />
    </div>
  );
}
