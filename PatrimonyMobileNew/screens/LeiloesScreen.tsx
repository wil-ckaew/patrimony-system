import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getAuthHeaders } from '../utils/auth';
import { API_URL } from '../config';

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
}

const LeiloesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchAuctions = async () => {
    try {
      setError('');
      const headers = getAuthHeaders();
      const response = await fetch(`${API_URL}/api/auctions`, { headers });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Sessão expirada. Faça login novamente.');
          return;
        }
        throw new Error(`Erro ${response.status}`);
      }

      const data = await response.json();
      setAuctions(data);
    } catch (err: any) {
      console.error('❌ Erro:', err);
      setError('Erro ao carregar leilões');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAuctions();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAuctions();
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

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const renderItem = ({ item }: { item: Auction }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('LeilaoDetalhes', { id: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.auction_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Edital:</Text>
          <Text style={styles.cardValue}>{item.edital_number || '-'}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Data:</Text>
          <Text style={styles.cardValue}>{formatDate(item.auction_date)}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Leiloeiro:</Text>
          <Text style={styles.cardValue}>{item.auctioneer || '-'}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Empresa:</Text>
          <Text style={styles.cardValue}>{item.company || '-'}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.cardAction}>👁️ Ver detalhes</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Carregando leilões...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a8a" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏷️ Leilões</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('NovoLeilao')}
        >
          <Text style={styles.addButtonText}>➕</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAuctions}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : auctions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum leilão cadastrado</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('NovoLeilao')}
          >
            <Text style={styles.emptyButtonText}>➕ Criar primeiro leilão</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={auctions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#1e3a8a',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 22,
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
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
  cardBody: {
    gap: 4,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 13,
    color: '#1f2937',
  },
  cardFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    alignItems: 'flex-end',
  },
  cardAction: {
    fontSize: 13,
    color: '#3b82f6',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
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
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default LeiloesScreen;
