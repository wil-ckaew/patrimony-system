// screens/FleetScreen.js
import React, { useState, useCallback } from 'react';
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
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';

console.log('[Fleet] 📄 FleetScreen.js CARREGADO');

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
// FORMULÁRIO DE FROTA
// ============================================================
function FleetForm({ visible, item, onClose, onSaved, token }) {
  const [fleetNumber, setFleetNumber] = useState(item?.fleet_number || '');
  const [patrimonyId, setPatrimonyId] = useState(item?.patrimony_id || '');
  const [department, setDepartment] = useState(item?.department || '');
  const [notes, setNotes] = useState(item?.notes || '');
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (!visible) return;
    setFleetNumber(item?.fleet_number || '');
    setPatrimonyId(item?.patrimony_id || '');
    setDepartment(item?.department || '');
    setNotes(item?.notes || '');
    setSearch('');
  }, [visible, item]);

  React.useEffect(() => {
    if (!visible) return;
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
        console.log('[Fleet] Erro ao buscar veículos:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [visible, token]);

  const filteredVehicles = vehicles.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.plate?.toLowerCase().includes(q) || v.name?.toLowerCase().includes(q);
  });

  const selectedVehicle = vehicles.find(v => v.id === patrimonyId);

  const handleSave = async () => {
    if (!patrimonyId) {
      showAlert('Erro', 'Selecione um veículo patrimonial.');
      return;
    }
    if (!fleetNumber) {
      showAlert('Erro', 'Preencha o número da frota.');
      return;
    }

    setSaving(true);
    try {
      const url = item
        ? `${API_BASE_URL}/api/fleet/${item.id}`
        : `${API_BASE_URL}/api/fleet`;
      const method = item ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fleet_number: fleetNumber,
          patrimony_id: patrimonyId,
          department: department || null,
          notes: notes || null,
        }),
      });

      if (response.ok) {
        showAlert('Sucesso', item ? 'Frota atualizada!' : 'Frota cadastrada!', () => {
          onSaved();
        });
      } else {
        const errorText = await response.text();
        showAlert('Erro', errorText || 'Erro ao salvar frota');
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
              {item ? '✏️ Editar Frota' : '➕ Nova Frota'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.label}>Número da Frota *</Text>
            <TextInput
              style={styles.input}
              value={fleetNumber}
              onChangeText={setFleetNumber}
              placeholder="Ex: FRT-001"
              editable={!saving}
            />

            <Text style={styles.label}>Buscar Veículo *</Text>
            <TextInput
              style={styles.input}
              value={search}
              onChangeText={setSearch}
              placeholder="Digite placa ou nome do veículo"
              editable={!saving}
            />

            {loading ? (
              <ActivityIndicator color="#2563eb" style={{ marginVertical: 20 }} />
            ) : (
              <View style={styles.vehicleList}>
                {filteredVehicles.slice(0, 8).map(v => (
                  <TouchableOpacity
                    key={v.id}
                    style={[
                      styles.vehicleOption,
                      patrimonyId === v.id && styles.vehicleOptionSelected,
                    ]}
                    onPress={() => setPatrimonyId(v.id)}
                    disabled={saving}
                  >
                    <Text style={styles.vehiclePlate}>{v.plate || 'S/P'}</Text>
                    <Text style={styles.vehicleName}>{v.name}</Text>
                  </TouchableOpacity>
                ))}
                {filteredVehicles.length === 0 && (
                  <Text style={styles.emptyText}>Nenhum veículo encontrado</Text>
                )}
              </View>
            )}

            {selectedVehicle && (
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedInfoTitle}>✅ Selecionado</Text>
                <Text>Placa: {selectedVehicle.plate || 'N/A'}</Text>
                <Text>Nome: {selectedVehicle.name}</Text>
              </View>
            )}

            <Text style={styles.label}>Departamento</Text>
            <TextInput
              style={styles.input}
              value={department}
              onChangeText={setDepartment}
              placeholder="Ex: Saúde, Educação..."
              editable={!saving}
            />

            <Text style={styles.label}>Observações</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Anotações sobre este veículo"
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
                  {item ? 'Salvar' : 'Cadastrar'}
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
export default function FleetScreen({ navigation }) {
  const { token } = useAuth();
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const hasLoadedOnce = React.useRef(false);

  const fetchFleet = useCallback(async (showSpinner = false) => {
    console.log('[Fleet] 🔄 Carregando frota...');
    if (showSpinner) setRefreshing(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/fleet`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[Fleet] ✅ Itens:', data.length);
        setFleet(Array.isArray(data) ? data : []);
        hasLoadedOnce.current = true;
      } else {
        console.log('[Fleet] ❌ Status:', response.status);
      }
    } catch (e) {
      console.log('[Fleet] ❌ Erro:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchFleet(!hasLoadedOnce.current);
    }, [fetchFleet])
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
      `Excluir o registro de frota "${item.fleet_number}"?`,
      async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/fleet/${item.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
          });

          if (response.ok) {
            showAlert('Sucesso', 'Frota excluída!', () => fetchFleet());
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

  const filteredFleet = fleet.filter(item => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.fleet_number?.toLowerCase().includes(q) ||
      item.patrimony_plate?.toLowerCase().includes(q) ||
      item.patrimony_name?.toLowerCase().includes(q) ||
      item.department?.toLowerCase().includes(q)
    );
  });

  if (loading && !hasLoadedOnce.current) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando frota...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🚘 Gestão de Frota</Text>
          <Text style={styles.headerSub}>Controle de veículos oficiais</Text>
        </View>
        <TouchableOpacity style={styles.newButton} onPress={handleNew}>
          <Text style={styles.newButtonText}>➕ Nova</Text>
        </TouchableOpacity>
      </View>

      {/* Busca */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar frota, placa, veículo..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {refreshing && (
        <View style={styles.refreshingBanner}>
          <ActivityIndicator size="small" color="#2563eb" />
          <Text style={styles.refreshingText}>Atualizando...</Text>
        </View>
      )}

      {/* Lista */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchFleet(true)}
            colors={['#2563eb']}
          />
        }
      >
        {filteredFleet.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {search ? 'Nenhum resultado' : 'Nenhuma frota cadastrada'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {filteredFleet.length} registro(s)
            </Text>
            {filteredFleet.map(item => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.fleetNumberBadge}>
                    <Text style={styles.fleetNumberText}>{item.fleet_number}</Text>
                  </View>
                  <Text style={styles.cardDept}>{item.department || '—'}</Text>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.cardLine}>
                    <Text style={styles.cardLabel}>Patrimônio: </Text>
                    {item.patrimony_name || 'Sem patrimônio'}
                  </Text>
                  <Text style={styles.cardLine}>
                    <Text style={styles.cardLabel}>Placa: </Text>
                    {item.patrimony_plate || 'N/A'}
                  </Text>
                  {item.notes ? (
                    <Text style={styles.cardLine}>
                      <Text style={styles.cardLabel}>Obs: </Text>
                      {item.notes}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.cardActions}>
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

      {/* Modal de Formulário */}
      <FleetForm
        visible={showForm}
        item={editingItem}
        token={token}
        onClose={() => setShowForm(false)}
        onSaved={() => {
          setShowForm(false);
          fetchFleet(true);
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
    backgroundColor: '#ea580c', paddingHorizontal: 16, paddingVertical: 10,
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
    padding: 8, backgroundColor: '#eff6ff', gap: 8,
  },
  refreshingText: { color: '#2563eb', fontSize: 13, fontWeight: '500' },

  listContainer: { flex: 1, padding: 16 },
  resultsCount: {
    fontSize: 13, color: '#6b7280', marginBottom: 12,
    textAlign: 'center', fontWeight: '500',
  },
  emptyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 40, minHeight: 200,
  },
  emptyText: { fontSize: 16, color: '#6b7280', textAlign: 'center' },

  card: {
    backgroundColor: 'white', borderRadius: 10, marginBottom: 12,
    borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 12,
    backgroundColor: '#fff7ed', borderBottomWidth: 1, borderBottomColor: '#fed7aa',
  },
  fleetNumberBadge: {
    backgroundColor: '#ea580c', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 6,
  },
  fleetNumberText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  cardDept: { fontSize: 13, color: '#9a3412', fontWeight: '600' },
  cardBody: { padding: 12, gap: 6 },
  cardLine: { fontSize: 14, color: '#374151', lineHeight: 20 },
  cardLabel: { fontWeight: '600', color: '#6b7280' },
  cardActions: {
    flexDirection: 'row', gap: 8, padding: 12,
    borderTopWidth: 1, borderTopColor: '#f3f4f6',
  },
  cardAction: {
    flex: 1, padding: 10, borderRadius: 6, alignItems: 'center',
  },
  editAction: { backgroundColor: '#dbeafe' },
  deleteAction: { backgroundColor: '#fee2e2' },
  cardActionText: { fontSize: 13, fontWeight: '600', color: '#1f2937' },

  // Modal
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
  modalBody: { padding: 16, maxHeight: 400 },

  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#f9fafb', borderWidth: 2, borderColor: '#e5e7eb',
    borderRadius: 8, padding: 10, fontSize: 15, marginBottom: 8,
  },
  textArea: { minHeight: 70, textAlignVertical: 'top' },

  vehicleList: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8,
    maxHeight: 200, overflow: 'scroll',
  },
  vehicleOption: {
    padding: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  vehicleOptionSelected: { backgroundColor: '#dbeafe' },
  vehiclePlate: { fontWeight: 'bold', color: '#1f2937', fontSize: 14 },
  vehicleName: { fontSize: 12, color: '#6b7280' },
  emptyText: { padding: 12, color: '#9ca3af', textAlign: 'center', fontStyle: 'italic' },

  selectedInfo: {
    backgroundColor: '#dcfce7', padding: 10, borderRadius: 8,
    marginTop: 8, gap: 4,
  },
  selectedInfoTitle: { fontWeight: 'bold', color: '#166534', marginBottom: 4 },

  modalActions: {
    flexDirection: 'row', gap: 8, padding: 16,
    borderTopWidth: 1, borderTopColor: '#e5e7eb',
  },
  modalButton: {
    flex: 1, padding: 12, borderRadius: 8, alignItems: 'center',
  },
  cancelButton: { backgroundColor: '#e5e7eb' },
  cancelButtonText: { color: '#374151', fontWeight: '600' },
  saveButton: { backgroundColor: '#ea580c' },
  saveButtonText: { color: 'white', fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
});
