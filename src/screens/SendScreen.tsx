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
import { Search, Plus } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

interface Client {
  id: string;
  name: string;
}

export default function SendScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [amountSent, setAmountSent] = useState('');
  const [amountToPay, setAmountToPay] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

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

  async function handleCreateClient() {
    if (!newClientName.trim()) {
      Alert.alert('Erreur', 'Le nom du client est requis');
      return;
    }

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Non connecté');

      const { data, error } = await supabase
        .from('clients')
        .insert([{
          name: newClientName.trim(),
          created_by: user.user.id
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchClients();
      setSelectedClient(data.id);
      setShowNewClientForm(false);
      setNewClientName('');
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de créer le client');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitTransaction() {
    if (!selectedClient || !amountSent || !amountToPay) {
      Alert.alert('Erreur', 'Tous les champs sont requis');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .insert([{
          client_id: selectedClient,
          amount_sent: parseFloat(amountSent),
          amount_paid: 0,
          amount_to_pay: parseFloat(amountToPay),
          description: description.trim() || null
        }]);

      if (error) throw error;

      setAmountSent('');
      setAmountToPay('');
      setDescription('');
      Alert.alert('Succès', 'Transaction enregistrée');
    } catch (err) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer la transaction');
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
        <Text style={styles.title}>Nouvel envoi</Text>

        {!showNewClientForm ? (
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <Search size={20} color="#6b7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un client..."
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>

            <TouchableOpacity
              style={styles.newClientButton}
              onPress={() => setShowNewClientForm(true)}
            >
              <Plus size={20} color="#0284c7" />
              <Text style={styles.newClientButtonText}>Nouveau</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nom du nouveau client</Text>
            <TextInput
              style={styles.input}
              value={newClientName}
              onChangeText={setNewClientName}
              placeholder="Entrez le nom du client"
            />
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowNewClientForm(false);
                  setNewClientName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleCreateClient}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Création...' : 'Créer le client'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!showNewClientForm && (
          <>
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

            {selectedClient && (
              <View style={styles.transactionForm}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Montant envoyé</Text>
                  <TextInput
                    style={styles.input}
                    value={amountSent}
                    onChangeText={setAmountSent}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Montant à payer</Text>
                  <TextInput
                    style={styles.input}
                    value={amountToPay}
                    onChangeText={setAmountToPay}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Description (optionnel)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={3}
                    placeholder="Ajoutez une note..."
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.buttonDisabled]}
                  onPress={handleSubmitTransaction}
                  disabled={loading}
                >
                  <Text style={styles.submitButtonText}>
                    {loading ? 'Enregistrement...' : 'Enregistrer la transaction'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
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
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  newClientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
  newClientButtonText: {
    marginLeft: 4,
    color: '#0284c7',
    fontWeight: '600',
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
  transactionForm: {
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 12,
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#4b5563',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
