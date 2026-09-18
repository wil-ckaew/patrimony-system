// screens/LeilaoDetailScreen.js
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

console.log('[LeilaoDetail] 📄 LeilaoDetailScreen.js CARREGADO');

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

const formatCurrency = (value) => {
  if (!value && value !== 0) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
  }).format(value);
};

// ============================================================
// MODAL — ADICIONAR VEÍCULO AO LEILÃO
// ============================================================
function AddVehicleModal({ visible, auctionId, token, onClose, onSaved }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [startingBid, setStartingBid] = useState('');
  const [soldValue, setSoldValue] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerDoc, setBuyerDoc] = useState('');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (!visible) return;
    setSelectedId('');
    setLotNumber('');
    setStartingBid('');
    setSoldValue('');
    setBuyerName('');
    setBuyerDoc('');
    setNotes('');
    setSearch('');

    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`${API_BASE_URL}/api/patrimony?is_vehicle=true`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (r.ok) {
          const data = await r.json();
          setVehicles(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.log('[AddVehicle] Erro:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [visible, token]);

  const filtered = vehicles.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.plate?.toLowerCase().includes(q) || v.name?.toLowerCase().includes(q);
  });

  const selected = vehicles.find(v => v.id === selectedId);

  const handleSave = async () => {
    if (!selectedId) {
      showAlert('Erro', 'Selecione um veículo.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auctions/${auctionId}/vehicles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patrimony_id: selectedId,
          lot_number: lotNumber || null,
          starting_bid: startingBid ? parseFloat(startingBid.replace(',', '.')) : null,
          sold_value: soldValue ? parseFloat(soldValue.replace(',', '.')) : null,
          buyer_name: buyerName || null,
          buyer_document: buyerDoc || null,
          notes: notes || null,
        }),
      });

      if (response.ok) {
        showAlert('Sucesso', 'Veículo adicionado ao leilão!', onSaved);
      } else {
        const errorText = await response.text();
        showAlert('Erro', errorText || 'Erro ao adicionar veículo');
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
            <Text style={styles.modalTitle}>➕ Adicionar Veículo</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.label}>Buscar Veículo *</Text>
            <TextInput
              style={styles.input}
              value={search}
              onChangeText={setSearch}
              placeholder="Placa ou nome do veículo"
              editable={!saving}
            />

            {loading ? (
              <ActivityIndicator color="#7c3aed" style={{ marginVertical: 20 }} />
            ) : (
              <View style={styles.vehicleList}>
                {filtered.slice(0, 6).map(v => (
                  <TouchableOpacity
                    key={v.id}
                    style={[
                      styles.vehicleOption,
                      selectedId === v.id && styles.vehicleOptionSelected,
                    ]}
                    onPress={() => setSelectedId(v.id)}
                    disabled={saving}
                  >
                    <Text style={styles.vehiclePlate}>{v.plate || 'S/P'}</Text>
                    <Text style={styles.vehicleName}>{v.name}</Text>
                  </TouchableOpacity>
                ))}
                {filtered.length === 0 && (
                  <Text style={styles.emptyText}>Nenhum veículo encontrado</Text>
                )}
              </View>
            )}

            {selected && (
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedInfoTitle}>✅ Selecionado</Text>
                <Text>Placa: {selected.plate || 'N/A'}</Text>
                <Text>Nome: {selected.name}</Text>
              </View>
            )}

            <Text style={styles.label}>Nº do Lote</Text>
            <TextInput
              style={styles.input}
              value={lotNumber}
              onChangeText={setLotNumber}
              placeholder="Ex: 001"
              editable={!saving}
            />

            <Text style={styles.label}>Valor Inicial (R$)</Text>
            <TextInput
              style={styles.input}
              value={startingBid}
              onChangeText={setStartingBid}
              placeholder="0,00"
              keyboardType="decimal-pad"
              editable={!saving}
            />

            <Text style={styles.label}>Valor Vendido (R$)</Text>
            <TextInput
              style={styles.input}
              value={soldValue}
              onChangeText={setSoldValue}
              placeholder="0,00"
              keyboardType="decimal-pad"
              editable={!saving}
            />

            <Text style={styles.label}>Nome do Comprador</Text>
            <TextInput
              style={styles.input}
              value={buyerName}
              onChangeText={setBuyerName}
              placeholder="Nome completo"
              editable={!saving}
            />

            <Text style={styles.label}>CPF/CNPJ do Comprador</Text>
            <TextInput
              style={styles.input}
              value={buyerDoc}
              onChangeText={setBuyerDoc}
              placeholder="000.000.000-00"
              editable={!saving}
            />

            <Text style={styles.label}>Observações</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Anotações sobre este lote"
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
              {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>Adicionar</Text>}
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
export default function LeilaoDetailScreen({ route, navigation }) {
  const { auction: initialAuction } = route.params;
  const { token } = useAuth();
  const [auction, setAuction] = useState(initialAuction);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);

  const fetchDetail = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      // Busca detalhes do leilão
      const auctionRes = await fetch(`${API_BASE_URL}/api/auctions/${initialAuction.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (auctionRes.ok) {
        const data = await auctionRes.json();
        setAuction(data);
      }

      // Busca veículos do leilão
      const vehiclesRes = await fetch(`${API_BASE_URL}/api/auctions/${initialAuction.id}/vehicles`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (vehiclesRes.ok) {
        const data = await vehiclesRes.json();
        console.log('[LeilaoDetail] Veículos:', data.length);
        setVehicles(Array.isArray(data) ? data : []);
      } else if (vehiclesRes.status === 404) {
        console.log('[LeilaoDetail] Endpoint de veículos não existe (404)');
        setVehicles([]);
      }
    } catch (e) {
      console.log('[LeilaoDetail] Erro:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [initialAuction.id, token]);

  useFocusEffect(
    useCallback(() => {
      fetchDetail();
    }, [fetchDetail])
  );

  const handleRemoveVehicle = (vehicle) => {
    showConfirm(
      'Remover Veículo',
      `Remover o veículo "${vehicle.patrimony_name || vehicle.patrimony_plate}" do leilão?`,
      async () => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/auctions/${auction.id}/vehicles/${vehicle.id}`,
            {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` },
            }
          );
          if (response.ok) {
            showAlert('Sucesso', 'Veículo removido!', () => fetchDetail());
          } else {
            const errorText = await response.text();
            showAlert('Erro', errorText || 'Erro ao remover');
          }
        } catch (e) {
          showAlert('Erro', `Erro de conexão: ${e.message}`);
        }
      }
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchDetail(true)}
          colors={['#7c3aed']}
        />
      }
    >
      {/* Header do leilão */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.auctionBadge}>
            <Text style={styles.auctionBadgeText}>Nº {auction.auction_number}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(auction.status) }
          ]}>
            <Text style={styles.statusBadgeText}>
              {getStatusLabel(auction.status)}
            </Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <InfoRow label="Edital" value={auction.edital_number || '-'} />
          <InfoRow label="Data" value={formatDate(auction.auction_date)} />
          <InfoRow label="Leiloeiro" value={auction.auctioneer || '-'} />
          <InfoRow label="Empresa" value={auction.company || '-'} />
          {auction.notes ? (
            <InfoRow label="Observações" value={auction.notes} />
          ) : null}
        </View>
      </View>

      {/* Seção veículos */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            🚗 Veículos no Leilão ({vehicles.length})
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddVehicle(true)}
          >
            <Text style={styles.addButtonText}>➕ Adicionar</Text>
          </TouchableOpacity>
        </View>

        {vehicles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum veículo adicionado</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowAddVehicle(true)}
            >
              <Text style={styles.emptyButtonText}>Adicionar primeiro</Text>
            </TouchableOpacity>
          </View>
        ) : (
          vehicles.map(v => (
            <View key={v.id} style={styles.vehicleCard}>
              <View style={styles.vehicleHeader}>
                {v.lot_number ? (
                  <View style={styles.lotBadge}>
                    <Text style={styles.lotBadgeText}>Lote {v.lot_number}</Text>
                  </View>
                ) : null}
                <Text style={styles.vehiclePlate}>
                  {v.patrimony_plate || v.plate || 'S/P'}
                </Text>
              </View>

              <Text style={styles.vehicleName}>
                {v.patrimony_name || v.name || 'Sem nome'}
              </Text>

              {v.starting_bid != null ? (
                <Text style={styles.vehicleInfo}>
                  <Text style={styles.vehicleInfoLabel}>Valor inicial: </Text>
                  {formatCurrency(v.starting_bid)}
                </Text>
              ) : null}

              {v.sold_value != null ? (
                <Text style={styles.vehicleInfo}>
                  <Text style={styles.vehicleInfoLabel}>Vendido por: </Text>
                  <Text style={styles.soldValue}>{formatCurrency(v.sold_value)}</Text>
                </Text>
              ) : null}

              {v.buyer_name ? (
                <Text style={styles.vehicleInfo}>
                  <Text style={styles.vehicleInfoLabel}>Comprador: </Text>
                  {v.buyer_name}
                </Text>
              ) : null}

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveVehicle(v)}
              >
                <Text style={styles.removeButtonText}>🗑️ Remover</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <AddVehicleModal
        visible={showAddVehicle}
        auctionId={auction.id}
        token={token}
        onClose={() => setShowAddVehicle(false)}
        onSaved={() => {
          setShowAddVehicle(false);
          fetchDetail(true);
        }}
      />
    </ScrollView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerCard: {
    backgroundColor: 'white', margin: 16, borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: '#e5e7eb',
  },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  auctionBadge: {
    backgroundColor: '#f5f3ff', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 6, borderWidth: 1, borderColor: '#ddd6fe',
  },
  auctionBadgeText: { color: '#6d28d9', fontWeight: 'bold', fontSize: 14 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusBadgeText: { color: 'white', fontSize: 11, fontWeight: '700' },

  infoGrid: { gap: 6 },
  infoRow: { flexDirection: 'row', gap: 8 },
  infoLabel: { fontSize: 13, color: '#6b7280', fontWeight: '600', minWidth: 90 },
  infoValue: { fontSize: 13, color: '#374151', flex: 1 },

  sectionCard: {
    backgroundColor: 'white', margin: 16, marginTop: 0, borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: '#e5e7eb',
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', flex: 1 },
  addButton: {
    backgroundColor: '#7c3aed', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: { color: 'white', fontWeight: '600', fontSize: 13 },

  emptyContainer: { padding: 30, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#6b7280', marginBottom: 12, textAlign: 'center' },
  emptyButton: {
    backgroundColor: '#7c3aed', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 8,
  },
  emptyButtonText: { color: 'white', fontWeight: '600' },

  vehicleCard: {
    backgroundColor: '#faf5ff', borderRadius: 8, padding: 12,
    marginBottom: 10, borderWidth: 1, borderColor: '#e9d5ff',
  },
  vehicleHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6,
  },
  lotBadge: {
    backgroundColor: '#7c3aed', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 4,
  },
  lotBadgeText: { color: 'white', fontSize: 11, fontWeight: '700' },
  vehiclePlate: { fontWeight: 'bold', color: '#1f2937', fontSize: 14 },
  vehicleName: { fontSize: 14, color: '#374151', marginBottom: 6 },
  vehicleInfo: { fontSize: 13, color: '#374151', marginBottom: 3 },
  vehicleInfoLabel: { color: '#6b7280', fontWeight: '600' },
  soldValue: { color: '#10b981', fontWeight: 'bold' },
  removeButton: {
    marginTop: 8, backgroundColor: '#fee2e2',
    padding: 8, borderRadius: 6, alignItems: 'center',
  },
  removeButtonText: { color: '#dc2626', fontWeight: '600', fontSize: 13 },

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

  vehicleList: {
    borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 8, maxHeight: 180, overflow: 'scroll',
  },
  vehicleOption: {
    padding: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  vehicleOptionSelected: { backgroundColor: '#ede9fe' },
  vehiclePlate: { fontWeight: 'bold', color: '#1f2937', fontSize: 14 },
  vehicleName: { fontSize: 12, color: '#6b7280' },

  selectedInfo: {
    backgroundColor: '#dcfce7', padding: 10, borderRadius: 8,
    marginTop: 8, gap: 4,
  },
  selectedInfoTitle: { fontWeight: 'bold', color: '#166534', marginBottom: 4 },

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
