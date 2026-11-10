// screens/TransferScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';

const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(title + '\n\n' + message);
    }
  } else {
    Alert.alert(title, message);
  }
};

// Lista canônica de departamentos (valores internos)
const DEPARTMENT_VALUES = [
  'education', 'health', 'administration', 'urbanism',
  'culture', 'sports', 'transportation', 'finance',
  'assistenci', 'tourism', 'environment',
  'instituto_profissoes', 'desenvolvimento', 'government'
];

const DEPARTMENT_NAMES = {
  'education': 'Educação',
  'health': 'Saúde',
  'administration': 'Administração',
  'urbanism': 'Urbanismo',
  'culture': 'Cultura',
  'sports': 'Esportes',
  'transportation': 'Transporte',
  'finance': 'Finanças',
  'assistenci': 'Assistência Comunitária',
  'tourism': 'Turismo',
  'environment': 'Meio Ambiente',
  'instituto_profissoes': 'Instituto de Profissões',
  'desenvolvimento': 'Desenvolvimento',
  'government': 'Governo'
};

// Normaliza qualquer valor (traduzido ou interno) para o valor interno
const normalizeDepartment = (value) => {
  if (!value) return '';
  // se já é um valor interno, retorna
  if (DEPARTMENT_VALUES.includes(value)) return value;
  // se é um nome traduzido, encontra o valor interno correspondente
  const found = Object.entries(DEPARTMENT_NAMES).find(
    ([key, name]) => name.toLowerCase() === String(value).toLowerCase()
  );
  if (found) return found[0];
  // se é "Instituto Profissões" (sem "de")
  if (String(value).toLowerCase().includes('instituto') && String(value).toLowerCase().includes('profiss')) {
    return 'instituto_profissoes';
  }
  // fallback: retorna o que veio
  return value;
};

const getDepartmentName = (dept) => {
  const normalized = normalizeDepartment(dept);
  return DEPARTMENT_NAMES[normalized] || dept;
};

export default function TransferScreen({ route, navigation }) {
  const { item } = route.params;
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [currentItem, setCurrentItem] = useState(item);
  const [formData, setFormData] = useState({
    to_department: '',
    target_sector: '',
    reason: ''
  });
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const headers = await getAuthHeaders();

      // 1) Buscar o patrimônio completo (para garantir que sector venha)
      if (!item.sector) {
        try {
          const resp = await fetch(`${API_BASE_URL}/api/patrimony/${item.id}`, { headers });
          if (resp.ok) {
            const full = await resp.json();
            setCurrentItem({ ...item, ...full });
          }
        } catch (e) {
          console.warn('Não foi possível buscar patrimônio completo:', e);
        }
      }

      // 2) Lista canônica de departamentos (sem duplicados)
      setDepartments(DEPARTMENT_VALUES);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!formData.to_department) {
      showAlert('Erro', 'Selecione o departamento de destino');
      return;
    }

    const currentDeptNormalized = normalizeDepartment(currentItem.department);
    if (formData.to_department === currentDeptNormalized) {
      showAlert('Erro', 'O departamento de destino é o mesmo do bem');
      return;
    }

    setLoading(true);
    try {
      const headers = await getAuthHeaders();

      // Monta o motivo incluindo o setor (backend não aceita target_sector separado)
      let reasonFinal = formData.reason || 'Transferência via mobile';
      if (formData.target_sector) {
        reasonFinal = reasonFinal + ' | Novo setor: ' + formData.target_sector;
      }

      const payload = {
        patrimony_id: currentItem.id,
        from_department: currentDeptNormalized || currentItem.department || '',
        to_department: formData.to_department,
        reason: reasonFinal,
      };

      // DEBUG
      showAlert(
        'DEBUG — Enviando',
        'patrimony_id: ' + payload.patrimony_id + '\n\n' +
        'from_department: ' + payload.from_department + '\n\n' +
        'to_department: ' + payload.to_department + '\n\n' +
        'reason: ' + payload.reason
      );

      const response = await fetch(`${API_BASE_URL}/api/transfer`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showAlert('DEBUG — Resposta', 'Status: ' + response.status + '\n\nSUCESSO!');
        showAlert('Sucesso', 'Bem transferido com sucesso!');
        navigation.goBack();
      } else {
        const errorText = await response.text();
        showAlert('DEBUG — Resposta', 'Status: ' + response.status + '\n\nErro: ' + errorText);
        showAlert('Erro', errorText || 'Erro ao transferir o bem');
      }
    } catch (error) {
      console.error('Erro na transferência:', error);
      showAlert('Erro de conexão', (error && error.message) || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transferir Bem</Text>
        <Text style={styles.subtitle}>{currentItem.name} - {currentItem.plate}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Departamento Atual:</Text>
        <Text style={styles.infoValue}>{getDepartmentName(currentItem.department)}</Text>

        <Text style={styles.infoLabel}>Setor Atual:</Text>
        <Text style={styles.infoValue}>
          {currentItem.sector ? currentItem.sector : '(não informado)'}
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Departamento de Destino *</Text>
        <View style={styles.selectContainer}>
          {departments.map(dept => (
            <TouchableOpacity
              key={dept}
              style={[
                styles.optionButton,
                formData.to_department === dept && styles.optionButtonSelected
              ]}
              onPress={() => setFormData({ ...formData, to_department: dept })}
              disabled={loading}
            >
              <Text style={styles.optionText}>{getDepartmentName(dept)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Novo Setor (opcional)</Text>
        <TextInput
          style={styles.input}
          value={formData.target_sector}
          onChangeText={(text) => setFormData({ ...formData, target_sector: text })}
          placeholder="Digite o novo setor"
          editable={!loading}
        />

        <Text style={styles.label}>Motivo / Observações</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.reason}
          onChangeText={(text) => setFormData({ ...formData, reason: text })}
          placeholder="Digite o motivo da transferência"
          multiline
          numberOfLines={3}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleTransfer}
          disabled={loading || !formData.to_department}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Confirmar Transferência</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cancelButton, loading && styles.buttonDisabled]}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 16 },
  header: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#6b7280' },
  infoCard: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  infoLabel: { fontSize: 14, color: '#6b7280', fontWeight: '500', marginBottom: 4 },
  infoValue: { fontSize: 16, color: '#1f2937', fontWeight: '600', marginBottom: 12 },
  form: { backgroundColor: 'white', padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  label: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 },
  selectContainer: { marginBottom: 20 },
  optionButton: { backgroundColor: '#f9fafb', padding: 15, borderRadius: 8, marginBottom: 8, borderWidth: 2, borderColor: '#e5e7eb' },
  optionButtonSelected: { borderColor: '#2563eb', backgroundColor: '#dbeafe' },
  optionText: { fontSize: 14, color: '#374151', textAlign: 'center' },
  input: { borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20, backgroundColor: '#f9fafb' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  button: { backgroundColor: '#059669', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  cancelButton: { backgroundColor: '#ef4444', padding: 16, borderRadius: 8, alignItems: 'center' },
  cancelButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
