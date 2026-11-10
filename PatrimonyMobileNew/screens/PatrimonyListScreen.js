// screens/PatrimonyListScreen.js
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';

export default function PatrimonyListScreen({ navigation }) {
  const [patrimonies, setPatrimonies] = useState([]);
  const [allPatrimonies, setAllPatrimonies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const { getAuthHeaders, logout } = useAuth();

  const hasLoadedOnce = useRef(false);
  const focusCount = useRef(0);

  const fetchPatrimonies = useCallback(async (showSpinner = false) => {
    console.log('[PL] fetchPatrimonies START (spinner:', showSpinner, ')');
    if (showSpinner) setRefreshing(true);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/patrimony`, { headers });
      console.log('[PL] status:', response.status);

      if (response.status === 401) {
        console.log('[PL] 401 — logout');
        Alert.alert('Sessão expirada', 'Por favor, faça login novamente');
        await logout();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        const mappedData = (Array.isArray(data) ? data : []).map(item => ({
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
          invoiceFile: item.invoice_file || (item.fiscal_documents && item.fiscal_documents[0] && item.fiscal_documents[0].invoice_file) || null,
          commitmentFile: item.commitment_file || (item.fiscal_documents && item.fiscal_documents[0] && item.fiscal_documents[0].commitment_file) || null,
          denfFile: item.denf_se_file 
            || (item.fiscal_documents && item.fiscal_documents.find(d => d.denf_se_file)?.denf_se_file)
            || null,
          denfNumber: item.denf_se_number || (item.fiscal_documents && item.fiscal_documents[0] && item.fiscal_documents[0].denf_se_number) || null,
        }));
        console.log('[PL] itens:', mappedData.length);
        // Log específico para o Notebook 29091
        const notebook = mappedData.find(i => i.plate === '29091');
        if (notebook) {
        }
        setAllPatrimonies(mappedData);
        setPatrimonies(mappedData);
        hasLoadedOnce.current = true;



        // Buscar detalhes de TODOS os itens (para pegar os anexos)
        const withDocs = mappedData;
        
        if (withDocs.length > 0) {
          console.log('[PL] Buscando detalhes de', withDocs.length, 'itens...');
          const details = await Promise.all(
            toFetch.map(async (item) => {
              try {
                console.log('[PL] fetch detalhe', item.id);
                const resp = await fetch(`${API_BASE_URL}/api/patrimony/${item.id}`, { headers });
                console.log('[PL] resp.ok', resp.status, item.id);
                if (resp.ok) {
                  const full = await resp.json();
                  console.log('[PL] detalhe', item.id, ':', JSON.stringify({
                    invoice_file: full.invoice_file,
                    commitment_file: full.commitment_file,
                    denf_se_file: full.denf_se_file,
                    tem_fiscal_docs: !!full.fiscal_documents,
                    qtd_fiscal_docs: full.fiscal_documents?.length,
                    denf_no_fiscal: full.fiscal_documents?.[0]?.denf_se_file,
                  }));
                  return { id: item.id, full };
                }
              } catch (e) {
                console.log('[PL] Erro ao buscar detalhe', item.id, e);
              }
              return null;
            })
          );
          
          const enriched = mappedData.map(item => {
            const detail = details.find(d => d && d.id === item.id);
            if (detail && detail.full) {
              return {
                ...item,
                invoiceFile: item.invoiceFile || detail.full.invoice_file 
                  || (detail.full.fiscal_documents && detail.full.fiscal_documents[0] && detail.full.fiscal_documents[0].invoice_file) 
                  || null,
                commitmentFile: item.commitmentFile || detail.full.commitment_file 
                  || (detail.full.fiscal_documents && detail.full.fiscal_documents[0] && detail.full.fiscal_documents[0].commitment_file) 
                  || null,
                denfFile: item.denfFile || detail.full.denf_se_file 
                  || (detail.full.fiscal_documents && detail.full.fiscal_documents.find(d => d.denf_se_file)?.denf_se_file)
                  || null,
                _debugDenf: detail.full.fiscal_documents?.map(d => d.denf_se_file)
              };
            }
            return item;
          });
          
          console.log('[PL] enriched[0].denfFile:', enriched[0]?.denfFile);
          console.log('[PL] enriched[0]._debugDenf:', enriched[0]?._debugDenf);
          setAllPatrimonies(enriched);
          setPatrimonies(enriched);
          console.log('[PL] Detalhes mesclados');
        }
      } else {
        const errorText = await response.text();
        console.log('[PL] erro', response.status, errorText.substring(0, 100));
        Alert.alert('Erro', `Não foi possível carregar os bens: ${response.status}`);
      }
    } catch (error) {
      console.log('[PL] CATCH:', error?.message);
      Alert.alert('Erro', 'Não foi possível carregar os bens.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.log('[PL] fetchPatrimonies FIM');
    }
  }, [getAuthHeaders, logout]);

  // Recarrega ao ganhar foco (volta da edição, novo, detalhe)
  useFocusEffect(
    useCallback(() => {
      focusCount.current += 1;
      const isFirstFocus = focusCount.current === 1;
      console.log('[PL] 🎯 useFocusEffect disparou (foco #' + focusCount.current + ')');
      fetchPatrimonies(isFirstFocus);
      return () => {
        console.log('[PL] 👋 tela perdeu foco');
      };
    }, [fetchPatrimonies])
  );

  // ============================================================
  // BUSCA MELHORADA — inclui nome, placa, descrição, departamento, setor,
  // fornecedor, número NF, empenho, DENF/SE
  // ============================================================
  const filteredPatrimonies = allPatrimonies.filter(item => {
    const q = searchText.toLowerCase().trim();
    if (!q) return true;

    // Busca em vários campos, incluindo a descrição
    return (
      item.name?.toLowerCase().includes(q) ||
      item.plate?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||        // ← NOVO: busca na descrição
      item.department?.toLowerCase().includes(q) ||
      item.sector?.toLowerCase().includes(q) ||
      item.supplier?.toLowerCase().includes(q) ||            // ← NOVO: fornecedor
      item.invoiceNumber?.toLowerCase().includes(q) ||       // ← NOVO: nº NF
      item.commitmentNumber?.toLowerCase().includes(q) ||    // ← NOVO: nº empenho
      item.denfSeNumber?.toLowerCase().includes(q)           // ← NOVO: nº DENF/SE
    );
  });

  const handleItemPress = (item) => {
    navigation.navigate('PatrimonyDetail', { item });
  };

  const clearSearch = () => setSearchText('');

  if (loading && !hasLoadedOnce.current) {
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
        <View style={styles.searchInputWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome, placa, descrição, setor..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#9ca3af"
          />
          {searchText ? (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearSearch}
              activeOpacity={0.7}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {searchText ? (
          <Text style={styles.searchHint}>
            🔍 Buscando por: <Text style={styles.searchHintBold}>"{searchText}"</Text>
          </Text>
        ) : null}
      </View>

      {refreshing && (
        <View style={styles.refreshingBanner}>
          <ActivityIndicator size="small" color="#2563eb" />
          <Text style={styles.refreshingText}>Atualizando...</Text>
        </View>
      )}

      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchPatrimonies(true)}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
      >
        {filteredPatrimonies.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchText
                ? `Nenhum bem encontrado para "${searchText}"`
                : 'Nenhum bem cadastrado'}
            </Text>
            {searchText ? (
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={clearSearch}
              >
                <Text style={styles.clearFilterText}>Limpar filtro</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {filteredPatrimonies.length} bem(ns) encontrado(s)
            </Text>
            {filteredPatrimonies.map(item => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleItemPress(item)}
                style={styles.card}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardName}>{item.name || 'sem nome'}</Text>
                  {item.plate ? (
                    <View style={styles.plateBadge}>
                      <Text style={styles.plateBadgeText}>{item.plate}</Text>
                    </View>
                  ) : null}
                </View>

                {item.description ? (
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}

                <View style={styles.cardFooter}>
                  <Text style={styles.cardMeta}>
                    {item.department || 'sem depto'}
                    {item.sector ? ` • ${item.sector}` : ''}
                  </Text>
                  <Text style={[
                    styles.cardStatus,
                    item.status === 'active' ? styles.statusActive :
                    item.status === 'inactive' ? styles.statusInactive :
                    item.status === 'maintenance' ? styles.statusMaintenance :
                    styles.statusWrittenOff
                  ]}>
                    {item.status === 'active' ? 'Ativo' :
                     item.status === 'inactive' ? 'Inativo' :
                     item.status === 'maintenance' ? 'Manutenção' : 'Baixado'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.refreshButton}
        onPress={() => fetchPatrimonies(true)}
        disabled={refreshing}
      >
        <Text style={styles.refreshButtonText}>
          {refreshing ? '🔄 Carregando...' : '🔄 Atualizar Lista'}
        </Text>
      </TouchableOpacity>

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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 16 },

  searchContainer: {
    padding: 16, backgroundColor: 'white',
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  searchInputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f9fafb', borderRadius: 12,
    borderWidth: 2, borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1, padding: 16, fontSize: 16, color: '#374151',
  },
  clearButton: {
    paddingHorizontal: 16, paddingVertical: 16,
  },
  clearButtonText: {
    fontSize: 18, color: '#9ca3af', fontWeight: 'bold',
  },
  searchHint: {
    fontSize: 12, color: '#6b7280',
    marginTop: 8, fontStyle: 'italic',
  },
  searchHintBold: { fontWeight: 'bold', color: '#2563eb' },

  refreshingBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 8, backgroundColor: '#eff6ff',
    borderBottomWidth: 1, borderBottomColor: '#dbeafe', gap: 8,
  },
  refreshingText: { color: '#2563eb', fontSize: 13, fontWeight: '500' },

  listContainer: { flex: 1, padding: 16 },
  resultsCount: {
    fontSize: 14, color: '#6b7280',
    marginBottom: 16, textAlign: 'center', fontWeight: '500',
  },
  emptyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 40, minHeight: 200,
  },
  emptyText: {
    fontSize: 16, color: '#6b7280',
    textAlign: 'center', marginBottom: 16,
  },
  clearFilterButton: {
    backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 8,
  },
  clearFilterText: { color: 'white', fontWeight: '600' },

  card: {
    backgroundColor: 'white', borderRadius: 10,
    marginBottom: 10, padding: 14,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6, gap: 8,
  },
  cardName: {
    fontSize: 16, fontWeight: 'bold', color: '#1f2937', flex: 1,
  },
  plateBadge: {
    backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6,
  },
  plateBadgeText: { color: '#1e40af', fontSize: 12, fontWeight: '700' },
  cardDescription: {
    fontSize: 13, color: '#6b7280', marginBottom: 8, lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 4,
  },
  cardMeta: { fontSize: 12, color: '#6b7280', flex: 1 },
  cardStatus: {
    fontSize: 11, fontWeight: '600',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 4, overflow: 'hidden',
  },
  statusActive: { backgroundColor: '#dcfce7', color: '#166534' },
  statusInactive: { backgroundColor: '#fee2e2', color: '#991b1b' },
  statusMaintenance: { backgroundColor: '#fef3c7', color: '#92400e' },
  statusWrittenOff: { backgroundColor: '#e5e7eb', color: '#374151' },

  refreshButton: {
    backgroundColor: '#059669', padding: 16, margin: 16,
    borderRadius: 12, alignItems: 'center',
  },
  refreshButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },

  fab: {
    position: 'absolute', right: 20, bottom: 100,
    backgroundColor: '#059669', width: 60, height: 60,
    borderRadius: 30, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
  },
  fabIcon: { color: 'white', fontSize: 28, fontWeight: 'bold' },
});
