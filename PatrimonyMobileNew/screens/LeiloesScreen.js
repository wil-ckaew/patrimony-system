// screens/LeiloesScreen.js
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
  Platform,
  RefreshControl,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';

console.log('[Leiloes] 📄 LeiloesScreen.js CARREGADO');

// ============================================================
// HELPERS
// ============================================================
const showAlert = (title, message, onOk) => {
  if (Platform.OS === 'web') {
    try { window.alert(`${title}\n\n${message}`); } catch (e) {}
    if (onOk) onOk();
  } else {
    Alert.alert(title, message, [{ text: 'OK', onPress: onOk }], { cancelable: false });
  }
};

const showConfirm = (title, message, onConfirm) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`) && onConfirm) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', style: 'destructive', onPress: onConfirm }
    ]);
  }
};

// ============================================================
// STATUS HELPERS
// ============================================================
const getStatusLabel = (status) => {
  const labels = {
    'EM_PREPARACAO': 'Em Preparação',
    'PUBLICADO': 'Publicado',
    'REALIZADO': 'Realizado',
    'FINALIZADO': 'Finalizado',
    'BAIXA_CONCLUIDA': 'Baixa Concluída',
  };
  return labels[status] || status;
};

const getStatusColor = (status) => {
  const colors = {
    'EM_PREPARACAO': '#f59e0b',
    'PUBLICADO': '#3b82f6',
    'REALIZADO': '#8b5cf6',
    'FINALIZADO': '#10b981',
    'BAIXA_CONCLUIDA': '#6b7280',
  };
  return colors[status] || '#6b7280';
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('pt-BR');
};

// ============================================================
// MODAL DE FORMULÁRIO (criar/editar)
// ============================================================
function LeilaoForm({ visible, item, token, onClose, onSaved }) {
  const [auctionNumber, setAuctionNumber] = useState('');
  const [editalNumber, setEditalNumber] = useState('');
  const [auctionDate, setAuctionDate] = useState('');
  const [auctioneer, setAuctioneer] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState('EM_PREPARACAO');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (!visible) return;
    if (item) {
      setAuctionNumber(item.auction_number || '');
      setEditalNumber(item.edital_number || '');
      setAuctionDate(item.auction_date ? item.auction_date.split('T')[0] : '');
      setAuctioneer(item.auctioneer || '');
      setCompany(item.company || '');
      setStatus(item.status || 'EM_PREPARACAO');
      setNotes(item.notes || '');
    } else {
      setAuctionNumber('');
      setEditalNumber('');
      setAuctionDate('');
      setAuctioneer('');
      setCompany('');
      setStatus('EM_PREPARACAO');
      setNotes('');
    }
  }, [visible, item]);

  const handleSave = async () => {
    if (!auctionNumber) {
      showAlert('Erro', 'Preencha o número do leilão.');
      return;
    }
    setSaving(true);
    try {
      const url = item
        ? `${API_BASE_URL}/api/auctions/${item.id}`
        : `${API_BASE_URL}/api/auctions`;
      const method = item ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auction_number: auctionNumber,
          edital_number: editalNumber || null,
          auction_date: auctionDate || null,
          auctioneer: auctioneer || null,
          company: company || null,
          status,
          notes: notes || null,
        }),
      });

      if (response.ok) {
        showAlert('Sucesso', item ? 'Leilão atualizado!' : 'Leilão criado!', () => {
          onSaved();
        });
      } else {
        const errorText = await response.text();
        showAlert('Erro', errorText || 'Erro ao salvar leilão');
      }
    } catch (e) {
      showAlert('Erro', `Erro de conexão: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {item ? '✏️ Editar Leilão' : '➕ Novo Leilão'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.label}>Nº Leilão *</Text>
            <TextInput
              style={styles.input}
              value={auctionNumber}
              onChangeText={setAuctionNumber}
              placeholder="Ex: 001/2026"
              editable={!saving}
            />

            <Text style={styles.label}>Edital</Text>
            <TextInput
              style={styles.input}
              value={editalNumber}
              onChangeText={setEditalNumber}
              placeholder="Ex: 001/2026"
              editable={!saving}
            />

            <Text style={styles.label}>Data do Leilão</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={auctionDate || ''}
                onChange={(e) => setAuctionDate(e.target.value)}
                disabled={saving}
                style={{
                  backgroundColor: 'white', borderWidth: '2px',
                  borderStyle: 'solid', borderColor: '#e5e7eb',
                  borderRadius: '8px', padding: '10px 12px',
                  fontSize: '16px', marginBottom: '16px',
                  width: '100%', height: '44px', boxSizing: 'border-box',
                  fontFamily: 'inherit', color: '#374151',
                }}
              />
            ) : (
              <TextInput
                style={styles.input}
                value={auctionDate}
                onChangeText={setAuctionDate}
                placeholder="AAAA-MM-DD"
                editable={!saving}
              />
            )}

            <Text style={styles.label}>Leiloeiro</Text>
            <TextInput
              style={styles.input}
              value={auctioneer}
              onChangeText={setAuctioneer}
              placeholder="Nome do leiloeiro"
              editable={!saving}
            />

            <Text style={styles.label}>Empresa</Text>
            <TextInput
              style={styles.input}
              value={company}
              onChangeText={setCompany}
              placeholder="Nome da empresa"
              editable={!saving}
            />

            <Text style={styles.label}>Status</Text>
            <View style={styles.statusContainer}>
              {[
                { value: 'EM_PREPARACAO', label: 'Em Preparação' },
                { value: 'PUBLICADO', label: 'Publicado' },
                { value: 'REALIZADO', label: 'Realizado' },
                { value: 'FINALIZADO', label: 'Finalizado' },
                { value: 'BAIXA_CONCLUIDA', label: 'Baixa Concluída' },
              ].map(s => (
                <TouchableOpacity
                  key={s.value}
                  style={[
                    styles.statusButton,
                    status === s.value && styles.statusButtonSelected,
                  ]}
                  onPress={() => setStatus(s.value)}
                  disabled={saving}
                >
                  <Text style={styles.statusButtonText}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Observações</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Anotações sobre este leilão"
              multiline
              numberOfLines={3}
              editable={!saving}
            />
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton, saving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {item ? 'Salvar' : 'Criar'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================
// TELA PRINCIPAL
// ============================================================
export default function LeiloesScreen({ navigation }) {
  const { token } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const hasLoadedOnce = useRef(false);

  const fetchAuctions = useCallback(async (showSpinner = false) => {
    console.log('[Leiloes] 🔄 Carregando leilões...');
    if (showSpinner) setRefreshing(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auctions`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[Leiloes] ✅ Leilões:', data.length);
        setAuctions(Array.isArray(data) ? data : []);
        hasLoadedOnce.current = true;
      } else if (response.status === 401) {
        showAlert('Sessão expirada', 'Faça login novamente.');
      } else {
        const errorText = await response.text();
        console.log('[Leiloes] ❌ Status:', response.status, errorText);
      }
    } catch (e) {
      console.log('[Leiloes] ❌ Erro:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchAuctions(!hasLoadedOnce.current);
    }, [fetchAuctions])
  );

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleDelete = (item) => {
    showConfirm(
      'Confirmar Exclusão',
      `Excluir o leilão "${item.auction_number}"?`,
      async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/auctions/${item.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (response.ok) {
            showAlert('Sucesso', 'Leilão excluído!', () => fetchAuctions());
          } else {
            const errorText = await response.text();
            showAlert('Erro', errorText || 'Erro ao excluir');
          }
        } catch (e) {
          showAlert('Erro', `Erro de conexão: ${e.message}`);
        }
      }
    );
  };

  const handleOpenDetail = (item) => {
    navigation.navigate('LeilaoDetail', { auction: item });
  };

  const filteredAuctions = auctions.filter(item => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      item.auction_number?.toLowerCase().includes(q) ||
      item.edital_number?.toLowerCase().includes(q) ||
      item.auctioneer?.toLowerCase().includes(q) ||
      item.company?.toLowerCase().includes(q) ||
      item.status?.toLowerCase().includes(q) ||
      item.notes?.toLowerCase().includes(q)
    );
  });

  if (loading && !hasLoadedOnce.current) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>Carregando leilões...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🏷️ Leilões</Text>
          <Text style={styles.headerSub}>Controle de veículos leiloados</Text>
        </View>
        <TouchableOpacity style={styles.newButton} onPress={handleNew}>
          <Text style={styles.newButtonText}>➕ Novo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar leilão, edital, leiloeiro..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {refreshing && (
        <View style={styles.refreshingBanner}>
          <ActivityIndicator size="small" color="#7c3aed" />
          <Text style={styles.refreshingText}>Atualizando...</Text>
        </View>
      )}

      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchAuctions(true)}
            colors={['#7c3aed']}
          />
        }
      >
        {filteredAuctions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {search ? 'Nenhum leilão encontrado' : 'Nenhum leilão cadastrado'}
            </Text>
            {!search && (
              <TouchableOpacity style={styles.emptyButton} onPress={handleNew}>
                <Text style={styles.emptyButtonText}>Criar primeiro leilão</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {filteredAuctions.length} leilão(ões)
            </Text>
            {filteredAuctions.map(item => (
              <View key={item.id} style={styles.card}>
                <TouchableOpacity
                  onPress={() => handleOpenDetail(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.auctionBadge}>
                      <Text style={styles.auctionBadgeText}>
                        Nº {item.auction_number}
                      </Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(item.status) }
                    ]}>
                      <Text style={styles.statusBadgeText}>
                        {getStatusLabel(item.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    {item.edital_number ? (
                      <Text style={styles.cardLine}>
                        <Text style={styles.cardLabel}>Edital: </Text>
                        {item.edital_number}
                      </Text>
                    ) : null}
                    <Text style={styles.cardLine}>
                      <Text style={styles.cardLabel}>Data: </Text>
                      {formatDate(item.auction_date)}
                    </Text>
                    {item.auctioneer ? (
                      <Text style={styles.cardLine}>
                        <Text style={styles.cardLabel}>Leiloeiro: </Text>
                        {item.auctioneer}
                      </Text>
                    ) : null}
                    {item.company ? (
                      <Text style={styles.cardLine}>
                        <Text style={styles.cardLabel}>Empresa: </Text>
                        {item.company}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.cardAction, styles.viewAction]}
                    onPress={() => handleOpenDetail(item)}
                  >
                    <Text style={styles.cardActionText}>👁️ Ver</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.cardAction, styles.editAction]}
                    onPress={() => handleEdit(item)}
                  >
                    <Text style={styles.cardActionText}>✏️ Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.cardAction, styles.deleteAction]}
                    onPress={() => handleDelete(item)}
                  >
                    <Text style={styles.cardActionText}>🗑️ Excluir</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <LeilaoForm
        visible={showForm}
        item={editingItem}
        token={token}
        onClose={() => setShowForm(false)}
        onSaved={() => {
          setShowForm(false);
          fetchAuctions(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 16 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'white', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  headerSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  newButton: {
    backgroundColor: '#7c3aed', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 8,
  },
  newButtonText: { color: 'white', fontWeight: '600', fontSize: 14 },

  searchContainer: {
    padding: 16, backgroundColor: 'white',
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    backgroundColor: '#f9fafb', padding: 12, borderRadius: 10,
    borderWidth: 2, borderColor: '#e5e7eb', fontSize: 15, color: '#374151',
  },

  refreshingBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 8, backgroundColor: '#f5f3ff', gap: 8,
  },
  refreshingText: { color: '#7c3aed', fontSize: 13, fontWeight: '500' },

  listContainer: { flex: 1, padding: 16 },
  resultsCount: {
    fontSize: 13, color: '#6b7280', marginBottom: 12,
    textAlign: 'center', fontWeight: '500',
  },
  emptyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 40, minHeight: 200,
  },
  emptyText: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 16 },
  emptyButton: {
    backgroundColor: '#7c3aed', paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: { color: 'white', fontWeight: '600' },

  card: {
    backgroundColor: 'white', borderRadius: 10, marginBottom: 12,
    borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 12, gap: 8,
  },
  auctionBadge: {
    backgroundColor: '#f5f3ff', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 6, borderWidth: 1, borderColor: '#ddd6fe',
  },
  auctionBadgeText: {
    color: '#6d28d9', fontWeight: 'bold', fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
  },
  statusBadgeText: { color: 'white', fontSize: 11, fontWeight: '700' },

  cardBody: { paddingHorizontal: 12, paddingBottom: 8, gap: 4 },
  cardLine: { fontSize: 13, color: '#374151', lineHeight: 18 },
  cardLabel: { fontWeight: '600', color: '#6b7280' },

  cardActions: {
    flexDirection: 'row', gap: 6, padding: 12,
    borderTopWidth: 1, borderTopColor: '#f3f4f6',
  },
  cardAction: {
    flex: 1, padding: 8, borderRadius: 6, alignItems: 'center',
  },
  viewAction: { backgroundColor: '#e0e7ff' },
  editAction: { backgroundColor: '#dbeafe' },
  deleteAction: { backgroundColor: '#fee2e2' },
  cardActionText: { fontSize: 12, fontWeight: '600', color: '#1f2937' },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 16,
  },
  modalContent: {
    backgroundColor: 'white', borderRadius: 12,
    width: '100%', maxWidth: 500, maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  modalClose: { fontSize: 22, color: '#6b7280', paddingHorizontal: 8 },
  modalBody: { padding: 16, maxHeight: 450 },

  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#f9fafb', borderWidth: 2, borderColor: '#e5e7eb',
    borderRadius: 8, padding: 10, fontSize: 15, marginBottom: 8,
  },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  statusContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  statusButton: {
    backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 6, borderWidth: 2, borderColor: '#e5e7eb',
  },
  statusButtonSelected: { backgroundColor: '#ede9fe', borderColor: '#7c3aed' },
  statusButtonText: { fontSize: 11, color: '#374151', fontWeight: '500' },

  modalActions: {
    flexDirection: 'row', gap: 8, padding: 16,
    borderTopWidth: 1, borderTopColor: '#e5e7eb',
  },
  modalButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#e5e7eb' },
  cancelButtonText: { color: '#374151', fontWeight: '600' },
  saveButton: { backgroundColor: '#7c3aed' },
  saveButtonText: { color: 'white', fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
});
