import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Search } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

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

export default function PaymentScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debtSummary, setDebtSummary] = useState<ClientDebtSummary | null>(null);
  const [amountPaid, setAmountPaid] = useState('');
  const [loading, setLoading] = useState(false);

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
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de charger les clients');
    }
  }

  async function fetchClientDebtSummary() {
    if (!selectedClient) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: todayData, error: todayError } = await supabase
        .from('transactions')
        .select('amount_to_pay, amount_paid')
        .eq('client_id', selectedClient)
        .eq('date', today);

      if (todayError) throw todayError;

      const { data: previousData, error: previousError } = await supabase
        .from('transactions')
        .select('amount_to_pay, amount_paid')
        .eq('client_id', selectedClient)
        .lt('date', today);

      if (previousError) throw previousError;

      const todayTotals = (todayData || []).reduce(
        (acc, curr) => ({
          sent: acc.sent + (curr.amount_to_pay || 0),
          paid: acc.paid + (curr.amount_paid || 0),
        }),
        { sent: 0, paid: 0 }
      );

      const previousTotals = (previousData || []).reduce(
        (acc, curr) => ({
          sent: acc.sent + (curr.amount_to_pay || 0),
          paid: acc.paid + (curr.amount_paid || 0),
        }),
        { sent: 0, paid: 0 }
      );

      const previousDebt = previousTotals.sent - previousTotals.paid;
      const totalDebt = (todayTotals.sent - todayTotals.paid) + previousDebt;

      setDebtSummary({
        today_sent: todayTotals.sent,
        today_paid: todayTotals.paid,
        previous_debt: previousDebt,
        total_debt: totalDebt
      });
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de charger le résumé du client');
    }
  }

  async function handleSubmit() {
    if (!selectedClient || !amountPaid) {
      Alert.alert('Erreur', 'Veuillez sélectionner un client et entrer un montant');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .insert([{
          client_id: selectedClient,
          amount_sent: 0,
          amount_paid: parseFloat(amountPaid),
          amount_to_pay: 0
        }]);

      if (error) throw error;

      setAmountPaid('');
      await fetchClientDebtSummary();
      Alert.alert('Succès', 'Paiement enregistré');
    } catch (err) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer le paiement');
    } finally {
      setLoading(false);
    }
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Nouveau paiement</Text>

        <View style={styles.searchContainer}>
          <Search size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        <View style={styles.clientList}>
          {filteredClients.map((client) => (
            <TouchableOpacity
              key={client.id}
              style={[
                styles.clientItem,
                selectedClient === client.id && styles.selectedClient
              ]}
              onPress={() => setSelectedClient(client.id)}
            >
              <Text style={[
                styles.clientName,
                selectedClient === client.id && styles.selectedClientText
              ]}>
                {client.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {debtSummary && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Récapitulatif du client</Text>
            
            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Aujourd'hui</Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total envoyé</Text>
                  <Text style={styles.summaryValue}>
                    {debtSummary.today_sent.toLocaleString()} FCFA
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total payé</Text>
                  <Text style={[styles.summaryValue, styles.greenText]}>
                    {debtSummary.today_paid.toLocaleString()} FCFA
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Dette précédente</Text>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {debtSummary.previous_debt.toLocaleString()} FCFA
                </Text>
              </View>
            </View>

            <View style={styles.summarySection}>
              <Text style={styles.sectionTitle}>Dette totale</Text>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, styles.redText]}>
                  {debtSummary.total_debt.toLocaleString()} FCFA
                </Text>
              </View>
            </View>
          </View>
        )}

        {selectedClient && (
          <View style={styles.paymentForm}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Montant payé</Text>
              <TextInput
                style={styles.input}
                value={amountPaid}
                onChangeText={setAmountPaid}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Enregistrement...' : 'Enregistrer le paiement'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  clientList: {
    marginBottom: 20,
  },
  clientItem: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedClient: {
    backgroundColor: '#0284c7',
  },
  clientName: {
    fontSize: 16,
    color: '#1f2937',
  },
  selectedClientText: {
    color: '#ffffff',
  },
  summaryContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  summarySection: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  greenText: {
    color: '#059669',
  },
  redText: {
    color: '#dc2626',
  },
  paymentForm: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
