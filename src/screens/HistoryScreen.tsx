import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native-web';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { calculateClientSummaries } from '../components/TransactionHistory';

interface Transaction {
  id: string;
  date: string;
  created_at: string;
  amount_sent: number;
  amount_paid: number;
  amount_to_pay: number;
  description: string | null;
  clients: {
    name: string;
    id: string;
  };
}

interface ClientSummary {
  id: string;
  name: string;
  todaySent: number;
  todayPaid: number;
  previousDebt: number;
  totalDebt: number;
  transactions: Transaction[];
}

export default function HistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [clientSummaries, setClientSummaries] = useState<ClientSummary[]>([]);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          date,
          created_at,
          amount_sent,
          amount_paid,
          amount_to_pay,
          description,
          clients (
            id,
            name
          )
        `)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const validTransactions = (data || []).filter(t => 
        t && t.clients && t.clients.name
      );

      const summaries = calculateClientSummaries(validTransactions);
      setClientSummaries(summaries);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de charger l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "d MMMM yyyy 'à' HH:mm", { locale: fr });
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Historique des transactions</Text>

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Totaux</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total des dettes</Text>
              <Text style={[styles.summaryValue, styles.redText]}>
                {clientSummaries
                  .filter(s => s.totalDebt > 0)
                  .reduce((sum, s) => sum + s.totalDebt, 0)
                  .toLocaleString()} FCFA
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total des avances</Text>
              <Text style={[styles.summaryValue, styles.greenText]}>
                {Math.abs(
                  clientSummaries
                    .filter(s => s.totalDebt < 0)
                    .reduce((sum, s) => sum + s.totalDebt, 0)
                ).toLocaleString()} FCFA
              </Text>
            </View>
          </View>
        </View>

        {clientSummaries.map(summary => (
          <View key={summary.id} style={styles.clientCard}>
            <TouchableOpacity
              style={styles.clientHeader}
              onPress={() => setExpandedClient(
                expandedClient === summary.id ? null : summary.id
              )}
            >
              <View>
                <Text style={styles.clientName}>{summary.name}</Text>
                <View style={styles.clientSummary}>
                  <Text style={styles.summaryText}>
                    Envoyé: {summary.todaySent.toLocaleString()} FCFA
                  </Text>
                  <Text style={[styles.summaryText, styles.greenText]}>
                    Payé: {summary.todayPaid.toLocaleString()} FCFA
                  </Text>
                </View>
              </View>
              {expandedClient === summary.id ? (
                <ChevronUp size={24} color="#6b7280" />
              ) : (
                <ChevronDown size={24} color="#6b7280" />
              )}
            </TouchableOpacity>

            {expandedClient === summary.id && (
              <View style={styles.transactionList}>
                {groupTransactionsByDate(summary.transactions).map(([date, transactions]) => (
                  <View key={date} style={styles.dateGroup}>
                    <Text style={styles.dateHeader}>
                      {format(new Date(date), "EEEE d MMMM yyyy", { locale: fr })}
                    </Text>
                    {transactions.map((transaction) => (
                      <View 
                        key={transaction.id} 
                        style={[
                          styles.transactionItem,
                          transaction.amount_paid > transaction.amount_to_pay
                            ? styles.advanceTransaction
                            : transaction.amount_paid > 0
                              ? styles.paidTransaction
                              : styles.unpaidTransaction
                        ]}
                      >
                        <View style={styles.transactionHeader}>
                          <View style={styles.timeContainer}>
                            <Clock size={16} color="#6b7280" />
                            <Text style={styles.timeText}>
                              {format(new Date(transaction.created_at), "HH:mm")}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.transactionDetails}>
                          <Text style={styles.transactionText}>
                            Montant à payer: {transaction.amount_to_pay.toLocaleString()} FCFA
                          </Text>
                          {transaction.amount_paid > 0 && (
                            <Text style={[styles.transactionText, styles.greenText]}>
                              Payé: {transaction.amount_paid.toLocaleString()} FCFA
                            </Text>
                          )}
                          {transaction.amount_sent > 0 && (
                            <Text style={styles.transactionText}>
                              Envoyé: {transaction.amount_sent.toLocaleString()} FCFA
                            </Text>
                          )}
                        </View>
                        
                        {transaction.description && (
                          <Text style={styles.description}>
                            {transaction.description}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  summaryContainer: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  clientCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  clientSummary: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#4b5563',
  },
  transactionList: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  dateGroup: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
  },
  transactionItem: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  advanceTransaction: {
    backgroundColor: '#e0f2fe',
  },
  paidTransaction: {
    backgroundColor: '#f0fdf4',
  },
  unpaidTransaction: {
    backgroundColor: '#ffffff',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6b7280',
  },
  transactionDetails: {
    marginBottom: 8,
  },
  transactionText: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: '#6b7280',
  },
  greenText: {
    color: '#059669',
  },
  redText: {
    color: '#dc2626',
  },
});
