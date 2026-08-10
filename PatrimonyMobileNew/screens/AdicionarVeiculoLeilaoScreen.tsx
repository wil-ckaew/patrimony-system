import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
  TextInput,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getAuthHeaders } from '../utils/auth';
import { API_URL } from '../config';

interface AvailableVehicle {
  id: string;
  plate: string;
  name: string;
  description: string;
  department: string;
  sector: string;
  status: string;
  value: string;
}

const AdicionarVeiculoLeilaoScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { auctionId } = route.params as { auctionId: string };
  
  const [vehicles, setVehicles] = useState<AvailableVehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<AvailableVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim();
      const filtered = vehicles.filter(v => 
        v.plate.toLowerCase().includes(searchLower) ||
        v.name.toLowerCase().includes(searchLower) ||
        v.department.toLowerCase().includes(searchLower) ||
        (v.sector && v.sector.toLowerCase().includes(searchLower))
      );
      setFilteredVehicles(filtered);
    } else {
      setFilteredVehicles(vehicles);
    }
  }, [search, vehicles]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/auctions/vehicles/available`, { headers });

      if (!response.ok) {
        throw new Error('Erro ao carregar veículos');
      }

      const data = await response.json();
      setVehicles(data);
      setFilteredVehicles(data);
    } catch (err) {
      Alert.alert('Erro', 'Erro ao carregar veículos disponíveis');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchVehicles();
  };

  const handleAddVehicle = async () => {
    if (!selectedVehicle) {
      Alert.alert('Aviso', 'Selecione um veículo');
      return;
    }

    setAdding(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/api/auctions/${auctionId}/vehicles`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle_id: selectedVehicle }),
      });

      if (response.ok) {
        Alert.alert('Sucesso', 'Veículo adicionado ao leilão!');
        navigation.goBack();
      } else {
        const errorText = await response.text();
        Alert.alert('Erro', errorText || 'Erro ao adicionar veículo');
      }
    } catch (err) {
      Alert.alert('Erro', 'Erro de conexão');
    } finally {
      setAdding(false);
    }
  };

  const formatCurrency = (value: string) => {
    if (!value || value === '0' || value === '0.00') return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  const renderVehicle = ({ item }: { item: AvailableVehicle }) => (
    <TouchableOpacity
      style={[
        styles.vehicleCard,
        selectedVehicle === item.id && styles.vehicleCardSelected,
      ]}
      onPress={() => setSelectedVehicle(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.vehicleHeader}>
        <Text style={styles.vehiclePlate}>{item.plate || 'Sem placa'}</Text>
        <View style={[styles.vehicleStatus, { backgroundColor: item.status === 'active' ? '#10b981' : '#6b7280' }]}>
          <Text style={styles.vehicleStatusText}>
            {item.status === 'active' ? 'Ativo' : 'Inativo'}
          </Text>
        </View>
      </View>
      <Text style={styles.vehicleName}>{item.name || 'Sem nome'}</Text>
      {item.description && (
        <Text style={styles.vehicleDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
      <View style={styles.vehicleMeta}>
        <Text style={styles.vehicleMetaText}>🏢 {item.department || '-'}</Text>
        {item.sector && <Text style={styles.vehicleMetaText}>📍 {item.sector}</Text>}
        <Text style={styles.vehicleMetaText}>💰 {formatCurrency(item.value)}</Text>
      </View>
      {selectedVehicle === item.id && (
        <View style={styles.selectedIndicator}>
          <Text style={styles.selectedIndicatorText}>✅ Selecionado</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Carregando veículos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Adicionar Veículo</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="🔍 Buscar por placa, nome, departamento..."
          placeholderTextColor="#9ca3af"
        />
      </View>

      {filteredVehicles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>🚗 Nenhum veículo disponível</Text>
          {search ? (
            <Text style={styles.emptySubText}>Tente ajustar a busca</Text>
          ) : (
            <Text style={styles.emptySubText}>Cadastre um patrimônio como veículo primeiro</Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredVehicles}
          renderItem={renderVehicle}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.addButton, (!selectedVehicle || adding) && styles.addButtonDisabled]}
          onPress={handleAddVehicle}
          disabled={!selectedVehicle || adding}
        >
          <Text style={styles.addButtonText}>
            {adding ? '⏳ Adicionando...' : '➕ Adicionar ao Leilão'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 22,
    color: '#ffffff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1f2937',
  },
  listContent: {
    padding: 16,
  },
  vehicleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  vehicleCardSelected: {
    borderColor: '#1e3a8a',
    backgroundColor: '#eff6ff',
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  vehiclePlate: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  vehicleStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  vehicleStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  vehicleDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  vehicleMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  vehicleMetaText: {
    fontSize: 11,
    color: '#6b7280',
  },
  selectedIndicator: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  selectedIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e3a8a',
  },
  footer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  addButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 14,
    color: '#9ca3af',
  },
});

export default AdicionarVeiculoLeilaoScreen;
