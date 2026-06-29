// screens/PatrimonyListScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import PatrimonyCard from '../components/PatrimonyCard';
import { API_BASE_URL } from '../config';

export default function PatrimonyListScreen({ navigation }) {
  const [patrimonies, setPatrimonies] = useState([]);
  const [allPatrimonies, setAllPatrimonies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const { getAuthHeaders, logout } = useAuth(); // Adicionar logout

  useEffect(() => {
    fetchPatrimonies();
  }, []);

  const fetchPatrimonies = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/patrimony`, {
        headers,
      });

      if (response.status === 401) {
        Alert.alert('Sessão expirada', 'Por favor, faça login novamente');
        await logout();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        const mappedData = data.map(item => ({
          id: item.id,
          plate: item.plate,
          name: item.name,
          description: item.description,
          acquisitionDate: item.acquisition_date,
          value: item.value || 0,
          department: item.department,
          status: item.status,
          sector: item.sector,
          supplier: item.supplier,
          invoiceNumber: item.invoice_number,
          commitmentNumber: item.commitment_number,
          denfSeNumber: item.denf_se_number,
          invoiceFile: item.invoice_file,
          commitmentFile: item.commitment_file,
          denfSeFile: item.denf_se_file,
          imageUrl: item.image_url,
          nfIssueDate: item.nf_issue_date,
        }));
        
        setAllPatrimonies(mappedData);
        setPatrimonies(mappedData);
      } else {
        const errorText = await response.text();
        Alert.alert('Erro', `Não foi possível carregar os bens: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching patrimonies:', error);
      Alert.alert('Erro', 'Não foi possível carregar os bens. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  };
  const filteredPatrimonies = allPatrimonies.filter(item =>
    item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.plate?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.department?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.sector?.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleItemPress = (item) => {
    navigation.navigate('PatrimonyDetail', { item });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando bens...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome, placa, departamento ou setor..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#9ca3af"
        />
      </View>

      <ScrollView style={styles.listContainer}>
        {filteredPatrimonies.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchText ? 'Nenhum bem encontrado com os filtros' : 'Nenhum bem cadastrado'}
            </Text>
            {searchText && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => setSearchText('')}
              >
                <Text style={styles.clearButtonText}>Limpar busca</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {filteredPatrimonies.length} bem{filteredPatrimonies.length !== 1 ? 's' : ''} encontrado{filteredPatrimonies.length !== 1 ? 's' : ''}
              {searchText && ` para "${searchText}"`}
            </Text>
            {filteredPatrimonies.map(item => (
              <PatrimonyCard
                key={item.id}
                item={item}
                onPress={() => handleItemPress(item)}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Botão de recarregar */}
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={fetchPatrimonies}
        disabled={loading}
      >
        <Text style={styles.refreshButtonText}>
          {loading ? '🔄 Carregando...' : '🔄 Atualizar Lista'}
        </Text>
      </TouchableOpacity>

      {/* Botão de Novo Bem (flutuante) */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('NewPatrimony')}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 16,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchInput: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    fontSize: 16,
    color: '#374151',
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 200,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  clearButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#059669',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#059669',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  fabIcon: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});