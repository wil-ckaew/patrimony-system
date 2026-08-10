import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { getAuthHeaders } from '../utils/auth';
import { API_URL } from '../config';

interface VehiclePhoto {
  id: string;
  type: string;
  path: string;
}

interface AuctionVehicle {
  id: string;
  vehicle_id: string;
  plate: string;
  name: string;
  department: string;
  sector: string;
  sold_value: number | null;
  buyer_name: string | null;
  buyer_document: string | null;
  detran_status: string | null;
  protocol_number: string | null;
  sale_date: string | null;
  chassi_photo_path: string | null;
  plate_photo_path: string | null;
  front_photo_path: string | null;
  rear_photo_path: string | null;
  engine_photo_path: string | null;
  document_path: string | null;
}

interface Auction {
  id: string;
  auction_number: string;
  edital_number: string | null;
  auction_date: string | null;
  auctioneer: string | null;
  company: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  vehicles?: AuctionVehicle[];
}

const LeilaoDetalhesScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params as { id: string };
  
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [expandedVehicles, setExpandedVehicles] = useState<Set<string>>(new Set());

  const fetchAuctionDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const headers = getAuthHeaders();
      const response = await fetch(`${API_URL}/api/auctions/${id}`, { headers });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Leilão não encontrado');
        }
        throw new Error(`Erro ${response.status}`);
      }

      const data = await response.json();

      const vehiclesResponse = await fetch(
        `${API_URL}/api/auctions/${id}/vehicles`,
        { headers }
      );

      if (vehiclesResponse.ok) {
        const vehicles = await vehiclesResponse.json();
        data.vehicles = vehicles;
      } else {
        data.vehicles = [];
      }

      setAuction(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar leilão');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAuctionDetails();
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchAuctionDetails();
    }, [id])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAuctionDetails();
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'EM_PREPARACAO': 'Em Preparação',
      'PUBLICADO': 'Publicado',
      'REALIZADO': 'Realizado',
      'FINALIZADO': 'Finalizado',
      'BAIXA_CONCLUIDA': 'Baixa Concluída'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'EM_PREPARACAO': '#f59e0b',
      'PUBLICADO': '#3b82f6',
      'REALIZADO': '#8b5cf6',
      'FINALIZADO': '#10b981',
      'BAIXA_CONCLUIDA': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getDetranStatusLabel = (status: string | null) => {
    if (!status) return '-';
    const labels: Record<string, string> = {
      'PENDENTE': 'Pendente',
      'EM_ANDAMENTO': 'Em Andamento',
      'CONCLUIDO': 'Concluído',
      'CANCELADO': 'Cancelado'
    };
    return labels[status] || status;
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const toggleVehiclePhotos = (vehicleId: string) => {
    setExpandedVehicles((prev) => {
      const next = new Set(prev);
      if (next.has(vehicleId)) {
        next.delete(vehicleId);
      } else {
        next.add(vehicleId);
      }
      return next;
    });
  };

  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const handleImagePress = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageModalVisible(true);
  };

  const renderVehicleItem = ({ item }: { item: AuctionVehicle }) => {
    const isExpanded = expandedVehicles.has(item.id);
    const hasPhotos = item.chassi_photo_path || 
                     item.plate_photo_path || 
                     item.front_photo_path || 
                     item.rear_photo_path || 
                     item.engine_photo_path;

    const photos = [
      { key: 'chassi', path: item.chassi_photo_path, label: 'Chassi' },
      { key: 'plate', path: item.plate_photo_path, label: 'Placa' },
      { key: 'front', path: item.front_photo_path, label: 'Frontal' },
      { key: 'rear', path: item.rear_photo_path, label: 'Traseira' },
      { key: 'engine', path: item.engine_photo_path, label: 'Motor' },
      { key: 'document', path: item.document_path, label: 'Documento' },
    ].filter(p => p.path);

    return (
      <View style={styles.vehicleCard}>
        <View style={styles.vehicleHeader}>
          <View style={styles.vehicleHeaderLeft}>
            <Text style={styles.vehiclePlate}>{item.plate || '-'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: item.detran_status === 'CONCLUIDO' ? '#10b981' : '#6b7280' }]}>
              <Text style={styles.statusText}>{getDetranStatusLabel(item.detran_status)}</Text>
            </View>
          </View>
          <Text style={styles.vehicleValue}>{formatCurrency(item.sold_value)}</Text>
        </View>

        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName}>{item.name || '-'}</Text>
          <Text style={styles.vehicleDetail}>🏢 {item.department || '-'}</Text>
          {item.sector && <Text style={styles.vehicleDetail}>📍 {item.sector}</Text>}
          {item.buyer_name && <Text style={styles.vehicleDetail}>👤 {item.buyer_name}</Text>}
        </View>

        <View style={styles.vehicleActions}>
          {hasPhotos && (
            <TouchableOpacity
              style={[styles.actionButton, styles.photoButton]}
              onPress={() => toggleVehiclePhotos(item.id)}
            >
              <Text style={styles.actionButtonText}>
                {isExpanded ? '📷 Ocultar Fotos' : '📷 Ver Fotos'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.docButton]}
            onPress={() => Alert.alert('📄 Documentos', 'Funcionalidade em desenvolvimento')}
          >
            <Text style={styles.actionButtonText}>📄 Docs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.baixaButton]}
            onPress={() => Alert.alert('📋 Baixa', 'Funcionalidade em desenvolvimento')}
          >
            <Text style={styles.actionButtonText}>📋 Baixa</Text>
          </TouchableOpacity>
        </View>

        {isExpanded && hasPhotos && (
          <View style={styles.photoGrid}>
            {photos.map((photo) => (
              <TouchableOpacity
                key={photo.key}
                style={styles.photoItem}
                onPress={() => handleImagePress(getImageUrl(photo.path) || '')}
              >
                <Image
                  source={{ uri: getImageUrl(photo.path) || '' }}
                  style={styles.photoThumb}
                  resizeMode="cover"
                />
                <Text style={styles.photoLabel}>{photo.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Carregando detalhes...</Text>
      </View>
    );
  }

  if (error || !auction) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>❌ {error || 'Leilão não encontrado'}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Modal de imagem */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setImageModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Image
              source={{ uri: selectedImage || '' }}
              style={styles.modalImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setImageModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Leilão</Text>
          <TouchableOpacity
            style={styles.addVehicleButton}
            onPress={() => navigation.navigate('AdicionarVeiculoLeilao', { auctionId: auction.id })}
          >
            <Text style={styles.addVehicleButtonText}>➕</Text>
          </TouchableOpacity>
        </View>

        {/* Informações do leilão */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nº Leilão</Text>
            <Text style={styles.infoValue}><Text style={styles.infoValueBold}>{auction.auction_number}</Text></Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Edital</Text>
            <Text style={styles.infoValue}>{auction.edital_number || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Data</Text>
            <Text style={styles.infoValue}>{formatDate(auction.auction_date)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(auction.status) }]}>
              <Text style={styles.statusText}>{getStatusLabel(auction.status)}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Leiloeiro</Text>
            <Text style={styles.infoValue}>{auction.auctioneer || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Empresa</Text>
            <Text style={styles.infoValue}>{auction.company || '-'}</Text>
          </View>
          {auction.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Observações</Text>
              <Text style={styles.infoValue}>{auction.notes}</Text>
            </View>
          )}
        </View>

        {/* Veículos */}
        <View style={styles.vehiclesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🚗 Veículos</Text>
            <Text style={styles.vehicleCount}>{auction.vehicles?.length || 0}</Text>
          </View>

          {auction.vehicles && auction.vehicles.length > 0 ? (
            <FlatList
              data={auction.vehicles}
              renderItem={renderVehicleItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.vehiclesList}
            />
          ) : (
            <View style={styles.emptyVehicles}>
              <Text style={styles.emptyText}>Nenhum veículo neste leilão</Text>
              <TouchableOpacity
                style={styles.addVehicleButtonLarge}
                onPress={() => navigation.navigate('AdicionarVeiculoLeilao', { auctionId: auction.id })}
              >
                <Text style={styles.addVehicleButtonLargeText}>➕ Adicionar Veículo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#1e3a8a',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 20,
    color: '#ffffff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addVehicleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addVehicleButtonText: {
    fontSize: 20,
    color: '#ffffff',
  },
  // Info Card
  infoCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
  },
  infoValueBold: {
    fontWeight: '700',
    color: '#1e3a8a',
  },
  // Status Badge
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Vehicles Section
  vehiclesSection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  vehicleCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  vehiclesList: {
    gap: 12,
  },
  // Vehicle Card
  vehicleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vehiclePlate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  vehicleValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  vehicleInfo: {
    marginBottom: 8,
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  vehicleDetail: {
    fontSize: 13,
    color: '#6b7280',
  },
  // Actions
  vehicleActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  photoButton: {
    backgroundColor: '#3b82f6',
  },
  docButton: {
    backgroundColor: '#059669',
  },
  baixaButton: {
    backgroundColor: '#d97706',
  },
  // Photos
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  photoItem: {
    width: 80,
    alignItems: 'center',
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  photoLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '90%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 24,
    color: '#ffffff',
  },
  // Empty
  emptyVehicles: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  addVehicleButtonLarge: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addVehicleButtonLargeText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default LeilaoDetalhesScreen;
